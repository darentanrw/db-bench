import { useState, useEffect } from "react";

interface ProcessingScreenProps {
  onProcessingComplete: () => void;
  videoFilePath: string;
}

export default function ProcessingScreen({
  onProcessingComplete,
  videoFilePath,
}: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing...");

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    const processVideo = async () => {
      try {
        setCurrentStep("Initializing...");
        setProgress(0);

        // Call the processing endpoint
        const response = await fetch("/api/process-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: videoFilePath,
          }),
        });

        if (!response.ok) {
          throw new Error(`Processing failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Processing result:", result);

        // Start polling for real progress
        // Extract basename from filePath like "/uploads/1760789903437.mp4" -> "1760789903437"
        const fileName = videoFilePath.split("/").pop() || ""; // "1760789903437.mp4"
        const videoBasename = fileName.replace(/\.[^/.]+$/, ""); // "1760789903437"
        console.log("Video file path:", videoFilePath);
        console.log("Extracted video basename:", videoBasename);

        const pollProgress = async () => {
          try {
            console.log(`Polling progress for: ${videoBasename}`);
            const progressResponse = await fetch(
              `/api/processing-progress/${videoBasename}`,
            );

            console.log(`Progress response status: ${progressResponse.status}`);

            if (!progressResponse.ok) {
              throw new Error(
                `Progress endpoint failed: ${progressResponse.status} ${progressResponse.statusText}`,
              );
            }

            const progressData = await progressResponse.json();
            console.log("Progress data:", progressData);
            console.log(`Setting progress to: ${progressData.progress}%`);

            setProgress(progressData.progress);

            if (progressData.originalCount === 0) {
              console.log("Setting step: Extracting frames...");
              setCurrentStep("Extracting frames...");
            } else if (
              progressData.progress < 100 &&
              !progressData.isComplete
            ) {
              const stepText = `Converting to ASCII... (${progressData.asciiCount}/${progressData.originalCount})`;
              console.log(`Setting step: ${stepText}`);
              setCurrentStep(stepText);
            } else if (
              progressData.isComplete ||
              progressData.progress >= 100
            ) {
              console.log("Processing complete!");
              setCurrentStep("Complete!");
              if (pollInterval) {
                clearInterval(pollInterval);
              }
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              setTimeout(() => onProcessingComplete(), 1000);
            }
          } catch (pollError) {
            console.error("Error polling progress:", pollError);
            setCurrentStep(
              `Error: ${pollError instanceof Error ? pollError.message : "Unknown error"}`,
            );
          }
        };

        // Test the progress endpoint directly first
        console.log("Testing progress endpoint...");
        try {
          const testResponse = await fetch(
            `/api/processing-progress/${videoBasename}`,
          );
          const testData = await testResponse.json();
          console.log("Direct test response:", testData);
        } catch (testError) {
          console.error("Direct test failed:", testError);
        }

        // Start polling immediately, then every 500ms
        void pollProgress();
        pollInterval = setInterval(() => void pollProgress(), 500);

        // Fallback timeout - if processing takes more than 5 minutes, assume it's complete
        timeoutId = setTimeout(
          () => {
            console.log("Processing timeout reached, assuming completion");
            setCurrentStep("Complete!");
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            setTimeout(() => onProcessingComplete(), 1000);
          },
          5 * 60 * 1000,
        ); // 5 minutes
      } catch (error) {
        console.error("Error processing video:", error);
        setCurrentStep("Error occurred");
        // Still complete after error to not block the user
        setTimeout(() => onProcessingComplete(), 2000);
      }
    };

    void processVideo();

    // Cleanup function
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onProcessingComplete, videoFilePath]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Processing Video
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Converting your video to ASCII art
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          <div className="space-y-6">
            <div className="flex justify-center">
              {/* <div className="relative w-24 h-24">
                <svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    className="text-blue-600 transition-all duration-300 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div> */}

              <div className="flex flex-col justify-center items-center my-4 gap-4">
                <p className="text-slate-600 dark:text-slate-400 mb-2 text-center">
                  Loading
                </p>
                <div className="flex justify-center items-center">
                  <svg
                    className="animate-spin h-6 w-6 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center">
              {/* <p className="text-slate-600 dark:text-slate-400 mb-2">
                {currentStep}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Debug: Progress = {progress}%, Step = "{currentStep}"
              </div> */}
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-500">
              This may take a few minutes depending on video length
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
