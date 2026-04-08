import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createPersonalOrganization = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const organizationId = await ctx.db.insert("organizations", {
      name: args.name || `${user.name || "Personal"}'s Organization`,
      ownerId: args.userId,
      members: [args.userId],
      subscriptionStatus: "none",
    });

    // Link user to organization
    await ctx.db.patch(args.userId, {
      organizationId,
      role: "owner",
    });

    return organizationId;
  },
});
