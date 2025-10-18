// Utility functions for file handling

export const saveFileToUploads = async (
  file: File,
  fileName: string,
  metadata: {
    title: string;
    videoResolution: string;
    videoFPS: string;
    duration: number;
  },
): Promise<{ fileId: string; videoId: string }> => {
  // This function will be called from the component with Convex client
  // For now, return the file and metadata to be handled by the component
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
  const [width, height] = resolution.split("x").map(Number);
  return { width: width || 0, height: height || 0 };
};

export const parseVideoFPS = (fps: string): number => {
  const fpsMatch = fps.match(/(\d+)/);
  return fpsMatch ? parseInt(fpsMatch[1]) : 30;
};
