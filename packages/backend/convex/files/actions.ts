"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Upload a file to OpenAI from Convex storage
export const uploadFileToOpenAI = internalAction({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the file from the database
      const file = await ctx.runQuery(internal.files.getFile, {
        fileId: args.fileId,
      });

      if (!file) {
        throw new Error("File not found");
      }

      // Get the assistant
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: file.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.assistants.internal.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // Get the file from storage
      const storageId = `${file._id}-${file.name}`;
      const fileContent = await ctx.storage.get(storageId);
      
      if (!fileContent) {
        throw new Error("File content not found in storage");
      }

      // Convert the file to base64
      const buffer = await fileContent.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');

      // Upload the file to OpenAI
      const openaiFile = await ctx.runAction(internal.openai.files.uploadFile, {
        apiKey: provider.apiKey,
        filename: file.name,
        fileData: base64Data,
        purpose: "assistants",
      });

      // Update the file in the database
      await ctx.runMutation(internal.files.internal.updateFile, {
        fileId: args.fileId,
        externalId: openaiFile.id,
        status: "ready",
      });

      // Attach the file to the assistant
      await ctx.runAction(internal.assistants.actions.attachFileToAssistant, {
        assistantId: file.assistantId,
        fileId: openaiFile.id,
      });
    } catch (error) {
      console.error("Error uploading file to OpenAI:", error);
      
      // Update the file status to failed
      await ctx.runMutation(internal.files.internal.updateFile, {
        fileId: args.fileId,
        status: "failed",
      });
      
      throw error;
    }
  },
});

// Delete a file from OpenAI
export const deleteFileFromOpenAI = internalAction({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the file from the database
      const file = await ctx.runQuery(internal.files.getFile, {
        fileId: args.fileId,
      });

      if (!file) {
        return; // File already deleted, nothing to do
      }

      // If no external ID, nothing to delete
      if (!file.externalId) {
        return;
      }

      // Get the assistant
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: file.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.assistants.internal.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // Delete the file from OpenAI
      await ctx.runAction(internal.openai.files.deleteFile, {
        apiKey: provider.apiKey,
        fileId: file.externalId,
      });
      
      // Note: We don't need to update our database as the caller will delete the file
    } catch (error) {
      console.error("Error deleting file from OpenAI:", error);
      throw error;
    }
  },
}); 