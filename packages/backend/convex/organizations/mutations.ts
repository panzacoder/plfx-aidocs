import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const createPersonalOrganization = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    // Get the user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create a personal organization for the user
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name || `${user.name || "Personal"}'s Organization`,
      ownerId: args.userId,
      members: [args.userId],
    });

    return organizationId;
  },
});
