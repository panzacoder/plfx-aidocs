import { v } from "convex/values";
import { internalMutation, internalQuery } from "@/_generated/server";

// Update specific fields of an assistant
export const updateAssistantFields = internalMutation({
  args: {
    assistantId: v.id("assistants"),
    externalId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("creating"), v.literal("ready"), v.literal("failed"))),
    lastSynced: v.optional(v.number()),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const updateFields: Record<string, any> = {};
    
    if (args.externalId !== undefined) updateFields.externalId = args.externalId;
    if (args.status !== undefined) updateFields.status = args.status;
    if (args.lastSynced !== undefined) updateFields.lastSynced = args.lastSynced;
    if (args.fileIds !== undefined) updateFields.fileIds = args.fileIds;
    
    await ctx.db.patch(args.assistantId, updateFields);
    return await ctx.db.get(args.assistantId);
  },
});

// Get AI Provider by ID
export const getAIProvider = internalQuery({
  args: {
    providerId: v.id("aiProviders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.providerId);
  },
}); 