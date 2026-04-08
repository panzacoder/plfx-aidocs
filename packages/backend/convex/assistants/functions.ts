import { v } from "convex/values";
import { mutation, query } from "@/_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";

// Helper to verify user has access to an organization
async function verifyOrgAccess(
  ctx: { db: any },
  organizationId: any,
  userId: any,
) {
  const organization = await ctx.db.get(organizationId);
  if (!organization) throw new Error("Organization not found");
  if (
    organization.ownerId.toString() !== userId.toString() &&
    !organization.members.includes(userId)
  ) {
    throw new Error("Access denied to this organization");
  }
  return organization;
}

// Create a new assistant
export const createAssistant = mutation({
  args: {
    organizationId: v.id("organizations"),
    aiProviderId: v.optional(v.id("aiProviders")),
    name: v.string(),
    model: v.optional(v.string()),
    instructions: v.optional(v.string()),
    description: v.optional(v.string()),
    initialPrompt: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("open"), v.literal("restricted"))),
    restrictedResponse: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    allowedDomains: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await verifyOrgAccess(ctx, args.organizationId, userId);

    const assistantId = await ctx.db.insert("assistants", {
      organizationId: args.organizationId,
      aiProviderId: args.aiProviderId,
      name: args.name,
      description: args.description,
      instructions: args.instructions,
      initialPrompt: args.initialPrompt,
      disclaimer: args.disclaimer,
      mode: args.mode ?? "open",
      restrictedResponse: args.restrictedResponse,
      model: args.model ?? "gpt-4o",
      isPublic: args.isPublic ?? false,
      allowedDomains: args.allowedDomains ?? [],
      status: "draft",
      // RAG namespace scoped to this assistant
      ragNamespace: `org-${args.organizationId}-assistant-${Date.now()}`,
    });

    return await ctx.db.get(assistantId);
  },
});

// List all assistants for an organization
export const listAssistants = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await verifyOrgAccess(ctx, args.organizationId, userId);

    return await ctx.db
      .query("assistants")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
  },
});

// Get a specific assistant
export const getAssistant = query({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) return null;

    await verifyOrgAccess(ctx, assistant.organizationId, userId);
    return assistant;
  },
});

// Get an assistant for public chat (no auth required)
export const getPublicAssistant = query({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant || !assistant.isPublic) return null;

    // Return only the fields needed for the public chat UI
    return {
      _id: assistant._id,
      name: assistant.name,
      description: assistant.description,
      initialPrompt: assistant.initialPrompt,
      disclaimer: assistant.disclaimer,
      mode: assistant.mode,
      themeId: assistant.themeId,
      allowedDomains: assistant.allowedDomains,
      passwordHash: assistant.passwordHash,
    };
  },
});

// Update an assistant
export const updateAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
    name: v.optional(v.string()),
    model: v.optional(v.string()),
    instructions: v.optional(v.string()),
    description: v.optional(v.string()),
    initialPrompt: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("open"), v.literal("restricted"))),
    restrictedResponse: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    allowedDomains: v.optional(v.array(v.string())),
    passwordHash: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("ready"), v.literal("error")),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) throw new Error("Assistant not found");

    await verifyOrgAccess(ctx, assistant.organizationId, userId);

    const { assistantId, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(assistantId, patch);
    return await ctx.db.get(assistantId);
  },
});

// Delete an assistant
export const deleteAssistant = mutation({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) throw new Error("Assistant not found");

    await verifyOrgAccess(ctx, assistant.organizationId, userId);

    // Delete related files and their storage
    const files = await ctx.db
      .query("files")
      .withIndex("by_assistantId", (q) =>
        q.eq("assistantId", args.assistantId),
      )
      .collect();

    for (const file of files) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }

    // Delete related theme
    const themes = await ctx.db
      .query("themes")
      .withIndex("by_assistantId", (q) =>
        q.eq("assistantId", args.assistantId),
      )
      .collect();

    for (const theme of themes) {
      if (theme.logoId) await ctx.storage.delete(theme.logoId);
      await ctx.db.delete(theme._id);
    }

    // Delete the assistant
    await ctx.db.delete(args.assistantId);
    return null;
  },
});
