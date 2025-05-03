import { mutation } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { createPersonalOrganization } from "@/organizations/mutations";

// This will be triggered when a new user account is created
export const setupNewUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    organizationId: v.id("organizations"),
  }),
  handler: async (ctx, args) => {
    // Create a personal organization for the user

    const organizationId: Id<"organizations"> = await ctx.runMutation(
      api.organizations.mutations.createPersonalOrganization,
      {
        userId: args.userId,
      },
    );

    // Here we would set up a default AI provider with your API key, if needed in the future

    return { organizationId };
  },
});
