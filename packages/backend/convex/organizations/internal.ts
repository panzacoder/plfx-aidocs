import { internalQuery, internalMutation } from "@/_generated/server";
import { v } from "convex/values";

export const getByPolarCustomerId = internalQuery({
  args: { polarCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId),
      )
      .unique();
  },
});

export const getByPolarSubscriptionId = internalQuery({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId),
      )
      .unique();
  },
});

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
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(id, patch);
  },
});

export const deleteOrganization = internalMutation({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) throw new Error("Organization not found");

    // Clear organizationId on all members
    for (const memberId of org.members) {
      const member = await ctx.db.get(memberId);
      if (member && member.organizationId === args.id) {
        await ctx.db.patch(memberId, {
          organizationId: undefined,
          role: undefined,
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});
