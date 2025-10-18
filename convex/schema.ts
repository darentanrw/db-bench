import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  video: defineTable({
    id: v.number(),
    title: v.string(),
    fileName: v.string(),
    fileId: v.string(), // Reference to Convex file storage
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
  }).index("by_upload_time", ["uploadTime"]),

  // maybe this should be in x, y rows of the table.
  frames: defineTable({
    pixelNo: v.number(),
    pixelData: v.string(),
  }),
});
