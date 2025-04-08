import { v } from "convex/values";
import { mutation, query } from "@/_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  createAssistantSchema,
  deleteAssistantSchema,
  getAssistantSchema,
  listAssistantsSchema,
  updateAssistantSchema,
} from "./validators";

const assistantValidator = v.object({
  _id: v.id("assistants"),
  _creationTime: v.number(),
  aiProviderId: v.id("aiProviders"),
  externalId: v.string(),
});

// Create a new assistant
export const createAssistant = mutation({
  args: {
    aiProviderId: v.id("aiProviders"),
    externalId: v.string(),
  },
  returns: assistantValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    createAssistantSchema.parse(args);

    // Verify the AI Provider exists and user has access
    const provider = await ctx.db.get(args.aiProviderId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // TODO: Add organization membership check here

    const assistant = await ctx.db.insert("assistants", {
      aiProviderId: args.aiProviderId,
      externalId: args.externalId,
    });

    const result = await ctx.db.get(assistant);
    if (!result) {
      throw new Error("Failed to create Assistant");
    }

    return result;
  },
});

// List all assistants for an AI provider
export const listAssistants = query({
  args: {
    aiProviderId: v.id("aiProviders"),
  },
  returns: v.array(assistantValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    listAssistantsSchema.parse(args);

    // Verify the AI Provider exists and user has access
    const provider = await ctx.db.get(args.aiProviderId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // TODO: Add organization membership check here

    const assistants = await ctx.db
      .query("assistants")
      .withIndex("by_aiProviderId", (q) =>
        q.eq("aiProviderId", args.aiProviderId),
      )
      .collect();

    return assistants;
  },
});

// Get a specific assistant
export const getAssistant = query({
  args: {
    assistantId: v.id("assistants"),
  },
  returns: v.union(assistantValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    getAssistantSchema.parse(args);

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      return null;
    }

    // Verify the AI Provider exists and user has access
    const provider = await ctx.db.get(assistant.aiProviderId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // TODO: Add organization membership check here

    return assistant;
  },
});

// Update an assistant
export const updateAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
    externalId: v.string(),
  },
  returns: assistantValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    updateAssistantSchema.parse(args);

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Verify the AI Provider exists and user has access
    const provider = await ctx.db.get(assistant.aiProviderId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // TODO: Add organization membership check here

    await ctx.db.patch(args.assistantId, {
      externalId: args.externalId,
    });

    const result = await ctx.db.get(args.assistantId);
    if (!result) {
      throw new Error("Failed to update Assistant");
    }

    return result;
  },
});

// Delete an assistant
export const deleteAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    deleteAssistantSchema.parse(args);

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Verify the AI Provider exists and user has access
    const provider = await ctx.db.get(assistant.aiProviderId);
    if (!provider) {
      throw new Error("AI Provider not found");
    }

    // TODO: Add organization membership check here

    await ctx.db.delete(args.assistantId);
    return null;
  },
});
