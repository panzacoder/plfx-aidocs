import { v } from "convex/values";
import { internalMutation, internalQuery } from "@/_generated/server";

// Get an assistant without auth checks (for internal use)
export const getAssistantInternal = internalQuery({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assistantId);
  },
});

// Update assistant status
export const updateStatus = internalMutation({
  args: {
    assistantId: v.id("assistants"),
    status: v.union(
      v.literal("draft"),
      v.literal("ready"),
      v.literal("error"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assistantId, { status: args.status });
  },
});
