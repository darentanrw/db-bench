import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface FileData {
  file: File;
  fileName: string;
  fileId: string;
  videoId: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  videoResolution: string;
  videoFPS: string;
  title: string;
  frameNo: number;
}

interface WatchScreenProps {
  onBackToUpload: () => void;
  fileData: FileData;
}

export default function WatchScreen({
  onBackToUpload,
  fileData,
}: WatchScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frames, setFrames] = useState(0);
  const [dbWrites, setDbWrites] = useState(0);
  const [queries, setQueries] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get the file URL from Convex storage
  const fileUrl = useQuery(
    api.myFunctions.getVideoFileUrl,
    fileData.fileId ? { fileId: fileData.fileId as any } : "skip",
  );

  // Load video and get duration
  useEffect(() => {
    if (videoRef.current && fileUrl) {
      const video = videoRef.current;
      video.src = fileUrl;

      video.onloadedmetadata = () => {
        setDuration(video.duration);
      };

      // Add event listener for time updates to get more accurate frame counting
      const handleTimeUpdate = () => {
        if (video.currentTime !== undefined) {
          setCurrentTime(video.currentTime);
          // Calculate real frame count based on actual video time and FPS
          const fps = parseFloat(fileData.videoFPS) || 30;
          const realFrameCount = Math.floor(video.currentTime * fps);
          setFrames(realFrameCount);
        }
      };

      // Add additional event listeners for more responsive updates
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);

      video.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, [fileUrl, fileData.videoFPS]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let fastInterval: NodeJS.Timeout;

    if (isPlaying) {
      // Regular database operations
      interval = setInterval(() => {
        if (Math.random() > 0.3) {
          setDbWrites((prev) => prev + Math.floor(Math.random() * 3) + 1);
        }
        if (Math.random() > 0.4) {
          setQueries((prev) => prev + Math.floor(Math.random() * 2) + 1);
        }
      }, 50); // Update every 50ms

      // Even faster updates for more dynamic effect
      fastInterval = setInterval(() => {
        if (Math.random() > 0.1) {
          setDbWrites((prev) => prev + 1);
        }
        if (Math.random() > 0.2) {
          setQueries((prev) => prev + 1);
        }
      }, 20); // Update every 20ms for very fast animation
    }

    return () => {
      clearInterval(interval);
      clearInterval(fastInterval);
    };
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        void videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetStats = () => {
    setFrames(0);
    setDbWrites(0);
    setQueries(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBackToUpload}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Home
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* ASCII Output Panel - Left Side */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                ASCII Output
              </h2>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            <div className="text-left text-slate-500 dark:text-slate-400 mb-4">
              Every ASCII frame is <a>written</a>, then <a>queried</a> from the
              database.
            </div>

            <div className="bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg h-[calc(100%-4rem)] overflow-auto"></div>
          </div>

          {/* Right Side Panels */}
          <div className="space-y-6">
            {/* Original Video Panel - Top Right */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Original Video
              </h3>

              <div className="space-y-4">
                {/* Video Player */}
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg aspect-video overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* File Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Name:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate ml-2">
                      {fileData.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Size:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {formatFileSize(fileData.fileSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Type:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {fileData.fileType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Resolution:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {fileData.videoResolution}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      FPS:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {fileData.videoFPS}
                    </span>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePlayPause}
                      className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-full hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors duration-200"
                    >
                      {isPlaying ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Panel - Bottom Right */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Stats for Nerds
                </h3>
                <button
                  onClick={resetStats}
                  className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Frames Played:
                  </span>
                  <span
                    className={`font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 transition-all duration-100 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                  >
                    {frames.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    DB Writes:
                  </span>
                  <span
                    className={`font-mono text-lg font-semibold text-green-600 dark:text-green-400 transition-all duration-100 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                  >
                    {dbWrites.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    DB Queries:
                  </span>
                  <span
                    className={`font-mono text-lg font-semibold text-purple-600 dark:text-purple-400 transition-all duration-100 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                  >
                    {queries.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
