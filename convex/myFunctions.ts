import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
    // Query the database to get all items that are not completed
    const tasks = await ctx.db
      .query("frames")
      .withIndex("by_frame_number")
      .order("asc")
      .collect();
    return tasks;
  },
});

