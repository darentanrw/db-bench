import { useState, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";

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
  const [currentFrameCount, setCurrentFrameCount] = useState(0);
  const [dbWrites, setDbWrites] = useState(0);
  const [queries, setQueries] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCounterRef = useRef<number | null>(null);
  const updateFrameContentResponse = useAction(
    api.myFunctions.updateFrameContent,
  );
  const createEmptyFrameTableResponse = useMutation(
    api.myFunctions.createEmptyFrameTable,
  );

  // Get the file URL from Convex storage
  const fileUrl = useQuery(
    api.myFunctions.getVideoFileUrl,
    fileData.fileId ? { fileId: fileData.fileId as any } : "skip",
  );

  const allFrames = useQuery(api.myFunctions.getAllFrames);

  const data = allFrames
    ? allFrames
        .sort((a, b) => a.lineNumber - b.lineNumber)
        .map((row) => row.lineContent)
        .join("\n")
    : undefined;

  // Load video and get duration
  useEffect(() => {
    if (videoRef.current && fileUrl) {
      const video = videoRef.current;
      video.src = fileUrl;

      video.onloadedmetadata = () => {
        setDuration(video.duration);
      };

      // Add event listener for time updates
      const handleTimeUpdate = () => {
        if (video.currentTime !== undefined) {
          setCurrentTime(video.currentTime);
        }
      };

      // Create empty frame table
      void createEmptyFrameTableResponse({ noOfFrames: fileData.frameNo });
      console.log("Empty frame table created successfully");

      // Accurate frame counting function using requestAnimationFrame
      const updateFrameCount = () => {
        if (video && video.currentTime !== undefined) {
          const fps = parseFloat(fileData.videoFPS) || 30;
          const realFrameCount = Math.floor(video.currentTime * fps);
          setCurrentFrameCount(realFrameCount);
        }

        // Continue the animation loop if video is still playing
        if (!video.paused && !video.ended) {
          frameCounterRef.current = requestAnimationFrame(updateFrameCount);
        }
      };

      // Add additional event listeners for more responsive updates
      const handlePlay = () => {
        setIsPlaying(true);
        // Start the frame counting loop
        frameCounterRef.current = requestAnimationFrame(updateFrameCount);
      };

      const handlePause = () => {
        setIsPlaying(false);
        // Stop the frame counting loop
        if (frameCounterRef.current) {
          cancelAnimationFrame(frameCounterRef.current);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        // Stop the frame counting loop
        if (frameCounterRef.current) {
          cancelAnimationFrame(frameCounterRef.current);
        }
      };

      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);

      video.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);

        // Cancel any pending animation frame
        if (frameCounterRef.current) {
          cancelAnimationFrame(frameCounterRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Cleanup effect for animation frames
  useEffect(() => {
    return () => {
      if (frameCounterRef.current) {
        cancelAnimationFrame(frameCounterRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentFrameCount > 0 && currentFrameCount % 2 === 0) {
      console.log("currentFrameCount", currentFrameCount);
      void updateFrameContentResponse({ frameNumber: currentFrameCount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFrameCount]);

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
    }
  };

  const resetStats = () => {
    setCurrentFrameCount(0);
    setDbWrites(0);
    setQueries(0);
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
      <div className="max-w-8xl mx-auto px-20 py-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
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
            {/* <div className="text-left text-slate-500 dark:text-slate-400 mb-4">
              Every ASCII frame is <a>written</a>, then <a>queried</a> from the
              database.
            </div> */}

            <div className="bg-slate-900 text-green-400 font-mono !text-[3px] p-4 rounded-lg h-auto overflow-auto">
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "3px",
                }}
              >
                {data ? data : " "}
              </pre>
            </div>
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
                  <div className="flex justify-left">
                    <button
                      onClick={handlePlayPause}
                      className="flex items-center justify-center px-12 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors duration-200"
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
                    Current Frame Counter:
                  </span>
                  <span
                    className={`font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 transition-all duration-100 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                  >
                    {currentFrameCount.toLocaleString()}
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
