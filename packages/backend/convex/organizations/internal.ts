import { internalQuery, internalMutation } from "@/_generated/server";
import { v } from "convex/values";

// Get organization by Polar customer ID
export const getByPolarCustomerId = internalQuery({
  args: {
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("polarCustomerId", (q) => 
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .unique();
  }
});

// Get organization by Polar subscription ID
export const getByPolarSubscriptionId = internalQuery({
  args: {
    polarSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("polarSubscriptionId", (q) => 
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .unique();
  }
});

// Update organization fields
export const update = internalMutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    members: v.optional(v.array(v.id("users"))),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    billingName: v.optional(v.string()),
    subscriptionUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  }
});

// Delete an organization
export const deleteOrganization = internalMutation({
  args: {
    id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Get organization to update member users
    const org = await ctx.db.get(args.id);
    if (!org) {
      throw new Error("Organization not found");
    }
    
    // Update all member users to remove organizationId
    if (org.members && org.members.length > 0) {
      for (const memberId of org.members) {
        const member = await ctx.db.get(memberId);
        if (member && member.organizationId === args.id) {
          await ctx.db.patch(memberId, {
            organizationId: undefined,
            role: undefined
          });
        }
      }
    }
    
    // Delete the organization
    await ctx.db.delete(args.id);
  }
}); 