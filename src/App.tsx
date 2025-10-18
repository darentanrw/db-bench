import { useState } from "react";
import UploadScreen from "./components/UploadScreen";
import ProcessingScreen from "./components/ProcessingScreen";
import WatchScreen from "./components/WatchScreen";

type Screen = "upload" | "processing" | "watch";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("upload");

  const handleFileSelected = (_file: File) => {
    // File selected, ready for processing
  };

  const handleStartProcessing = () => {
    setCurrentScreen("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentScreen("watch");
  };

  const handleBackToUpload = () => {
    setCurrentScreen("upload");
  };

  return (
    <>
      {currentScreen === "upload" && (
        <UploadScreen
          onFileSelected={handleFileSelected}
          onStartProcessing={handleStartProcessing}
        />
      )}

      {currentScreen === "processing" && (
        <ProcessingScreen onProcessingComplete={handleProcessingComplete} />
      )}

      {currentScreen === "watch" && (
        <WatchScreen onBackToUpload={handleBackToUpload} />
      )}
    </>
  );
}
