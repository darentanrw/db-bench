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

// Extend Express types for custom properties
declare module "express-serve-static-core" {
  interface Request {
    connectionId: string;
  }
}

declare module "net" {
  interface Socket {
    connectionId: string;
  }
}

dotenv.config({ path: ".env" }); // Corrected path

console.log("CONVEX_URL:", process.env.CONVEX_URL);

const app = express();
const port = 3001;

// Connection tracking
const activeConnections = new Set();
let totalRequests = 0;
let completedRequests = 0;

// Log connection events
app.use((req, res, next) => {
  const connectionId = `${req.ip}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.connectionId = connectionId;
  activeConnections.add(connectionId);
  totalRequests++;

  console.log(
    `[${new Date().toISOString()}] NEW CONNECTION ${connectionId} | Active: ${activeConnections.size} | Total: ${totalRequests}`,
  );
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} | Headers: ${JSON.stringify(req.headers)}`,
  );

  // Track response completion
  const originalEnd = res.end.bind(res);
  res.end = (chunk?: any, encoding?: any, cb?: any) => {
    activeConnections.delete(connectionId);
    completedRequests++;
    console.log(
      `[${new Date().toISOString()}] RESPONSE SENT ${connectionId} | Status: ${res.statusCode} | Active: ${activeConnections.size} | Completed: ${completedRequests}`,
    );
    return originalEnd(chunk, encoding, cb);
  };

  // Track connection close
  req.on("close", () => {
    activeConnections.delete(connectionId);
    console.log(
      `[${new Date().toISOString()}] CONNECTION CLOSED ${connectionId} | Active: ${activeConnections.size}`,
    );
  });

  req.on("error", (err) => {
    console.error(
      `[${new Date().toISOString()}] REQUEST ERROR ${connectionId}:`,
      err,
    );
    activeConnections.delete(connectionId);
  });

  res.on("error", (err) => {
    console.error(
      `[${new Date().toISOString()}] RESPONSE ERROR ${connectionId}:`,
      err,
    );
    activeConnections.delete(connectionId);
  });

  next();
});

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
  console.log(
    `[${new Date().toISOString()}] UPLOAD REQUEST ${req.connectionId} | File: ${req.file?.originalname} | Size: ${req.file?.size}`,
  );

  if (!req.file) {
    console.log(
      `[${new Date().toISOString()}] UPLOAD ERROR ${req.connectionId} | No file uploaded`,
    );
    return res.status(400).send("No file uploaded.");
  }

  console.log(
    `[${new Date().toISOString()}] UPLOAD SUCCESS ${req.connectionId} | Saved as: ${req.file.filename}`,
  );
  return res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.post("/api/process-video", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] PROCESS VIDEO REQUEST ${req.connectionId} | Body: ${JSON.stringify(req.body)}`,
  );

  try {
    const { filePath } = req.body;

    if (!filePath) {
      console.log(
        `[${new Date().toISOString()}] PROCESS VIDEO ERROR ${req.connectionId} | No file path provided`,
      );
      return res.status(400).json({ error: "No file path provided" });
    }

    // Extract the filename from the filePath (remove /uploads/ prefix)
    const fileName = path.basename(filePath);
    const videoBasename = path.basename(fileName, path.extname(fileName));
    const fullVideoPath = path.join(process.cwd(), "uploads", fileName);

    console.log(
      `[${new Date().toISOString()}] PROCESS VIDEO ${req.connectionId} | File: ${fileName} | Full path: ${fullVideoPath}`,
    );

    // Check if the video file exists
    if (!fs.existsSync(fullVideoPath)) {
      console.log(
        `[${new Date().toISOString()}] PROCESS VIDEO ERROR ${req.connectionId} | Video file not found: ${fullVideoPath}`,
      );
      return res.status(404).json({ error: "Video file not found" });
    }

    // Use the script with the video file as an argument
    const scriptPath = path.join(process.cwd(), "scripts", "make_images.sh");

    // Make sure the script is executable
    fs.chmodSync(scriptPath, "755");

    // Execute the script in the background
    console.log(
      `[${new Date().toISOString()}] Starting background processing for video: ${fileName}`,
    );

    const child = spawn("bash", [scriptPath, fullVideoPath], {
      stdio: ["pipe", "pipe", "pipe"],
      detached: true, // Run in background
    });

    // Log child process events
    child.on("spawn", () => {
      console.log(
        `[${new Date().toISOString()}] CHILD PROCESS SPAWNED ${req.connectionId} | PID: ${child.pid}`,
      );
    });

    child.on("error", (err) => {
      console.error(
        `[${new Date().toISOString()}] CHILD PROCESS ERROR ${req.connectionId}:`,
        err,
      );
    });

    child.on("exit", (code, signal) => {
      console.log(
        `[${new Date().toISOString()}] CHILD PROCESS EXITED ${req.connectionId} | Code: ${code} | Signal: ${signal}`,
      );
    });

    // Don't wait for the child process to complete
    child.unref();

    console.log(
      `[${new Date().toISOString()}] PROCESS VIDEO SUCCESS ${req.connectionId} | Started processing: ${videoBasename}`,
    );

    // Return immediately to allow progress polling to start
    res.json({
      success: true,
      message: "Video processing started",
      videoBasename: videoBasename,
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] PROCESS VIDEO EXCEPTION ${req.connectionId}:`,
      error,
    );
    res.status(500).json({
      error: "Failed to start video processing",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Endpoint to check processing progress by counting actual files
app.get("/api/processing-progress/:videoBasename", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] PROGRESS REQUEST ${req.connectionId} | Video: ${req.params.videoBasename}`,
  );

  try {
    const { videoBasename } = req.params;
    const originalFramesDir = path.join(process.cwd(), "video-original-frames");
    const asciiFramesDir = path.join(process.cwd(), "video-ascii-frames");

    console.log(
      `[${new Date().toISOString()}] PROGRESS CHECK ${req.connectionId} | Checking dirs: ${originalFramesDir}, ${asciiFramesDir}`,
    );

    // Count files in each directory
    let originalCount = 0;
    let asciiCount = 0;

    if (fs.existsSync(originalFramesDir)) {
      const files = fs.readdirSync(originalFramesDir);
      originalCount = files.filter((f) => f.endsWith(".jpg")).length;
      console.log(
        `[${new Date().toISOString()}] PROGRESS CHECK ${req.connectionId} | Original frames dir exists, found ${originalCount} jpg files`,
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] PROGRESS CHECK ${req.connectionId} | Original frames dir does not exist`,
      );
    }

    if (fs.existsSync(asciiFramesDir)) {
      const files = fs.readdirSync(asciiFramesDir);
      asciiCount = files.filter((f) => f.endsWith(".txt")).length;
      console.log(
        `[${new Date().toISOString()}] PROGRESS CHECK ${req.connectionId} | ASCII frames dir exists, found ${asciiCount} txt files`,
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] PROGRESS CHECK ${req.connectionId} | ASCII frames dir does not exist`,
      );
    }

    const progress =
      originalCount > 0 ? Math.round((asciiCount / originalCount) * 100) : 0;

    console.log(
      `[${new Date().toISOString()}] PROGRESS RESULT ${req.connectionId} | Progress for ${videoBasename}: ${asciiCount}/${originalCount} (${progress}%)`,
    );

    const response = {
      originalCount,
      asciiCount,
      progress,
      isComplete: asciiCount > 0 && asciiCount === originalCount,
    };

    console.log(
      `[${new Date().toISOString()}] PROGRESS RESPONSE ${req.connectionId} | Sending: ${JSON.stringify(response)}`,
    );
    res.json(response);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] PROGRESS ERROR ${req.connectionId}:`,
      error,
    );
    res.status(500).json({ error: "Failed to get progress" });
  }
});

// Route to get ASCII frame content
app.post("/api/getFile", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] ASCII FRAME REQUEST ${req.connectionId} | Body: ${JSON.stringify(req.body)}`,
  );

  try {
    const { frameNumber } = req.body;

    if (!frameNumber || isNaN(parseInt(frameNumber))) {
      console.log(
        `[${new Date().toISOString()}] ASCII FRAME ERROR ${req.connectionId} | Invalid frame number: ${frameNumber}`,
      );
      return res.status(400).json({ error: "Invalid frame number" });
    }

    const frameNum = parseInt(frameNumber);
    const frameFileName = `out${String(frameNum).padStart(4, "0")}.jpg.txt`;
    const filePath = path.join(
      process.cwd(),
      "video-ascii-frames",
      frameFileName,
    );

    console.log(
      `[${new Date().toISOString()}] ASCII FRAME CHECK ${req.connectionId} | Looking for file: ${filePath}`,
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(
        `[${new Date().toISOString()}] ASCII FRAME ERROR ${req.connectionId} | File not found: ${filePath}`,
      );
      return res.status(404).json({ error: "ASCII frame file not found" });
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split("\n");

    console.log(
      `[${new Date().toISOString()}] ASCII FRAME SUCCESS ${req.connectionId} | Read ${lines.length} lines from ${frameFileName}`,
    );

    const response = {
      frameNumber: frameNum,
      fileName: frameFileName,
      content: fileContent,
      lines: lines,
      lineCount: lines.length,
    };

    res.json(response);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] ASCII FRAME EXCEPTION ${req.connectionId}:`,
      error,
    );
    res.status(500).json({ error: "Failed to read ASCII frame file" });
  }
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(
    `[${new Date().toISOString()}] GLOBAL ERROR HANDLER:`,
    err.stack,
  );
  res.status(500).send("Something broke!");
});

const server = app.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] SERVER STARTED | Listening on port ${port}`,
  );
});

// Server connection tracking
server.on("connection", (socket) => {
  const connectionId = `socket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  socket.connectionId = connectionId;

  console.log(
    `[${new Date().toISOString()}] NEW SOCKET CONNECTION ${connectionId} | Remote: ${socket.remoteAddress}:${socket.remotePort} | Local: ${socket.localAddress}:${socket.localPort}`,
  );

  socket.on("close", () => {
    console.log(
      `[${new Date().toISOString()}] SOCKET CLOSED ${connectionId} | Remote: ${socket.remoteAddress}:${socket.remotePort}`,
    );
  });

  socket.on("error", (err) => {
    console.error(
      `[${new Date().toISOString()}] SOCKET ERROR ${connectionId}:`,
      err,
    );
  });

  socket.on("timeout", () => {
    console.log(`[${new Date().toISOString()}] SOCKET TIMEOUT ${connectionId}`);
  });
});

server.on("error", (err) => {
  console.error(`[${new Date().toISOString()}] SERVER ERROR:`, err);
});

// Periodic connection status logging
setInterval(() => {
  console.log(
    `[${new Date().toISOString()}] CONNECTION STATUS | Active: ${activeConnections.size} | Total Requests: ${totalRequests} | Completed: ${completedRequests}`,
  );
}, 30000); // Log every 30 seconds
