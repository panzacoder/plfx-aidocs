"use node";

import { z } from "zod";
import { action } from "../_generated/server";
import OpenAI from "openai";
import { v } from "convex/values";

// Define the OpenAI client that can be used across different actions
export async function getOpenAIClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }
  
  return new OpenAI({
    apiKey,
  });
}

// Helper type for the OpenAI response structure
const openaiAssistantValidator = v.object({
  id: v.string(),
  object: v.string(),
  created_at: v.number(),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  model: v.string(),
  instructions: v.optional(v.string()),
  tools: v.array(v.object({
    type: v.string()
  })),
  file_ids: v.array(v.string()),
  metadata: v.optional(v.record(v.string(), v.string())),
});

// Create an OpenAI assistant
export const createAssistant = action({
  args: {
    apiKey: v.string(),
    name: v.optional(v.string()),
    instructions: v.optional(v.string()),
    model: v.string(),
    description: v.optional(v.string()),
    tools: v.array(v.string()),
    fileIds: v.optional(v.array(v.string())),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  returns: openaiAssistantValidator,
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      
      // Transform tools format from string array to OpenAI format
      const tools = args.tools.map(tool => ({ 
        type: tool as "retrieval" | "code_interpreter" | "function" 
      }));
      
      const assistant = await openai.beta.assistants.create({
        name: args.name,
        instructions: args.instructions,
        model: args.model,
        description: args.description,
        tools,
        file_ids: args.fileIds || [],
        metadata: args.metadata,
      });
      
      // Transform to match our expected return format
      return {
        id: assistant.id,
        object: assistant.object,
        created_at: assistant.created_at,
        name: assistant.name,
        description: assistant.description,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools.map(tool => ({ type: tool.type })),
        file_ids: assistant.file_ids,
        metadata: assistant.metadata,
      };
    } catch (error: any) {
      console.error("Error creating OpenAI assistant:", error);
      throw new Error(`Failed to create OpenAI assistant: ${error.message}`);
    }
  },
});

// Update an existing OpenAI assistant
export const updateAssistant = action({
  args: {
    apiKey: v.string(),
    assistantId: v.string(),
    name: v.optional(v.string()),
    instructions: v.optional(v.string()),
    model: v.optional(v.string()),
    description: v.optional(v.string()),
    tools: v.optional(v.array(v.string())),
    fileIds: v.optional(v.array(v.string())),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  returns: openaiAssistantValidator,
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      
      const updateParams: Record<string, any> = {};
      
      if (args.name !== undefined) updateParams.name = args.name;
      if (args.instructions !== undefined) updateParams.instructions = args.instructions;
      if (args.model !== undefined) updateParams.model = args.model;
      if (args.description !== undefined) updateParams.description = args.description;
      if (args.fileIds !== undefined) updateParams.file_ids = args.fileIds;
      if (args.metadata !== undefined) updateParams.metadata = args.metadata;
      
      if (args.tools !== undefined) {
        updateParams.tools = args.tools.map(tool => ({ 
          type: tool as "retrieval" | "code_interpreter" | "function" 
        }));
      }
      
      const assistant = await openai.beta.assistants.update(
        args.assistantId,
        updateParams
      );
      
      // Transform to match our expected return format
      return {
        id: assistant.id,
        object: assistant.object,
        created_at: assistant.created_at,
        name: assistant.name,
        description: assistant.description,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools.map(tool => ({ type: tool.type })),
        file_ids: assistant.file_ids,
        metadata: assistant.metadata,
      };
    } catch (error: any) {
      console.error("Error updating OpenAI assistant:", error);
      throw new Error(`Failed to update OpenAI assistant: ${error.message}`);
    }
  },
});

// Delete an OpenAI assistant
export const deleteAssistant = action({
  args: {
    apiKey: v.string(),
    assistantId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    object: v.string(),
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const response = await openai.beta.assistants.del(args.assistantId);
      return {
        id: response.id,
        object: response.object,
        deleted: response.deleted,
      };
    } catch (error: any) {
      console.error("Error deleting OpenAI assistant:", error);
      throw new Error(`Failed to delete OpenAI assistant: ${error.message}`);
    }
  },
});

// Get an OpenAI assistant
export const getAssistant = action({
  args: {
    apiKey: v.string(),
    assistantId: v.string(),
  },
  returns: openaiAssistantValidator,
  handler: async (ctx, args) => {
    try {
      const openai = await getOpenAIClient(args.apiKey);
      const assistant = await openai.beta.assistants.retrieve(args.assistantId);
      
      // Transform to match our expected return format
      return {
        id: assistant.id,
        object: assistant.object,
        created_at: assistant.created_at,
        name: assistant.name,
        description: assistant.description,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools.map(tool => ({ type: tool.type })),
        file_ids: assistant.file_ids,
        metadata: assistant.metadata,
      };
    } catch (error: any) {
      console.error("Error retrieving OpenAI assistant:", error);
      throw new Error(`Failed to retrieve OpenAI assistant: ${error.message}`);
    }
  },
}); 