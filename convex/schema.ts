import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
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
    frameNo: v.optional(v.number()), // Made optional to handle existing data
    duration: v.optional(v.number()), // Keep for backward compatibility
    uploadTime: v.number(),
  }).index("by_upload_time", ["uploadTime"]),

  // maybe this should be in x, y rows of the table.
  frames: defineTable({
    frameNumber: v.number(),
    lineNumber: v.number(),
    lineContent: v.string(),
  })
    .index("by_frame_number", ["frameNumber"])
    .index("by_line_number", ["lineNumber"]),
});
