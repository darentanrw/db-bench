import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import UploadScreen from "./components/UploadScreen";
import ProcessingScreen from "./components/ProcessingScreen";
import WatchScreen from "./components/WatchScreen";
import { parseVideoResolution, parseVideoFPS } from "./utils/fileUtils";

type Screen = "upload" | "processing" | "watch";

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
  duration: number;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("upload");
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const saveVideoMetadata = useMutation(api.myFunctions.saveVideoMetadata);

  const handleFileSelected = async (
    file: File,
    metadata: { videoResolution: string; videoFPS: string; duration: number },
  ) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
      }

      const { filePath } = await uploadResponse.json();

      // Prepare metadata
      const fileName = `${Date.now()}-${file.name}`;
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const resolution = parseVideoResolution(metadata.videoResolution);
      const fps = parseVideoFPS(metadata.videoFPS);

      // Save video metadata to database
      const videoId = await saveVideoMetadata({
        fileName,
        fileId: filePath,
        fileSize: file.size,
        fileType: file.type,
        title,
        src_x_resolution: resolution.width,
        src_y_resolution: resolution.height,
        src_fps: fps,
        duration: metadata.duration,
      });

      // Create file data for the component
      const fileData: FileData = {
        file,
        fileName,
        fileId: filePath,
        videoId,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        videoResolution: metadata.videoResolution,
        videoFPS: metadata.videoFPS,
        title,
        duration: metadata.duration,
      };

      setUploadedFile(fileData);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };


  const handleStartProcessing = () => {
    setCurrentScreen("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentScreen("watch");
  };

  const handleBackToUpload = () => {
    setCurrentScreen("upload");
    setUploadedFile(null);
  };

  return (
    <>
      {currentScreen === "upload" && (
        <UploadScreen
          onFileSelected={handleFileSelected}
          onStartProcessing={handleStartProcessing}
          isUploading={isUploading}
          uploadError={uploadError}
        />
      )}

      {currentScreen === "processing" && (
        <ProcessingScreen onProcessingComplete={handleProcessingComplete} />
      )}

      {currentScreen === "watch" && uploadedFile && (
        <WatchScreen
          onBackToUpload={handleBackToUpload}
          fileData={uploadedFile}
        />
      )}
    </>
  );
}
