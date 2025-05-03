import { v } from "convex/values";
import { mutation, query, action } from "@/_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  createAssistantSchema,
  deleteAssistantSchema,
  getAssistantSchema,
  listAssistantsSchema,
  updateAssistantSchema,
  syncAssistantSchema,
  addFileToAssistantSchema,
  removeFileFromAssistantSchema,
} from "./validators";
import { Assistants } from "./schema";
import { internal } from "../_generated/api";

const assistantValidator = v.object({
  _id: v.id("assistants"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  aiProviderId: v.optional(v.id("aiProviders")),
  externalId: v.string(),
  name: v.optional(v.string()),
  disclaimer: v.optional(v.string()),
  initialPrompt: v.optional(v.string()),
  mode: v.union(v.literal("open"), v.literal("restricted")),
  restrictedResponse: v.optional(v.string()),
  model: v.union(v.literal("gpt-4-turbo-preview"), v.literal("gpt-4"), v.literal("gpt-3.5-turbo")),
  description: v.optional(v.string()),
  instructions: v.optional(v.string()),
  fileIds: v.array(v.string()),
  tools: v.array(v.string()),
  metadata: v.optional(v.record(v.string(), v.string())),
  status: v.union(v.literal("creating"), v.literal("ready"), v.literal("failed")),
  lastSynced: v.optional(v.number()),
});

// Create a new assistant
export const createAssistant = mutation({
  args: {
    ...Assistants.withoutSystemFields,
  },
  returns: assistantValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    createAssistantSchema.parse(args);

    // Verify the organization exists and user has access
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if user has access to the organization
    if (organization.ownerId.toString() !== userId.toString() && 
        !organization.members.includes(userId)) {
      throw new Error("Access denied to this organization");
    }

    // Create assistant in Convex with status "ready" since we're bypassing OpenAI for now
    const assistantId = await ctx.db.insert("assistants", {
      organizationId: args.organizationId,
      aiProviderId: args.aiProviderId, // This could be undefined
      name: args.name,
      disclaimer: args.disclaimer,
      initialPrompt: args.initialPrompt,
      mode: args.mode || "open",
      restrictedResponse: args.restrictedResponse,
      model: args.model,
      description: args.description,
      instructions: args.instructions,
      fileIds: args.fileIds || [],
      tools: args.tools || ["retrieval"],
      metadata: args.metadata,
      status: "ready", // Mark as ready since we're not using OpenAI
      externalId: "local-" + Math.random().toString(36).substring(2, 15), // Create a fake ID
    });

    // For now, we're not scheduling OpenAI assistant creation
    // When you're ready to add OpenAI integration, you can uncomment this:
    // await ctx.scheduler.runAfter(0, internal.assistants.actions.createOpenAIAssistant, {
    //   assistantId,
    // });

    const result = await ctx.db.get(assistantId);
    if (!result) {
      throw new Error("Failed to create Assistant");
    }

    return result;
  },
});

// List all assistants for an organization
export const listAssistants = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(assistantValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    listAssistantsSchema.parse(args);

    // Verify the organization exists and user has access
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if user has access to the organization
    if (organization.ownerId.toString() !== userId.toString() && 
        !organization.members.includes(userId)) {
      throw new Error("Access denied to this organization");
    }

    const assistants = await ctx.db
      .query("assistants")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
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

    // Check organization access instead of AI provider
    if (assistant.organizationId) {
      const organization = await ctx.db.get(assistant.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user has access to the organization
      if (organization.ownerId.toString() !== userId.toString() && 
          !organization.members.includes(userId)) {
        throw new Error("Access denied to this organization");
      }
    }

    return assistant;
  },
});

// Update an assistant
export const updateAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
    name: v.optional(v.string()),
    model: v.optional(v.union(v.literal("gpt-4-turbo-preview"), v.literal("gpt-4"), v.literal("gpt-3.5-turbo"))),
    instructions: v.optional(v.string()),
    description: v.optional(v.string()),
    initialPrompt: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("open"), v.literal("restricted"))),
    restrictedResponse: v.optional(v.string()),
    tools: v.optional(v.array(v.string())),
    fileIds: v.optional(v.array(v.string())),
    metadata: v.optional(v.record(v.string(), v.string())),
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

    // Check organization access
    if (assistant.organizationId) {
      const organization = await ctx.db.get(assistant.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user has access to the organization
      if (organization.ownerId.toString() !== userId.toString() && 
          !organization.members.includes(userId)) {
        throw new Error("Access denied to this organization");
      }
    }

    // Set status to "creating" while the update is in progress
    const updateFields = {
      status: "creating" as const,
    };

    // Add all provided fields to the update
    if (args.name !== undefined) updateFields.name = args.name;
    if (args.model !== undefined) updateFields.model = args.model;
    if (args.instructions !== undefined) updateFields.instructions = args.instructions;
    if (args.description !== undefined) updateFields.description = args.description;
    if (args.initialPrompt !== undefined) updateFields.initialPrompt = args.initialPrompt;
    if (args.disclaimer !== undefined) updateFields.disclaimer = args.disclaimer;
    if (args.mode !== undefined) updateFields.mode = args.mode;
    if (args.restrictedResponse !== undefined) updateFields.restrictedResponse = args.restrictedResponse;
    if (args.tools !== undefined) updateFields.tools = args.tools;
    if (args.fileIds !== undefined) updateFields.fileIds = args.fileIds;
    if (args.metadata !== undefined) updateFields.metadata = args.metadata;

    // Update in Convex
    await ctx.db.patch(args.assistantId, updateFields);

    // Schedule the OpenAI assistant update
    await ctx.scheduler.runAfter(0, internal.assistants.actions.updateOpenAIAssistant, {
      assistantId: args.assistantId,
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

    // Check organization access
    if (assistant.organizationId) {
      const organization = await ctx.db.get(assistant.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user has access to the organization
      if (organization.ownerId.toString() !== userId.toString() && 
          !organization.members.includes(userId)) {
        throw new Error("Access denied to this organization");
      }
    }

    // If there's an external ID, delete from OpenAI
    if (assistant.externalId) {
      await ctx.scheduler.runAfter(0, internal.assistants.actions.deleteOpenAIAssistant, {
        assistantId: args.assistantId,
      });
    }

    // Delete related files
    const files = await ctx.db
      .query("files")
      .withIndex("by_assistantId", (q) => q.eq("assistantId", args.assistantId))
      .collect();
    
    for (const file of files) {
      await ctx.db.delete(file._id);
    }

    // Delete the assistant
    await ctx.db.delete(args.assistantId);
    return null;
  },
});

// Manually sync an assistant with OpenAI
export const syncAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
  },
  returns: assistantValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    syncAssistantSchema.parse(args);

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Check organization access
    if (assistant.organizationId) {
      const organization = await ctx.db.get(assistant.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user has access to the organization
      if (organization.ownerId.toString() !== userId.toString() && 
          !organization.members.includes(userId)) {
        throw new Error("Access denied to this organization");
      }
    }

    // Set status to "creating" while the sync is in progress
    await ctx.db.patch(args.assistantId, { status: "creating" });

    // Schedule the OpenAI assistant sync
    await ctx.scheduler.runAfter(0, internal.assistants.actions.syncOpenAIAssistant, {
      assistantId: args.assistantId,
    });

    const result = await ctx.db.get(args.assistantId);
    if (!result) {
      throw new Error("Failed to sync Assistant");
    }

    return result;
  },
});

// Add a file to an assistant
export const addFileToAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
    fileId: v.string(),
  },
  returns: assistantValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    addFileToAssistantSchema.parse(args);

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Check organization access
    if (assistant.organizationId) {
      const organization = await ctx.db.get(assistant.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user has access to the organization
      if (organization.ownerId.toString() !== userId.toString() && 
          !organization.members.includes(userId)) {
        throw new Error("Access denied to this organization");
      }
    }

    // Add file ID to the assistant's fileIds array if not already present
    const fileIds = new Set(assistant.fileIds || []);
    if (!fileIds.has(args.fileId)) {
      fileIds.add(args.fileId);
      
      // Update in Convex
      await ctx.db.patch(args.assistantId, { 
        fileIds: Array.from(fileIds),
        status: "creating" 
      });

      // Schedule the file attachment in OpenAI
      await ctx.scheduler.runAfter(0, internal.assistants.actions.attachFileToAssistant, {
        assistantId: args.assistantId,
        fileId: args.fileId,
      });
    }

    const result = await ctx.db.get(args.assistantId);
    if (!result) {
      throw new Error("Failed to add file to Assistant");
    }

    return result;
  },
});

// Remove a file from an assistant
export const removeFileFromAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
    fileId: v.string(),
  },
  returns: assistantValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod schema
    removeFileFromAssistantSchema.parse(args);

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    // Check organization access
    if (assistant.organizationId) {
      const organization = await ctx.db.get(assistant.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user has access to the organization
      if (organization.ownerId.toString() !== userId.toString() && 
          !organization.members.includes(userId)) {
        throw new Error("Access denied to this organization");
      }
    }

    // Remove file ID from the assistant's fileIds array
    const fileIds = new Set(assistant.fileIds || []);
    if (fileIds.has(args.fileId)) {
      fileIds.delete(args.fileId);
      
      // Update in Convex
      await ctx.db.patch(args.assistantId, { 
        fileIds: Array.from(fileIds),
        status: "creating" 
      });

      // Schedule the file removal in OpenAI
      await ctx.scheduler.runAfter(0, internal.assistants.actions.removeFileFromAssistant, {
        assistantId: args.assistantId,
        fileId: args.fileId,
      });
    }

    const result = await ctx.db.get(args.assistantId);
    if (!result) {
      throw new Error("Failed to remove file from Assistant");
    }

    return result;
  },
});
