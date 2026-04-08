import { mutation, query } from "@/_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get a specific organization by ID
export const get = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get organization for the current user
export const getUserOrganization = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user?.organizationId) return null;

    return await ctx.db.get(user.organizationId);
  },
});

// Create a new organization
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      ownerId: userId,
      members: [userId],
      subscriptionStatus: "none",
    });

    await ctx.db.patch(userId, { organizationId, role: "owner" });
    return organizationId;
  },
});

// Update an organization
export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    subscriptionUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const org = await ctx.db.get(args.id);
    if (!org) throw new Error("Organization not found");
    if (org.ownerId !== userId) throw new Error("Not authorized");

    const { id, ...updates } = args;
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(id, patch);
    return id;
  },
});

// Add a member to organization
export const addMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    if (org.ownerId !== currentUserId) throw new Error("Not authorized");

    const updatedMembers = [...org.members, args.userId];
    await ctx.db.patch(args.organizationId, { members: updatedMembers });
    await ctx.db.patch(args.userId, {
      organizationId: args.organizationId,
      role: args.role ?? "member",
    });
    return args.organizationId;
  },
});

// Remove a member from organization
export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    if (org.ownerId !== currentUserId) throw new Error("Not authorized");
    if (org.ownerId === args.userId) throw new Error("Cannot remove the owner");

    const updatedMembers = org.members.filter(
      (id: any) => id !== args.userId,
    );
    await ctx.db.patch(args.organizationId, { members: updatedMembers });
    await ctx.db.patch(args.userId, {
      organizationId: undefined,
      role: undefined,
    });
    return args.organizationId;
  },
});

// Check if organization has access to a feature based on subscription plan
export const hasFeatureAccess = query({
  args: {
    organizationId: v.id("organizations"),
    featureKey: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org || org.subscriptionStatus !== "active") return false;

    const planFeatures: Record<string, string[]> = {
      free: ["basic_access"],
      pro: ["basic_access", "advanced_features", "support"],
      enterprise: [
        "basic_access",
        "advanced_features",
        "support",
        "dedicated_support",
        "custom_integrations",
      ],
    };

    const plan = org.subscriptionPlan || "free";
    return planFeatures[plan]?.includes(args.featureKey) || false;
  },
});
