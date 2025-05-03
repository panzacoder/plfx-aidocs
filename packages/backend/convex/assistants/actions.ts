"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getOpenAIClient } from "../openai/client";

// Create an assistant in OpenAI
export const createOpenAIAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the assistant from the database
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: args.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // Format tools for the OpenAI API
      const tools = assistant.tools.map(tool => ({ type: tool }));
      
      // Create the assistant in OpenAI
      const openaiAssistant = await ctx.runAction(internal.openai.client.createAssistant, {
        apiKey: provider.apiKey,
        name: assistant.name,
        instructions: assistant.instructions,
        model: assistant.model,
        description: assistant.description,
        tools: assistant.tools,
        fileIds: assistant.fileIds,
        metadata: assistant.metadata,
      });

      // Update the assistant in Convex with the OpenAI ID and set status to "ready"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        externalId: openaiAssistant.id,
        status: "ready",
        lastSynced: Date.now(),
      });
    } catch (error) {
      console.error("Error creating OpenAI assistant:", error);
      
      // Update status to "failed"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "failed",
      });
      
      throw error;
    }
  },
});

// Update an assistant in OpenAI
export const updateOpenAIAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the assistant from the database
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: args.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // If the assistant doesn't have an externalId yet, create it instead of updating
      if (!assistant.externalId) {
        return await ctx.runAction(internal.assistants.actions.createOpenAIAssistant, {
          assistantId: args.assistantId,
        });
      }

      // Update the assistant in OpenAI
      const openaiAssistant = await ctx.runAction(internal.openai.client.updateAssistant, {
        apiKey: provider.apiKey,
        assistantId: assistant.externalId,
        name: assistant.name,
        instructions: assistant.instructions,
        model: assistant.model,
        description: assistant.description,
        tools: assistant.tools,
        fileIds: assistant.fileIds,
        metadata: assistant.metadata,
      });

      // Update the assistant in Convex with status "ready"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "ready",
        lastSynced: Date.now(),
      });
    } catch (error) {
      console.error("Error updating OpenAI assistant:", error);
      
      // Update status to "failed"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "failed",
      });
      
      throw error;
    }
  },
});

// Delete an assistant from OpenAI
export const deleteOpenAIAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the assistant from the database
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: args.assistantId,
      });

      if (!assistant) {
        return; // Assistant already deleted, nothing to do
      }

      // If no externalId, nothing to delete
      if (!assistant.externalId) {
        return;
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // Delete the assistant from OpenAI
      await ctx.runAction(internal.openai.client.deleteAssistant, {
        apiKey: provider.apiKey,
        assistantId: assistant.externalId,
      });
      
      // Note: We don't need to update our database as the caller will delete the assistant
    } catch (error) {
      console.error("Error deleting OpenAI assistant:", error);
      throw error;
    }
  },
});

// Sync an assistant with OpenAI
export const syncOpenAIAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the assistant from the database
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: args.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // If the assistant doesn't have an externalId yet, create it
      if (!assistant.externalId) {
        return await ctx.runAction(internal.assistants.actions.createOpenAIAssistant, {
          assistantId: args.assistantId,
        });
      }

      // Get the assistant from OpenAI to sync
      const openaiAssistant = await ctx.runAction(internal.openai.client.getAssistant, {
        apiKey: provider.apiKey,
        assistantId: assistant.externalId,
      });

      // Update our database with the latest OpenAI data
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        fileIds: openaiAssistant.file_ids,
        status: "ready",
        lastSynced: Date.now(),
      });
    } catch (error) {
      console.error("Error syncing OpenAI assistant:", error);
      
      // Update status to "failed"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "failed",
      });
      
      throw error;
    }
  },
});

// Attach a file to an assistant in OpenAI
export const attachFileToAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the assistant from the database
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: args.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // If the assistant doesn't have an externalId yet, create it first
      if (!assistant.externalId) {
        await ctx.runAction(internal.assistants.actions.createOpenAIAssistant, {
          assistantId: args.assistantId,
        });
        
        // Refetch the assistant after creation
        const updatedAssistant = await ctx.runQuery(internal.assistants.getAssistant, {
          assistantId: args.assistantId,
        });
        
        if (!updatedAssistant || !updatedAssistant.externalId) {
          throw new Error("Failed to create assistant in OpenAI");
        }
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // Attach the file to the assistant in OpenAI
      await ctx.runAction(internal.openai.files.attachFileToAssistant, {
        apiKey: provider.apiKey,
        assistantId: assistant.externalId,
        fileId: args.fileId,
      });

      // Update status to "ready"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "ready",
        lastSynced: Date.now(),
      });
    } catch (error) {
      console.error("Error attaching file to OpenAI assistant:", error);
      
      // Update status to "failed"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "failed",
      });
      
      throw error;
    }
  },
});

// Remove a file from an assistant in OpenAI
export const removeFileFromAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the assistant from the database
      const assistant = await ctx.runQuery(internal.assistants.getAssistant, {
        assistantId: args.assistantId,
      });

      if (!assistant) {
        throw new Error("Assistant not found");
      }

      // If no externalId, nothing to do
      if (!assistant.externalId) {
        return;
      }

      // Get the AI Provider to access the API key
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });

      if (!provider) {
        throw new Error("AI Provider not found");
      }

      // Remove the file from the assistant in OpenAI
      await ctx.runAction(internal.openai.files.removeFileFromAssistant, {
        apiKey: provider.apiKey,
        assistantId: assistant.externalId,
        fileId: args.fileId,
      });

      // Update status to "ready"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "ready",
        lastSynced: Date.now(),
      });
    } catch (error) {
      console.error("Error removing file from OpenAI assistant:", error);
      
      // Update status to "failed"
      await ctx.runMutation(internal.assistants.internal.updateAssistantFields, {
        assistantId: args.assistantId,
        status: "failed",
      });
      
      throw error;
    }
  },
}); 