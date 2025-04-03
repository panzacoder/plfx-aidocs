import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { AIProviderDoc } from "./validators/aiProviders";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const aiProviderValidator = v.object({
  _id: v.id("aiProviders"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  type: v.literal("OpenAI"),
  apiKey: v.string(),
});

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

    // TODO: Add organization membership check here

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

    // TODO: Add organization membership check here

    const providers = await ctx.db
      .query("aiProviders")
      .withIndex("by_organizationId", (q) => 
        q.eq("organizationId", args.organizationId)
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

    // TODO: Add organization membership check here

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

    // TODO: Add organization membership check here

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

    // TODO: Add organization membership check here

    // Check if there are any assistants using this provider
    const assistants = await ctx.db
      .query("assistants")
      .withIndex("by_aiProviderId", (q) => 
        q.eq("aiProviderId", args.providerId)
      )
      .collect();

    if (assistants.length > 0) {
      throw new Error("Cannot delete AI Provider with existing assistants");
    }

    await ctx.db.delete(args.providerId);
    return null;
  },
}); 