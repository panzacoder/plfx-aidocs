import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "@/_generated/server";
import type { Id } from "../_generated/dataModel";

const aiProviderValidator = v.object({
  _id: v.id("aiProviders"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  type: v.literal("OpenAI"),
  apiKey: v.string(),
});

/**
 * Helper function to validate that a user has access to an organization
 */
async function validateOrganizationAccess(
  ctx: any,
  userId: Id<"users">,
  organizationId: Id<"organizations">
) {
  const organization = await ctx.db.get(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  // Check if user has access to the organization (owner or member)
  if (organization.ownerId.toString() !== userId.toString() && 
      !organization.members.includes(userId)) {
    throw new Error("Access denied to this organization");
  }

  return organization;
}

// Create a new AI provider
export const createAIProvider = mutation({
  args: {
    organizationId: v.id("organizations"),
    apiKey: v.string(),
  },
  returns: aiProviderValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate user has access to the organization
    await validateOrganizationAccess(ctx, userId, args.organizationId);

    const aiProvider = await ctx.db.insert("aiProviders", {
      organizationId: args.organizationId,
      type: "OpenAI" as const,
      apiKey: args.apiKey,
    });

    const result = await ctx.db.get(aiProvider);
    if (!result) {
      throw new Error("Failed to create AI Provider");
    }

    return result;
  },
});

// List all AI providers for an organization
export const listAIProviders = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(aiProviderValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate user has access to the organization
    await validateOrganizationAccess(ctx, userId, args.organizationId);

    const providers = await ctx.db
      .query("aiProviders")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    return providers;
  },
});

// Get a specific AI provider
export const getAIProvider = query({
  args: {
    providerId: v.id("aiProviders"),
  },
  returns: v.union(aiProviderValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      return null;
    }

    // Validate user has access to the provider's organization
    await validateOrganizationAccess(ctx, userId, provider.organizationId);

    return provider;
  },
});

// Update an AI provider
export const updateAIProvider = mutation({
  args: {
    providerId: v.id("aiProviders"),
    apiKey: v.string(),
  },
  returns: aiProviderValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // Validate user has access to the provider's organization
    await validateOrganizationAccess(ctx, userId, provider.organizationId);

    await ctx.db.patch(args.providerId, {
      apiKey: args.apiKey,
    });

    const result = await ctx.db.get(args.providerId);
    if (!result) {
      throw new Error("Failed to update AI Provider");
    }

    return result;
  },
});

// Delete an AI provider
export const deleteAIProvider = mutation({
  args: {
    providerId: v.id("aiProviders"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // Validate user has access to the provider's organization
    await validateOrganizationAccess(ctx, userId, provider.organizationId);

    // Check if there are any assistants using this provider
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
