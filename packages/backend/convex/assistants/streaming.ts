import { v } from "convex/values";
import { action, httpAction } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { createConvexAgent } from "./agent";

/**
 * HTTP endpoint to initiate a streaming response
 * This function starts the background process and returns immediately with a stream ID
 */
export const streamThreadResponse = httpAction(async (ctx, request) => {
  // Parse request body
  const body = await request.json();
  const { threadId, prompt, assistantId } = body;
  
  if (!threadId || !prompt || !assistantId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create stream writer
    const writer = await ctx.runAction(internal.persistentTextStreaming.createWriter, {
      metadata: {
        userId: userId.toString(),
        threadId,
        prompt,
      },
    });

    // Use stream ID as response ID
    const responseId = writer.streamId;

    // Start streaming in background
    ctx.scheduler.runAfter(0, internal.assistants.streaming.generateStreamingResponse, {
      writerId: responseId,
      threadId,
      prompt,
      assistantId,
      userId: userId.toString(),
    });

    // Return the stream ID for the client to consume with the streaming client
    return new Response(JSON.stringify({ responseId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error initiating stream:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

/**
 * Generate streaming response directly with the Convex agent
 * This is a more streamlined approach using the built-in streaming capabilities
 */
export const generateAgentStreamingResponse = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get assistant details
    const assistant = await ctx.runQuery(internal.assistants.functions.getAssistant, {
      assistantId: args.assistantId,
    });
    if (!assistant) throw new Error("Assistant not found");

    // Get API key
    let apiKey = "";
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, { 
        providerId: assistant.aiProviderId 
      });
      apiKey = provider?.apiKey || "";
    }

    // Create agent instance
    const agent = createConvexAgent(
      apiKey, 
      assistant.model, 
      assistant.instructions
    );

    // Get thread
    const { thread } = await agent.continueThread(ctx, { 
      threadId: args.threadId,
      userId: userId.toString()
    });

    // Generate streaming response directly using Convex agent's streaming
    return await thread.generateText({ 
      prompt: args.prompt,
      stream: true
    });
  },
});

/**
 * Generate streaming response using the Convex agent
 * This function is called by the scheduler and runs in the background.
 * It supports native streaming with the Convex agent.
 */
export const generateStreamingResponse = action({
  args: {
    writerId: v.string(),
    threadId: v.string(),
    prompt: v.string(),
    assistantId: v.id("assistants"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get assistant details
      const assistant = await ctx.runQuery(internal.assistants.functions.getAssistant, {
        assistantId: args.assistantId,
      });
      if (!assistant) throw new Error("Assistant not found");

      // Get API key
      let apiKey = "";
      if (assistant.aiProviderId) {
        const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, { 
          providerId: assistant.aiProviderId 
        });
        apiKey = provider?.apiKey || "";
      }

      // Create agent instance
      const agent = createConvexAgent(
        apiKey, 
        assistant.model, 
        assistant.instructions
      );

      // Get thread
      const { thread } = await agent.continueThread(ctx, { 
        threadId: args.threadId,
        userId: args.userId
      });

      // Create text writer for streaming
      const writer = await ctx.runAction(internal.persistentTextStreaming.getWriter, {
        streamId: args.writerId,
      });

      // Generate streaming response with progress callbacks
      const result = await thread.generateText({ 
        prompt: args.prompt,
        onProgress: async (chunk) => {
          // Write chunk to stream
          if (chunk.delta) {
            await writer.write(chunk.delta);
          }
        }
      });

      // When complete, save any metadata about the message if needed
      // For example, if you want to track usage, completion status, etc.

      // Close the stream when done
      await writer.end();
    } catch (error: any) {
      console.error("Error generating streaming response:", error);
      
      // Try to close the stream with error
      try {
        const writer = await ctx.runAction(internal.persistentTextStreaming.getWriter, {
          streamId: args.writerId,
        });
        await writer.error(error.message);
      } catch (e) {
        console.error("Error closing stream with error:", e);
      }
    }
  },
}); 