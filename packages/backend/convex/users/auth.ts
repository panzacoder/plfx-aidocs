import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

// This function handles new user creation from auth
export const onUserCreation = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if the user already has an organization
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.userId))
      .first();
    
    // If not, create a personal organization
    if (!organization) {
      await ctx.runMutation(internal.organizations.mutations.createPersonalOrganization, {
        userId: args.userId,
      });
    }
  },
}); 