import { v } from "convex/values";
import { internalMutation } from "@/_generated/server";

// Update a file's processing status
export const updateFileStatus = internalMutation({
  args: {
    fileId: v.id("files"),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, { status: args.status });
    return await ctx.db.get(args.fileId);
  },
});
