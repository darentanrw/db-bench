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

// Batched mutation to update all lines for a frame in a single request
export const updateFrameLinesBatch = mutation({
  args: {
    frameNumber: v.number(),
    lines: v.array(
      v.object({
        lineNumber: v.number(),
        lineContent: v.string(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Create an array of promises for patching each line
    const patchPromises = args.lines.map(async (line) => {
      // Query for the specific document using lineNumber
      const existingFrame = await ctx.db
        .query("frames")
        .withIndex("by_line_number", (q) => q.eq("lineNumber", line.lineNumber))
        .unique(); // Use unique() since lineNumber should be unique

      if (existingFrame) {
        // Patch the document with the new frameNumber and lineContent
        return ctx.db.patch(existingFrame._id, {
          frameNumber: args.frameNumber,
          lineContent: line.lineContent,
        });
      }
      return Promise.resolve(); // Resolve if frame not found, though it should exist
    });

    // Execute all patch operations in parallel
    await Promise.all(patchPromises);

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

      // Prepare all lines for batch update
      const linesToUpdate = [];
      for (let lineNumber = 0; lineNumber < linesArray.length; lineNumber++) {
        const lineContent = linesArray[lineNumber] || " "; // Default to space if line is empty
        linesToUpdate.push({
          lineNumber: lineNumber,
          lineContent: lineContent,
        });
      }

      // Update all lines for this frame in a single batched request
      await ctx.runMutation(api.myFunctions.updateFrameLinesBatch, {
        frameNumber: args.frameNumber,
        lines: linesToUpdate,
      });
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
