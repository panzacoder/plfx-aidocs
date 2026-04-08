import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "@/_generated/server";

// Helper to verify org membership
async function verifyOrgAccess(
  ctx: { db: any },
  organizationId: any,
  userId: any,
) {
  const org = await ctx.db.get(organizationId);
  if (!org) throw new Error("Organization not found");
  if (
    org.ownerId.toString() !== userId.toString() &&
    !org.members.includes(userId)
  ) {
    throw new Error("Access denied to this organization");
  }
  return org;
}

// Create a new AI provider
export const createAIProvider = mutation({
  args: {
    organizationId: v.id("organizations"),
    apiKey: v.string(),
    provider: v.optional(v.union(v.literal("openai"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await verifyOrgAccess(ctx, args.organizationId, userId);

    const id = await ctx.db.insert("aiProviders", {
      organizationId: args.organizationId,
      provider: args.provider ?? "openai",
      apiKey: args.apiKey,
    });

    return await ctx.db.get(id);
  },
});

// List all AI providers for an organization
export const listAIProviders = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await verifyOrgAccess(ctx, args.organizationId, userId);

    return await ctx.db
      .query("aiProviders")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
  },
});

// Get a specific AI provider
export const getAIProvider = query({
  args: {
    providerId: v.id("aiProviders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const provider = await ctx.db.get(args.providerId);
    if (!provider) return null;

    await verifyOrgAccess(ctx, provider.organizationId, userId);
    return provider;
  },
});

// Update an AI provider
export const updateAIProvider = mutation({
  args: {
    providerId: v.id("aiProviders"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const provider = await ctx.db.get(args.providerId);
    if (!provider) throw new Error("AI Provider not found");

    await verifyOrgAccess(ctx, provider.organizationId, userId);

    await ctx.db.patch(args.providerId, { apiKey: args.apiKey });
    return await ctx.db.get(args.providerId);
  },
});

// Delete an AI provider
export const deleteAIProvider = mutation({
  args: {
    providerId: v.id("aiProviders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const provider = await ctx.db.get(args.providerId);
    if (!provider) throw new Error("AI Provider not found");

    await verifyOrgAccess(ctx, provider.organizationId, userId);

    // Check if any assistants use this provider
    const assistants = await ctx.db
      .query("assistants")
      .withIndex("aiProviderId", (q) =>
        q.eq("aiProviderId", args.providerId),
      )
      .collect();

    if (assistants.length > 0) {
      throw new Error("Cannot delete AI Provider with existing assistants");
    }

    await ctx.db.delete(args.providerId);
    return null;
  },
});
