import { v } from "convex/values";
import { mutation, query } from "@/_generated/server";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get presigned URL for file upload to Convex storage
export const getUploadUrl = mutation({
  args: {
    assistantId: v.id("assistants"),
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) throw new Error("Assistant not found");

    // Verify file size (20MB limit)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (args.fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File too large, max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Verify file extension
    const allowedExtensions = [
      ".pdf",
      ".txt",
      ".md",
      ".html",
      ".htm",
      ".csv",
      ".json",
      ".docx",
      ".doc",
      ".rtf",
    ];
    const ext = args.filename
      .toLowerCase()
      .substring(args.filename.lastIndexOf("."));
    if (!allowedExtensions.includes(ext)) {
      throw new Error(
        `File type not supported. Allowed: ${allowedExtensions.join(", ")}`,
      );
    }

    // Generate upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();

    return { uploadUrl };
  },
});

// Confirm upload and create file record, then schedule RAG ingestion
export const processUploadedFile = mutation({
  args: {
    assistantId: v.id("assistants"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) throw new Error("Assistant not found");

    // Create file record
    const fileId = await ctx.db.insert("files", {
      assistantId: args.assistantId,
      storageId: args.storageId,
      name: args.filename,
      size: args.fileSize,
      type: args.contentType,
      status: "processing",
    });

    // Schedule RAG ingestion
    await ctx.scheduler.runAfter(
      0,
      internal.files.actions.ingestFileToRAG,
      { fileId },
    );

    return await ctx.db.get(fileId);
  },
});

// List files for an assistant
export const listFiles = query({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("files")
      .withIndex("by_assistantId", (q) =>
        q.eq("assistantId", args.assistantId),
      )
      .collect();
  },
});

// Get a specific file
export const getFile = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});

// Delete a file (from storage + RAG + DB)
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) return null;

    // Delete from Convex storage
    await ctx.storage.delete(file.storageId);

    // Schedule RAG cleanup
    await ctx.scheduler.runAfter(
      0,
      internal.files.actions.removeFileFromRAG,
      { fileId: args.fileId, assistantId: file.assistantId },
    );

    // Delete file record
    await ctx.db.delete(args.fileId);
    return null;
  },
});
