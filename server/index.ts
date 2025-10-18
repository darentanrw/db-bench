process.on("uncaughtException", (err, origin) => {
  console.error("Caught exception:", err, "Exception origin:", origin);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

import express from "express";
/*
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
*/
import dotenv from "dotenv";
import multer from "multer"; // Uncommented
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

dotenv.config({ path: ".env" }); // Corrected path

console.log("CONVEX_URL:", process.env.CONVEX_URL);

const app = express();
const port = 3001;

// const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  },
});

const upload = multer({ storage: storage });

app.use(express.json());

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  return res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.post("/api/process-video", (req, res) => {
  void (async () => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: "No file path provided" });
      }

      // Extract the filename from the filePath (remove /uploads/ prefix)
      const fileName = path.basename(filePath);
      const videoBasename = path.basename(fileName, path.extname(fileName));
      const fullVideoPath = path.join(process.cwd(), "uploads", fileName);

      // Check if the video file exists
      if (!fs.existsSync(fullVideoPath)) {
        return res.status(404).json({ error: "Video file not found" });
      }

      // Use the script with the video file as an argument
      const scriptPath = path.join(process.cwd(), "scripts", "make_images.sh");

      // Make sure the script is executable
      fs.chmodSync(scriptPath, "755");

      // Execute the script with real-time output
      console.log(`Executing script for video: ${fileName}`);

      let frameCount = 0;
      let totalFrames = 0;

      // Use spawn instead of execAsync for real-time output
      // Pass the video file path as an argument to the script
      const child = spawn("bash", [scriptPath, fullVideoPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;

        // Parse frame output to track progress
        const lines = output.split("\n");
        lines.forEach((line: string) => {
          if (line.includes("Processed:") && line.includes(".jpg")) {
            frameCount++;
            // Extract frame number to estimate total
            const match = line.match(/out(\d+)\.jpg/);
            if (match) {
              const frameNum = parseInt(match[1]);
              totalFrames = Math.max(totalFrames, frameNum);
            }
          }
        });

        console.log(
          `Processed frames: ${frameCount}, Total estimated: ${totalFrames}`,
        );
      });

      child.stderr.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        console.log("stderr:", output);
      });

      child.on("close", (code) => {
        console.log(`Script execution completed with code ${code}`);
        console.log("stdout:", stdout);
        if (stderr) console.log("stderr:", stderr);

        // Check if processing was successful
        if (code === 0) {
          res.json({
            success: true,
            message: "Video processing completed successfully",
            stdout: stdout,
            stderr: stderr,
            frameCount: frameCount,
            totalFrames: totalFrames,
            videoBasename: videoBasename,
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Video processing failed",
            stdout: stdout,
            stderr: stderr,
            exitCode: code,
          });
        }
      });

      child.on("error", (error) => {
        console.error("Script execution error:", error);
        res.status(500).json({
          error: "Failed to execute script",
          details: error.message,
        });
      });
    } catch (error) {
      console.error("Error processing video:", error);
      res.status(500).json({
        error: "Failed to process video",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })();
});

// Endpoint to check processing progress by counting actual files
app.get("/api/processing-progress/:videoBasename", (req, res) => {
  try {
    const { videoBasename: _videoBasename } = req.params;
    const originalFramesDir = path.join(process.cwd(), "video-original-frames");
    const asciiFramesDir = path.join(process.cwd(), "video-ascii-frames");

    // Count files in each directory
    let originalCount = 0;
    let asciiCount = 0;

    if (fs.existsSync(originalFramesDir)) {
      const files = fs.readdirSync(originalFramesDir);
      originalCount = files.filter((f) => f.endsWith(".jpg")).length;
    }

    if (fs.existsSync(asciiFramesDir)) {
      const files = fs.readdirSync(asciiFramesDir);
      asciiCount = files.filter((f) => f.endsWith(".txt")).length;
    }

    const progress =
      originalCount > 0 ? Math.round((asciiCount / originalCount) * 100) : 0;

    res.json({
      originalCount,
      asciiCount,
      progress,
      isComplete: asciiCount > 0 && asciiCount === originalCount,
    });
  } catch (error) {
    console.error("Error getting progress:", error);
    res.status(500).json({ error: "Failed to get progress" });
  }
});

/*
app.get("/listNumbers", async (req, res) => {
  const { count } = req.query;
  const numbers = await convex.query(api.myFunctions.listNumbers, {
    count: Number(count),
  });
  res.json(numbers);
});

app.post("/addNumber", async (req, res) => {
  const { value } = req.body;
  await convex.mutation(api.myFunctions.addNumber, { value });
  res.json({ success: true });
});

app.post("/myAction", async (req, res) => {
    const { first, second } = req.body;
    await convex.action(api.myFunctions.myAction, { first, second });
    res.json({ success: true });
});

app.get("/getVideoFiles", async (req, res) => {
    const videos = await convex.query(api.myFunctions.getVideoFiles, {});
    res.json(videos);
});

app.get("/getVideoFileUrl", async (req, res) => {
    const { fileId } = req.query;
    const url = await convex.query(api.myFunctions.getVideoFileUrl, {
        fileId: fileId as any,
    });
    res.json({ url });
});

app.post("/saveVideoMetadata", async (req, res) => {
    const { fileName, fileId, fileSize, fileType, title, src_x_resolution, src_y_resolution, src_fps, duration } = req.body;
    const result = await convex.mutation(api.myFunctions.saveVideoMetadata, {
        fileName,
        fileId,
        fileSize,
        fileType,
        title,
        src_x_resolution,
        src_y_resolution,
        src_fps,
        duration,
    });
    res.json(result);
});
*/

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
