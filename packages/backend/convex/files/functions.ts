import { v } from "convex/values";
import { mutation, query, action } from "@/_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { Files } from "./schema";

const fileValidator = v.object({
  _id: v.id("files"),
  _creationTime: v.number(),
  assistantId: v.id("assistants"),
  externalId: v.string(),
  name: v.string(),
  purpose: v.union(v.literal("assistants")),
  size: v.number(),
  type: v.string(),
  status: v.union(
    v.literal("uploading"),
    v.literal("processing"),
    v.literal("ready"),
    v.literal("failed")
  ),
  storageId: v.optional(v.id("_storage")),
  metadata: v.optional(v.record(v.string(), v.string())),
  lastUpdated: v.number(),
});

// Get presigned URL for file upload
export const getUploadUrl = mutation({
  args: {
    assistantId: v.id("assistants"),
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  returns: v.object({
    uploadUrl: v.string(),
    fileId: v.id("files"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the assistant exists and user has access
    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Verify file size is within limits
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit
    if (args.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large, max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Verify file extension is allowed
    const allowedExtensions = [
      ".pdf", ".txt", ".md", ".html", ".htm", ".csv", ".json", ".docx", ".doc", ".rtf", ".ppt", ".pptx"
    ];
    
    const fileExtension = args.filename.toLowerCase().substring(args.filename.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(
        `File type not supported. Allowed extensions: ${allowedExtensions.join(", ")}`
      );
    }

    // Create a record for the file
    const fileId = await ctx.db.insert("files", {
      assistantId: args.assistantId,
      externalId: "",
      name: args.filename,
      purpose: "assistants",
      size: args.fileSize,
      type: args.contentType,
      status: "uploading",
      lastUpdated: Date.now(),
    });

    // Generate a presigned URL for the file upload
    const uploadUrl = await ctx.storage.generateUploadUrl();

    return {
      uploadUrl,
      fileId,
    };
  },
});

// Confirm file upload and process it (upload to OpenAI)
export const processUploadedFile = mutation({
  args: {
    fileId: v.id("files"),
    storageId: v.id("_storage"),
  },
  returns: fileValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the file record
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Update the file status to processing and save storage ID
    await ctx.db.patch(args.fileId, {
      status: "processing",
      storageId: args.storageId,
      lastUpdated: Date.now(),
    });

    // Schedule an action to upload the file to OpenAI
    await ctx.scheduler.runAfter(0, internal.files.actions.uploadFileToOpenAI, {
      fileId: args.fileId,
    });

    return await ctx.db.get(args.fileId);
  },
});

// List files for an assistant
export const listFiles = query({
  args: {
    assistantId: v.id("assistants"),
  },
  returns: v.array(fileValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the assistant exists and user has access
    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Retrieve the files
    const files = await ctx.db
      .query("files")
      .withIndex("assistantId", (q) => q.eq("assistantId", args.assistantId))
      .collect();

    return files;
  },
});

// Get a specific file
export const getFile = query({
  args: {
    fileId: v.id("files"),
  },
  returns: v.union(fileValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    // Verify the assistant exists and user has access
    const assistant = await ctx.db.get(file.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    return file;
  },
});

// Delete a file
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    // Verify the assistant exists and user has access
    const assistant = await ctx.db.get(file.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // If the file has an external ID, schedule deletion from OpenAI
    if (file.externalId) {
      // First, remove it from the assistant if it's attached
      if (assistant.fileIds.includes(file.externalId)) {
        await ctx.scheduler.runAfter(0, internal.assistants.actions.removeFileFromAssistant, {
          assistantId: file.assistantId,
          fileId: file.externalId,
        });
      }

      // Then delete the file from OpenAI
      await ctx.scheduler.runAfter(0, internal.files.actions.deleteFileFromOpenAI, {
        fileId: args.fileId,
      });
    }

    // Remove the file from Convex storage
    if (file.storageId) {
      try {
        await ctx.storage.delete(file.storageId);
      } catch (e) {
        console.error("Error deleting file from storage:", e);
      }
    }

    // Delete the file record
    await ctx.db.delete(args.fileId);
    return null;
  },
}); 