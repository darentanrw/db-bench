import { useState, useEffect } from "react";

interface ProcessingScreenProps {
  onProcessingComplete: () => void;
}

export default function ProcessingScreen({
  onProcessingComplete,
}: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing...");

  useEffect(() => {
    const steps = [
      "Initializing...",
      "Extracting frames...",
      "Converting to ASCII...",
      "Optimizing output...",
      "Finalizing...",
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15 + 5;
        if (newProgress >= 100) {
          setCurrentStep("Complete!");
          setTimeout(() => onProcessingComplete(), 1000);
          clearInterval(interval);
          return 100;
        }

        if (newProgress > (currentStepIndex + 1) * 20) {
          currentStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);
          setCurrentStep(steps[currentStepIndex]);
        }

        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onProcessingComplete]);

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
              <div className="relative w-24 h-24">
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
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {currentStep}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
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
