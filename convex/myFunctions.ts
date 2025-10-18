import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

// File upload functions using the video table
export const saveVideoFile = mutation({
  args: {
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    title: v.string(),
    src_x_resolution: v.number(),
    src_y_resolution: v.number(),
    src_fps: v.number(),
    duration: v.number(),
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
      duration: args.duration,
      uploadTime: Date.now(),
    });
    return id;
  },
});

export const getVideoFiles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("video"),
      _creationTime: v.number(),
      id: v.number(),
      title: v.string(),
      fileName: v.string(),
      fileId: v.id("_storage"),
      fileSize: v.number(),
      fileType: v.string(),
      src_x_resolution: v.number(),
      src_y_resolution: v.number(),
      output_x_resolution: v.number(),
      output_y_resolution: v.number(),
      src_fps: v.number(),
      output_fps: v.number(),
      duration: v.number(),
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
  args: { fileId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

// Generate upload URL for file uploads
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save video metadata after file is uploaded
export const saveVideoMetadata = mutation({
  args: {
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    title: v.string(),
    src_x_resolution: v.number(),
    src_y_resolution: v.number(),
    src_fps: v.number(),
    duration: v.number(),
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
      duration: args.duration,
      uploadTime: Date.now(),
    });
    return id;
  },
});
