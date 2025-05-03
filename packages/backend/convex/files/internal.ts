import { v } from "convex/values";
import { internalMutation, internalQuery } from "@/_generated/server";

// Update a file's fields
export const updateFile = internalMutation({
  args: {
    fileId: v.id("files"),
    externalId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed")
    )),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const updateFields: Record<string, any> = {
      lastUpdated: Date.now(),
    };
    
    if (args.externalId !== undefined) updateFields.externalId = args.externalId;
    if (args.status !== undefined) updateFields.status = args.status;
    if (args.metadata !== undefined) updateFields.metadata = args.metadata;
    
    await ctx.db.patch(args.fileId, updateFields);
    return await ctx.db.get(args.fileId);
  },
}); 