"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { rag } from "../agent";

// Ingest a file into the RAG component (chunk + embed)
export const ingestFileToRAG = internalAction({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    try {
      // Get file record
      const file = await ctx.runQuery(internal.files.functions.getFile, {
        fileId: args.fileId,
      });
      if (!file) throw new Error("File not found");

      // Get the assistant to find the RAG namespace
      const assistant = await ctx.runQuery(
        internal.assistants.internal.getAssistantInternal,
        { assistantId: file.assistantId },
      );
      if (!assistant) throw new Error("Assistant not found");

      const namespace = assistant.ragNamespace;
      if (!namespace) throw new Error("Assistant has no RAG namespace");

      // Get file content from Convex storage
      const blob = await ctx.storage.get(file.storageId);
      if (!blob) throw new Error("File not found in storage");

      const text = await blob.text();

      // Add to RAG with the assistant's namespace
      await rag.add(ctx, {
        namespace,
        text,
      });

      // Mark file as ready
      await ctx.runMutation(internal.files.internal.updateFileStatus, {
        fileId: args.fileId,
        status: "ready",
      });

      // Update assistant status to ready if it was in draft
      if (assistant.status === "draft") {
        await ctx.runMutation(internal.assistants.internal.updateStatus, {
          assistantId: file.assistantId,
          status: "ready",
        });
      }
    } catch (error) {
      console.error("Error ingesting file to RAG:", error);

      await ctx.runMutation(internal.files.internal.updateFileStatus, {
        fileId: args.fileId,
        status: "failed",
      });

      throw error;
    }
  },
});

// Remove a file's content from RAG
export const removeFileFromRAG = internalAction({
  args: {
    fileId: v.id("files"),
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    // Note: The RAG component currently doesn't support removing individual
    // entries by key. For now we log the intent. When the RAG component
    // adds deletion support, we'll implement it here.
    console.log(
      `TODO: Remove RAG content for file ${args.fileId} from assistant ${args.assistantId}`,
    );
  },
});
