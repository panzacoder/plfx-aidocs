import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { assistantAgent, createCustomAgent } from "../agents";

/**
 * Generate streaming response using the Convex agent
 * Uses the agent's built-in streaming capabilities
 * 
 * This action is used by the useThreadMessages hook to stream responses
 * to the client. It uses the agent's streaming functionality to provide
 * a smooth text experience.
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