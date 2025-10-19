import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// Video-related functions

export const getVideoFiles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("video"),
      _creationTime: v.number(),
      id: v.number(),
      title: v.string(),
      fileName: v.string(),
      fileId: v.string(),
      fileSize: v.number(),
      fileType: v.string(),
      src_x_resolution: v.number(),
      src_y_resolution: v.number(),
      output_x_resolution: v.number(),
      output_y_resolution: v.number(),
      src_fps: v.number(),
      output_fps: v.number(),
      frameNo: v.optional(v.number()),
      duration: v.optional(v.number()),
      uploadTime: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const videos = await ctx.db
      .query("video")
      .withIndex("by_upload_time")
      .order("desc")
      .collect();
    return videos;
  },
});

export const getVideoFileUrl = query({
  args: { fileId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (_ctx, args) => {
    return args.fileId;
  },
});

// Save video metadata after file is uploaded
export const saveVideoMetadata = mutation({
  args: {
    fileName: v.string(),
    fileId: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    title: v.string(),
    src_x_resolution: v.number(),
    src_y_resolution: v.number(),
    src_fps: v.number(),
    frameNo: v.number(),
  },
  returns: v.id("video"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("video", {
      id: Date.now(), // Use timestamp as unique ID
      title: args.title,
      fileName: args.fileName,
      fileId: args.fileId,
      fileSize: args.fileSize,
      fileType: args.fileType,
      src_x_resolution: args.src_x_resolution,
      src_y_resolution: args.src_y_resolution,
      output_x_resolution: args.src_x_resolution, // Default to same as source
      output_y_resolution: args.src_y_resolution, // Default to same as source
      src_fps: args.src_fps,
      output_fps: args.src_fps, // Default to same as source
      frameNo: args.frameNo,
      uploadTime: Date.now(),
    });
    return id;
  },
});

export const createEmptyFrameTable = mutation({
  args: {
    noOfFrames: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // delete existing rows of data first
    await ctx.db
      .query("frames")
      .collect()
      .then((rows) => {
        for (const row of rows) {
          void ctx.db.delete(row._id);
        }
      });

    for (let i = 0; i < args.noOfFrames; i++) {
      await ctx.db.insert("frames", {
        frameNumber: -1,
        lineNumber: i,
        lineContent: " ",
      });
    }
  },
});

export const getAllFrames = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("frames")
      .withIndex("by_frame_number")
      .order("asc")
      .collect();
    return tasks;
  },
});

// Mutation to update frame content in the database
export const updateFrameLine = mutation({
  args: {
    frameId: v.id("frames"),
    frameNumber: v.number(),
    lineNumber: v.number(),
    lineContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.frameId, {
      frameNumber: args.frameNumber,
      lineNumber: args.lineNumber,
      lineContent: args.lineContent,
    });
    return null;
  },
});

export const updateFrameContent = action({
  args: {
    frameNumber: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    "use node";

    try {
      // Get the Convex deployment URL from environment
      // const convexUrl = process.env.CONVEX_URL;
      // const convexUrl = "http://localhost:5173";
      const expressURL = "http://host.docker.internal:3001";

      // Fetch ASCII content from the Convex HTTP endpoint
      const response = await fetch(`${expressURL}/api/getFile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frameNumber: args.frameNumber,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            `ASCII frame file not found for frame ${args.frameNumber}`,
          );
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const lines = data.content;

      const linesArray = lines.split("\n");

      // Get all existing frames to find the correct IDs
      const existingFrames = await ctx.runQuery(
        api.myFunctions.getAllFrames,
        {},
      );

      // Update each line in the frames table
      for (let lineNumber = 0; lineNumber < linesArray.length; lineNumber++) {
        const lineContent = linesArray[lineNumber] || " "; // Default to space if line is empty

        // Find the frame with the matching line number
        const frameToUpdate = existingFrames.find(
          (frame) => frame.lineNumber === lineNumber,
        );

        if (frameToUpdate) {
          await ctx.runMutation(api.myFunctions.updateFrameLine, {
            frameId: frameToUpdate._id,
            frameNumber: args.frameNumber,
            lineNumber: lineNumber,
            lineContent: lineContent,
          });
        }
      }
    } catch (error) {
      console.error(
        `Error updating frame content for frame ${args.frameNumber}:`,
        error,
      );
      // If file doesn't exist or other error, we'll just skip this frame
    }

    return null;
  },
});
