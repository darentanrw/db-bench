// Utility functions for file handling

export const saveFileToUploads = async (
  _file: File,
  _fileName: string,
  _metadata: {
    title: string;
    videoResolution: string;
    videoFPS: string;
    duration: number;
  },
): Promise<{ fileId: string; videoId: string }> => {
  return {
    fileId: "", // Will be set by Convex
    videoId: "", // Will be set by Convex
  };
};

export const getFileFromUploads = (fileName: string): string | null => {
  const files = JSON.parse(localStorage.getItem("uploadedFiles") || "[]");
  const fileData = files.find((f: any) => f.name === fileName);
  return fileData ? fileData.blobUrl : null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const parseVideoResolution = (
  resolution: string,
): { width: number; height: number } => {
  console.log("Parsing resolution:", resolution);

  // Handle edge cases
  if (!resolution || resolution === "Unknown" || resolution === "") {
    console.log("Invalid resolution string, returning 0x0");
    return { width: 0, height: 0 };
  }

  const parts = resolution.split("x");
  if (parts.length !== 2) {
    console.log(
      "Invalid resolution format, expected 'WIDTHxHEIGHT', got:",
      resolution,
    );
    return { width: 0, height: 0 };
  }

  const width = parseInt(parts[0], 10);
  const height = parseInt(parts[1], 10);

  console.log("Parsed width:", width, "height:", height);

  // Validate that we got valid numbers
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    console.log("Invalid width or height values");
    return { width: 0, height: 0 };
  }

  return { width, height };
};

export const parseVideoFPS = (fps: string): number => {
  const fpsMatch = fps.match(/(\d+)/);
  return fpsMatch ? parseInt(fpsMatch[1]) : 30;
};

export const calculateFrameNumber = (duration: number, fps: number): number => {
  return Math.floor(duration * fps);
};
