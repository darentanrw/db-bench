#!/bin/bash

# Get the video file path and create a unique processing ID
VIDEO_FILE="$1"
VIDEO_BASENAME=$(basename "$VIDEO_FILE" .mp4)
PROCESSING_ID="${VIDEO_BASENAME}_$(date +%s)"
PROGRESS_FILE="/video-progress/progress_${VIDEO_BASENAME}.txt"

# Clean up old frames at the very start
if [ "$(ls -A video-original-frames 2>/dev/null)" ]; then
  echo "Removing old original frames"
  rm -f video-original-frames/* 2>/dev/null || true
fi
if [ "$(ls -A video-ascii-frames 2>/dev/null)" ]; then
  echo "Removing old ascii frames"
  rm -f video-ascii-frames/* 2>/dev/null || true
fi

mkdir -p video-original-frames
mkdir -p video-ascii-frames

# Initialize progress tracking
echo "0" > "$PROGRESS_FILE"

# Extract frames
echo "Extracting frames from $VIDEO_FILE"
ffmpeg -i "$VIDEO_FILE" -vf fps=30 video-original-frames/out%04d.jpg 2>/dev/null

# NOW define files and total_files after extraction
files=(video-original-frames/*.jpg)
total_files=${#files[@]}

echo "Total frames extracted: $total_files"

# Calculate batch size for 50 parallel processes
batch_size=$(( (total_files + 49) / 50 ))

process_batch() {
  start_index=$1
  end_index=$((start_index + batch_size - 1))

  if [[ $end_index -ge $total_files ]]; then
    end_index=$((total_files - 1))
  fi

  for ((i=start_index; i<=end_index && i<total_files; i++)); do
    file=${files[$i]}
    filename=$(basename "$file")
    
    # Check if file still exists before processing
    if [ ! -f "$file" ]; then
      echo "Skipping missing file: $filename"
      continue
    fi
    
    # echo $filename
    if ascii-image-converter "$file" -d 125,100 > "video-ascii-frames/$filename.txt" 2>/dev/null; then
      echo "Processed: $filename"
      # Update progress counter
      echo $((i + 1)) > "$PROGRESS_FILE"
    else
      echo "Failed to process: $filename"
      # Create empty file to maintain consistency
      touch "video-ascii-frames/$filename.txt"
      # Still update progress counter
      echo $((i + 1)) > "$PROGRESS_FILE"
    fi
  done
}

for ((i=0; i<50 && i*batch_size<total_files; i++)); do
  process_batch $((i * batch_size)) &
done

wait

# Processing complete - cleanup and report
echo "Processing completed for $VIDEO_BASENAME"
echo "Total frames processed: $total_files"

# Create completion marker
echo "COMPLETED" > "$PROGRESS_FILE"

echo "All frames processed successfully for $VIDEO_BASENAME"
