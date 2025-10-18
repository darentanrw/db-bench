import { useState, useEffect } from "react";

interface WatchScreenProps {
  onBackToUpload: () => void;
}

export default function WatchScreen({ onBackToUpload }: WatchScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(120); // Mock 2 minute duration
  const [frames, setFrames] = useState(0);
  const [dbWrites, setDbWrites] = useState(0);
  const [queries, setQueries] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });

        // Simulate real-time statistics updates
        setFrames((prev) => prev + 1);
        if (Math.random() > 0.7) {
          setDbWrites((prev) => prev + 1);
        }
        if (Math.random() > 0.8) {
          setQueries((prev) => prev + 1);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
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
                {/* Video Placeholder */}
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center text-slate-500 dark:text-slate-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <p className="text-sm">Video Player</p>
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
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Stats for Nerds
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Frames Rendered:
                  </span>
                  <span className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {frames.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    DB Writes:
                  </span>
                  <span className="font-mono text-lg font-semibold text-green-600 dark:text-green-400">
                    {dbWrites.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Queries:
                  </span>
                  <span className="font-mono text-lg font-semibold text-purple-600 dark:text-purple-400">
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
