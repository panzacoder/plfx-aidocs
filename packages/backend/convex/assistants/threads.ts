import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { assistantAgent, createCustomAgent } from "../agents";

/**
 * Create a new thread and generate an initial response
 */
export const createThread = action({
  args: {
    assistantId: v.id("assistants"),
    prompt: v.string(),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get assistant details
    const assistant = await ctx.runQuery(
      internal.assistants.functions.getAssistant,
      {
        assistantId: args.assistantId,
      },
    );
    if (!assistant) throw new Error("Assistant not found");

    // Determine which agent to use
    let agent = assistantAgent;
    
    // If custom API key is needed, create a custom agent
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      if (provider?.apiKey) {
        agent = createCustomAgent(
          provider.apiKey,
          assistant.model,
          assistant.instructions
        );
      }
    }

    // Create thread with the agent
    const { threadId, thread } = await agent.createThread(ctx, {
      userId: userId.toString(),
      metadata: {
        assistantId: args.assistantId.toString(),
        assistantName: assistant.name || "Assistant",
        organizationId: assistant.organizationId.toString(),
        fileIds: args.fileIds || assistant.fileIds || [],
      },
    });

    // Save primary thread ID for this assistant if it's the first thread
    if (!assistant.primaryThreadId) {
      await ctx.runMutation(internal.assistants.functions.updateAssistant, {
        assistantId: args.assistantId,
        primaryThreadId: threadId,
      });
    }

    // Generate initial response with context
    const result = await thread.generateText({
      prompt: args.prompt,
      contextMessages: assistant.initialPrompt
        ? [{ role: "assistant", content: assistant.initialPrompt }]
        : undefined,
    });

    return {
      threadId,
      messageId: result.messageId,
      text: result.text,
    };
  },
});

/**
 * Continue an existing thread with a new prompt
 */
export const continueThread = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get thread metadata
    const threadInfo = await ctx.runQuery(
      internal.agent.messages.getThreadMetadata,
      {
        threadId: args.threadId,
      },
    );

    if (!threadInfo) throw new Error("Thread not found");

    // Get assistant from metadata
    const assistantId = threadInfo?.metadata?.assistantId;
    if (!assistantId) throw new Error("No assistant ID in thread metadata");

    const assistant = await ctx.runQuery(
      internal.assistants.functions.getAssistant,
      {
        assistantId,
      },
    );
    if (!assistant) throw new Error("Assistant not found");

    // Determine which agent to use
    let agent = assistantAgent;
    
    // If custom API key is needed, create a custom agent
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      if (provider?.apiKey) {
        agent = createCustomAgent(
          provider.apiKey,
          assistant.model,
          assistant.instructions
        );
      }
    }

    // Continue thread with the agent
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: userId.toString(),
    });

    // Generate response
    const result = await thread.generateText({ prompt: args.prompt });

    return {
      messageId: result.messageId,
      text: result.text,
    };
  },
});

/**
 * Get all messages for a thread with streaming support
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.runQuery(internal.agent.messages.getThreadMessages, {
      threadId: args.threadId,
    });
  },
});

/**
 * Get messages for a thread (legacy function name for backward compatibility)
 */
export const getMessages = listThreadMessages;

/**
 * List all threads for the authenticated user
 */
export const listThreads = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get threads with specific organization metadata
    return await ctx.runQuery(internal.agent.messages.searchThreadsForUser, {
      userId: userId.toString(),
      metadataFilter: {
        organizationId: args.organizationId.toString(),
      },
      limit: args.limit || 10,
      cursor: args.cursor,
    });
  },
});