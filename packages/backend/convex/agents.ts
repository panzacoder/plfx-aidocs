/**
 * CENTRALIZED AGENT CONFIGURATION
 * 
 * This is the single source of truth for all agent-related functionality.
 * All assistant implementations should use the exports from this file to ensure
 * consistent behavior and configuration across the application.
 */

import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";
import { env } from "./env";

/**
 * Format file sizes in a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Document search tool for AI agents
 * 
 * This tool allows AI agents to search through all documents uploaded to 
 * assistants within the same organization. It searches document metadata including:
 * - File names
 * - File types
 * - File metadata
 * 
 * Results are formatted for easy consumption by the AI agent and include:
 * - File name and type
 * - File size (human readable)
 * - Upload date
 * - Associated assistant
 * - File ID for reference
 */
const searchDocuments = createTool({
  description: "Search organization documents by query. Finds files by name, type, and metadata across all assistants in the organization.",
  args: z.object({
    query: z.string().describe("The search query"),
    limit: z.number().optional().describe("The maximum number of results to return"),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the current assistant's organization ID
      const assistant = await ctx.db.get(ctx.assistantId);
      if (!assistant) {
        return "Assistant not found.";
      }

      // Search for files in the organization
      const results = await ctx.runQuery(internal.files.search.searchFiles, {
        organizationId: assistant.organizationId,
        query: args.query,
        limit: args.limit || 5,
      });

      if (results.length === 0) {
        return `No documents found matching "${args.query}". Try different search terms or check if documents have been uploaded.`;
      }

      // Format results for the AI agent
      const formattedResults = results.map(file => {
        const sizeFormatted = formatFileSize(file.size);
        const dateFormatted = new Date(file.createdAt).toLocaleDateString();
        
        return `• **${file.name}** (${file.type}, ${sizeFormatted})
  - Assistant: ${file.assistantName}
  - Uploaded: ${dateFormatted}
  - File ID: ${file.id}`;
      }).join('\n\n');

      return `Found ${results.length} document(s) matching "${args.query}":\n\n${formattedResults}\n\nNote: These are document metadata results. For specific content within documents, please ask me to help you find information about specific topics.`;
    } catch (error) {
      console.error("Error searching documents:", error);
      return `Error occurred while searching for "${args.query}". Please try again or contact support if the issue persists.`;
    }
  },
});

/**
 * Define a centralized assistant agent configuration
 * 
 * This is the primary agent instance used throughout the application.
 * It's configured with:
 * - GPT-4o model for chat completions
 * - text-embedding-3-small for embeddings
 * - Document search tool for retrieving information
 * - Optimized context settings for good conversation memory
 * - Usage tracking for analytics
 */
export const assistantAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions: "You are a helpful assistant.",
  tools: { 
    searchDocuments,
  },
  contextOptions: {
    includeToolCalls: true,
    recentMessages: 10,
    searchOtherThreads: false,
    searchOptions: {
      limit: 20,
      textSearch: true,
      vectorSearch: true,
      messageRange: { before: 2, after: 1 },
    },
  },
  storageOptions: {
    saveAllInputMessages: true,
    saveOutputMessages: true,
  },
  maxSteps: 10,
  usageHandler: async (ctx, args) => {
    // Track usage for billing or analytics
    console.log("Token usage:", {
      userId: args.userId,
      threadId: args.threadId,
      model: args.model,
      provider: args.provider,
      usage: args.usage,
    });
    
    // TODO: Implement proper usage tracking in the future
    // Example:
    // await ctx.runMutation(internal.usage.trackTokenUsage, {
    //   userId: args.userId,
    //   threadId: args.threadId,
    //   model: args.model,
    //   provider: args.provider,
    //   usage: args.usage,
    // });
  },
});

/**
 * Factory function to create customized agents with specific settings
 * 
 * Used when custom API keys or model configurations are needed.
 * All agents created with this function will have the same tools and
 * context settings as the main assistantAgent.
 * 
 * @param apiKey - The OpenAI API key to use (falls back to env variable)
 * @param model - The model to use (defaults to "gpt-4o")
 * @param instructions - Custom system instructions (defaults to "You are a helpful assistant.")
 * @returns A configured Agent instance
 */
export function createCustomAgent(
  apiKey: string,
  model: string = "gpt-4o",
  instructions?: string,
) {
  // Default OpenAI API key from environment if not provided
  const finalApiKey = apiKey || env.OPENAI_API_KEY;

  if (!finalApiKey) {
    throw new Error("No OpenAI API key provided for assistant agent");
  }

  return new Agent(components.agent, {
    chat: openai.chat(model as any, { apiKey: finalApiKey }),
    textEmbedding: openai.embedding("text-embedding-3-small", {
      apiKey: finalApiKey,
    }),
    instructions: instructions || "You are a helpful assistant.",
    tools: { 
      searchDocuments,
    },
    contextOptions: {
      includeToolCalls: true,
      recentMessages: 10,
      searchOtherThreads: false,
      searchOptions: {
        limit: 20,
        textSearch: true,
        vectorSearch: true,
        messageRange: { before: 2, after: 1 },
      },
    },
    storageOptions: {
      saveAllInputMessages: true,
      saveOutputMessages: true,
    },
    maxSteps: 10,
  });
}

/**
 * For backward compatibility with existing code
 * @deprecated Use createCustomAgent instead
 */
export const createAssistantAgent = createCustomAgent;