"use node";

import { action } from "../_generated/server";
import OpenAI from "openai";
import { v } from "convex/values";
import { getOpenAIClient } from "./client";

// Helper type for the OpenAI file response structure
const openaiFileValidator = v.object({
  id: v.string(),
  object: v.string(),
  bytes: v.number(),
  created_at: v.number(),
  filename: v.string(),
  purpose: v.string(),
});

// Upload a file to OpenAI
export const uploadFile = action({
  args: {
    apiKey: v.string(),
    filename: v.string(),
    fileData: v.string(), // Base64 encoded file data
    purpose: v.literal("assistants"),
  },
  returns: openaiFileValidator,
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      
      // Convert base64 to buffer
      const buffer = Buffer.from(args.fileData, 'base64');
      
      // Create a Blob from buffer
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      
      // Upload file to OpenAI
      const file = await openai.files.create({
        file: blob,
        purpose: args.purpose,
      });
      
      return {
        id: file.id,
        object: file.object,
        bytes: file.bytes,
        created_at: file.created_at,
        filename: file.filename,
        purpose: file.purpose,
      };
    } catch (error: any) {
      console.error("Error uploading file to OpenAI:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  },
});

// List all files
export const listFiles = action({
  args: {
    apiKey: v.string(),
    purpose: v.optional(v.literal("assistants")),
  },
  returns: v.array(openaiFileValidator),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      
      const listParams: { purpose?: string } = {};
      if (args.purpose) {
        listParams.purpose = args.purpose;
      }
      
      const response = await openai.files.list(listParams);
      
      return response.data.map(file => ({
        id: file.id,
        object: file.object,
        bytes: file.bytes,
        created_at: file.created_at,
        filename: file.filename,
        purpose: file.purpose,
      }));
    } catch (error: any) {
      console.error("Error listing files from OpenAI:", error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  },
});

// Get information about a file
export const getFile = action({
  args: {
    apiKey: v.string(),
    fileId: v.string(),
  },
  returns: openaiFileValidator,
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const file = await openai.files.retrieve(args.fileId);
      
      return {
        id: file.id,
        object: file.object,
        bytes: file.bytes,
        created_at: file.created_at,
        filename: file.filename,
        purpose: file.purpose,
      };
    } catch (error: any) {
      console.error("Error retrieving file from OpenAI:", error);
      throw new Error(`Failed to retrieve file: ${error.message}`);
    }
  },
});

// Delete a file
export const deleteFile = action({
  args: {
    apiKey: v.string(),
    fileId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    object: v.string(),
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const response = await openai.files.del(args.fileId);
      
      return {
        id: response.id,
        object: response.object,
        deleted: response.deleted,
      };
    } catch (error: any) {
      console.error("Error deleting file from OpenAI:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
});

// Get file content
export const getFileContent = action({
  args: {
    apiKey: v.string(),
    fileId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const content = await openai.files.content(args.fileId);
      
      // Convert blob to base64
      const buffer = await content.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error: any) {
      console.error("Error getting file content from OpenAI:", error);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  },
});

// Associate a file with an assistant
export const attachFileToAssistant = action({
  args: {
    apiKey: v.string(),
    assistantId: v.string(),
    fileId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    object: v.string(),
    created_at: v.number(),
    assistant_id: v.string(),
    file_id: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const fileAttachment = await openai.beta.assistants.files.create(
        args.assistantId,
        { file_id: args.fileId }
      );
      
      return {
        id: fileAttachment.id,
        object: fileAttachment.object,
        created_at: fileAttachment.created_at,
        assistant_id: fileAttachment.assistant_id,
        file_id: fileAttachment.file_id,
      };
    } catch (error: any) {
      console.error("Error attaching file to assistant:", error);
      throw new Error(`Failed to attach file to assistant: ${error.message}`);
    }
  },
});

// Remove a file from an assistant
export const removeFileFromAssistant = action({
  args: {
    apiKey: v.string(),
    assistantId: v.string(),
    fileId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    object: v.string(),
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const response = await openai.beta.assistants.files.del(
        args.assistantId,
        args.fileId
      );
      
      return {
        id: response.id,
        object: response.object,
        deleted: response.deleted,
      };
    } catch (error: any) {
      console.error("Error removing file from assistant:", error);
      throw new Error(`Failed to remove file from assistant: ${error.message}`);
    }
  },
});

// List files attached to an assistant
export const listAssistantFiles = action({
  args: {
    apiKey: v.string(),
    assistantId: v.string(),
  },
  returns: v.array(v.object({
    id: v.string(),
    object: v.string(),
    created_at: v.number(),
    assistant_id: v.string(),
    file_id: v.string(),
  })),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const response = await openai.beta.assistants.files.list(args.assistantId);
      
      return response.data.map(fileAttachment => ({
        id: fileAttachment.id,
        object: fileAttachment.object,
        created_at: fileAttachment.created_at,
        assistant_id: fileAttachment.assistant_id,
        file_id: fileAttachment.file_id,
      }));
    } catch (error: any) {
      console.error("Error listing assistant files:", error);
      throw new Error(`Failed to list assistant files: ${error.message}`);
    }
  },
}); 