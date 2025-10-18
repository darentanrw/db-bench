import { useState, useRef } from "react";

interface UploadScreenProps {
  onFileSelected: (
    file: File,
    metadata: { videoResolution: string; videoFPS: string; duration: number },
  ) => Promise<void>;
  onStartProcessing: () => void;
  isUploading?: boolean;
  uploadError?: string | null;
}

export default function UploadScreen({
  onFileSelected,
  onStartProcessing,
  isUploading = false,
  uploadError = null,
}: UploadScreenProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoResolution, setVideoResolution] = useState<string>("");
  const [videoFPS, setVideoFPS] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find((file) => file.type.startsWith("video/"));

    if (videoFile) {
      setSelectedFile(videoFile);
      loadVideoMetadata(videoFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      loadVideoMetadata(file);
    }
  };

  const handleProcessVideo = () => {
    if (selectedFile) {
      onStartProcessing();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadVideoMetadata = (file: File) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = async () => {
      const resolution = `${video.videoWidth}x${video.videoHeight}`;
      const duration = video.duration;

      // Try to get FPS from video properties
      const fps =
        video.getVideoPlaybackQuality?.()?.totalVideoFrames ||
        (video.duration > 0 ? Math.round(30) : 30); // Default to 30fps if we can't determine
      const fpsString = `${fps} fps`;

      // Update state for UI display
      setVideoResolution(resolution);
      setVideoDuration(duration);
      setVideoFPS(fpsString);

      // Call the callback with the actual metadata values
      await onFileSelected(file, {
        videoResolution: resolution,
        videoFPS: fpsString,
        duration: duration,
      });

      URL.revokeObjectURL(video.src);
    };

    video.onerror = async () => {
      setVideoResolution("Unknown");
      setVideoFPS("Unknown");
      setVideoDuration(0);

      // Call the callback with error values
      await onFileSelected(file, {
        videoResolution: "Unknown",
        videoFPS: "Unknown",
        duration: 0,
      });

      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            DB Bench
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            stress test your DB with videos!!!
          </p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
            isDragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-500 dark:text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                drop video here
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                or click to browse files
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors duration-200 font-medium"
              >
                choose file
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Selected File
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Name:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedFile.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Size:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Type:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedFile.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Resolution:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {videoResolution}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">FPS:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {videoFPS}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Duration:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {videoDuration > 0
                    ? `${Math.floor(videoDuration / 60)}:${Math.floor(
                        videoDuration % 60,
                      )
                        .toString()
                        .padStart(2, "0")}`
                    : "Unknown"}
                </span>
              </div>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  Upload failed: {uploadError}
                </p>
              </div>
            )}

            <button
              onClick={handleProcessVideo}
              disabled={isUploading}
              className={`w-full mt-6 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                isUploading
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isUploading ? "Uploading..." : "Process Video"}
            </button>
          </div>
        )}
        <div>
          <p className="text-slate-500 text-center dark:text-slate-400 my-4 px-20">
            *this is most definitely not the most comprehensive stress test, but
            it still shows you how fast convex is.
          </p>
        </div>
      </div>
    </div>
  );
}
