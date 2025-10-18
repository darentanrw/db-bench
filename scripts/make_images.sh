mkdir -p video-original-frames
ffmpeg -i video-original.mp4 -vf fps=30 video-original-frames/out%04d.jpg

rm  video-ascii-frames/*
mkdir -p video-ascii-frames

files=($PWD/video-original-frames/*)
total_files=${#files[@]}
batch_size=$(( (total_files + 49) / 50 )) # Ensure all frames are processed

process_batch() {
  start_index=$1
  end_index=$((start_index + batch_size - 1))

  if [[ $end_index -ge $total_files ]]; then
    end_index=$((total_files - 1))
  fi

  for ((i=start_index; i<=end_index && i<total_files; i++)); do
    file=${files[$i]}
    filename=$(basename "$file")
    echo $filename
    ascii-image-converter $file > video-ascii-frames/$filename.txt -d 375,300
  done
}

for ((i=0; i<50 && i*batch_size<total_files; i++)); do
  process_batch $((i * batch_size)) &
done

wait
