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

  const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
  const saveVideoMetadata = useMutation(api.myFunctions.saveVideoMetadata);

  const handleFileSelected = async (
    file: File,
    metadata: { videoResolution: string; videoFPS: string; duration: number },
  ) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Failed to upload file: ${result.statusText}`);
      }

      const { storageId } = await result.json();

      // Prepare metadata
      const fileName = `${Date.now()}-${file.name}`;
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const resolution = parseVideoResolution(metadata.videoResolution);
      const fps = parseVideoFPS(metadata.videoFPS);

      // Save video metadata to database
      const videoId = await saveVideoMetadata({
        fileName,
        fileId: storageId,
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
        fileId: storageId,
        videoId,
        filePath: `/uploads/${fileName}`,
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
