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
  res.json({ filePath: `/uploads/${req.file.filename}` });
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
