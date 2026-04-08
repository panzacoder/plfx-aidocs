import { v } from "convex/values";
import { action, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { chatAgent, rag } from "../agent";

// Create a new chat thread for a public assistant (no auth required)
export const createThread = action({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const assistant = await ctx.runQuery(
      // Use the public assistant query (no auth)
      "assistants/functions:getPublicAssistant" as any,
      { assistantId: args.assistantId },
    );

    if (!assistant) {
      throw new Error("Assistant not found or not public");
    }

    const { threadId } = await chatAgent.createThread(ctx, {});
    return { threadId };
  },
});

// Send a message and get a streaming response
export const sendMessage = action({
  args: {
    assistantId: v.id("assistants"),
    threadId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch assistant for context
    const assistant = await ctx.runQuery(
      "assistants/functions:getPublicAssistant" as any,
      { assistantId: args.assistantId },
    );

    if (!assistant) {
      throw new Error("Assistant not found or not public");
    }

    // Build system instructions from assistant config
    let instructions =
      "You are a helpful assistant. Answer questions based on the documents and context available to you.";
    if (assistant.description) {
      instructions += `\n\nAbout you: ${assistant.description}`;
    }

    // Check if the assistant is in restricted mode
    if (assistant.mode === "restricted") {
      instructions +=
        "\n\nIMPORTANT: You must only answer questions that are related to the documents and context provided. If a question is outside your scope, respond with the following message:";
      if (assistant.disclaimer) {
        instructions += `\n"${assistant.disclaimer}"`;
      } else {
        instructions +=
          '\n"I can only answer questions related to the topics I\'ve been configured to help with."';
      }
    }

    // Get RAG namespace for this assistant
    const assistantFull = await ctx.runQuery(
      "assistants/internal:getAssistantInternal" as any,
      { assistantId: args.assistantId },
    );
    const ragNamespace = assistantFull?.ragNamespace;

    // Continue the thread and generate response with RAG context
    const thread = await chatAgent.continueThread(ctx, {
      threadId: args.threadId as any,
    });

    const result = await thread.generateText({
      prompt: args.message,
      system: instructions,
      metadata: { ragNamespace },
    });

    return {
      text: result.text,
      messageId: result.messageId,
    };
  },
});

// Send a message with streaming (saves deltas for real-time UI)
export const sendMessageStreaming = action({
  args: {
    assistantId: v.id("assistants"),
    threadId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const assistantFull = await ctx.runQuery(
      "assistants/internal:getAssistantInternal" as any,
      { assistantId: args.assistantId },
    );
    if (!assistantFull) throw new Error("Assistant not found");

    let instructions =
      "You are a helpful assistant. Answer questions based on the documents and context available to you.";
    if (assistantFull.description) {
      instructions += `\n\nAbout you: ${assistantFull.description}`;
    }
    if (assistantFull.instructions) {
      instructions += `\n\n${assistantFull.instructions}`;
    }
    if (assistantFull.mode === "restricted" && assistantFull.restrictedResponse) {
      instructions += `\n\nIMPORTANT: If a question is outside your scope, respond with: "${assistantFull.restrictedResponse}"`;
    }

    const thread = await chatAgent.continueThread(ctx, {
      threadId: args.threadId as any,
    });

    const result = await thread.streamText({
      prompt: args.message,
      system: instructions,
      saveStreamDeltas: true,
      metadata: { ragNamespace: assistantFull.ragNamespace },
    });

    return {
      threadId: args.threadId,
      messageId: result.messageId,
    };
  },
});

// List messages in a thread (for chat UI)
export const listMessages = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await chatAgent.listMessages(ctx, {
      threadId: args.threadId as any,
      paginationOpts: {
        numItems: args.limit ?? 50,
        cursor: null,
      },
    });
  },
});

// List threads for an assistant (admin view)
export const listThreads = query({
  args: {
    assistantId: v.id("assistants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify admin has access to this assistant's org
    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) throw new Error("Assistant not found");

    const organization = await ctx.db.get(assistant.organizationId);
    if (!organization) throw new Error("Organization not found");

    if (
      organization.ownerId.toString() !== userId.toString() &&
      !organization.members.includes(userId)
    ) {
      throw new Error("Access denied");
    }

    // Note: The agent component manages threads internally.
    // We'll need to filter threads by metadata or implement a mapping table.
    // For now, return a placeholder that we'll fill in when we implement
    // the thread<->assistant association.
    return [];
  },
});
