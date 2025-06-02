import { v } from "convex/values";
import { action, httpAction } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { assistantAgent, createCustomAgent } from "../agents";

/**
 * Generate streaming response using the Convex agent
 * Uses the agent's built-in streaming capabilities
 */
export const generateStreamingResponse = action({
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

    // Generate streaming response directly
    return await thread.generateText({
      prompt: args.prompt,
      stream: true,
    });
  },
});

/**
 * HTTP endpoint to initiate a streaming response
 * Legacy function maintained for backward compatibility
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

    // Use new streaming approach directly
    const streamResult = await ctx.runAction(internal.assistants.streaming.generateStreamingResponse, {
      threadId,
      prompt,
      assistantId,
    });

    // Return the stream ID for the client to consume
    return new Response(JSON.stringify({ responseId: streamResult.streamId }), {
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