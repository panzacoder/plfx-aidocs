import { v } from "convex/values";
import { internalMutation, internalQuery } from "@/_generated/server";

// Update a file's fields
export const updateFile = internalMutation({
  args: {
    fileId: v.id("files"),
    externalId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed")
    )),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const updateFields: Record<string, any> = {
      lastUpdated: Date.now(),
    };
    
    if (args.externalId !== undefined) updateFields.externalId = args.externalId;
    if (args.status !== undefined) updateFields.status = args.status;
    if (args.metadata !== undefined) updateFields.metadata = args.metadata;
    
    await ctx.db.patch(args.fileId, updateFields);
    return await ctx.db.get(args.fileId);
  },
});

// Get a file by ID (internal use only)
export const getFile = internalQuery({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});

// Update file with storage ID after upload
export const updateFileWithStorageId = internalMutation({
  args: {
    assistantId: v.id("assistants"),
    filename: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Find the file record by assistant and filename
    const file = await ctx.db
      .query("files")
      .withIndex("by_assistant", (q) => q.eq("assistantId", args.assistantId))
      .filter((q) => q.eq(q.field("name"), args.filename))
      .filter((q) => q.eq(q.field("status"), "uploading"))
      .first();

    if (!file) {
      throw new Error("File record not found or already processed");
    }

    // Update the file record with storage ID and mark as processing
    await ctx.db.patch(file._id, {
      storageId: args.storageId,
      status: "processing",
      lastUpdated: Date.now(),
    });

    return file._id;
  },
}); 