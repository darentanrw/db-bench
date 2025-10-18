
import express from "express";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

app.use(express.json());

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

app.post("/saveVideoFile", async (req, res) => {
    const { fileName, fileId, fileSize, fileType, title, src_x_resolution, src_y_resolution, src_fps, duration } = req.body;
    const result = await convex.mutation(api.myFunctions.saveVideoFile, {
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

app.post("/generateUploadUrl", async (req, res) => {
    const url = await convex.mutation(api.myFunctions.generateUploadUrl, {});
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
