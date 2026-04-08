import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get theme for an assistant (public - used by chat UI)
export const getTheme = query({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const themes = await ctx.db
      .query("themes")
      .withIndex("by_assistantId", (q) =>
        q.eq("assistantId", args.assistantId),
      )
      .first();

    if (!themes) return null;

    // If theme has a logo, get its URL
    let logoUrl: string | null = null;
    if (themes.logoId) {
      logoUrl = await ctx.storage.getUrl(themes.logoId);
    }

    return { ...themes, logoUrl };
  },
});

// Create or update theme for an assistant
export const upsertTheme = mutation({
  args: {
    assistantId: v.id("assistants"),
    preset: v.optional(
      v.union(
        v.literal("default"),
        v.literal("minimal"),
        v.literal("professional"),
      ),
    ),
    primaryColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    logoId: v.optional(v.id("_storage")),
    welcomeMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify assistant access
    const assistant = await ctx.db.get(args.assistantId);
    if (!assistant) throw new Error("Assistant not found");

    const org = await ctx.db.get(assistant.organizationId);
    if (!org) throw new Error("Organization not found");
    if (
      org.ownerId.toString() !== userId.toString() &&
      !org.members.includes(userId)
    ) {
      throw new Error("Access denied");
    }

    // Check for existing theme
    const existing = await ctx.db
      .query("themes")
      .withIndex("by_assistantId", (q) =>
        q.eq("assistantId", args.assistantId),
      )
      .first();

    const { assistantId, ...themeData } = args;
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(themeData)) {
      if (value !== undefined) patch[key] = value;
    }

    if (existing) {
      // If changing logo, delete old one
      if (patch.logoId && existing.logoId && patch.logoId !== existing.logoId) {
        await ctx.storage.delete(existing.logoId);
      }
      await ctx.db.patch(existing._id, patch);
      const themeId = existing._id;
      // Link theme to assistant if not already
      if (!assistant.themeId) {
        await ctx.db.patch(assistantId, { themeId });
      }
      return await ctx.db.get(themeId);
    }

    // Create new theme
    const themeId = await ctx.db.insert("themes", {
      assistantId,
      preset: patch.preset ?? "default",
      primaryColor: patch.primaryColor,
      backgroundColor: patch.backgroundColor,
      textColor: patch.textColor,
      fontFamily: patch.fontFamily,
      logoId: patch.logoId,
      welcomeMessage: patch.welcomeMessage,
    });

    // Link theme to assistant
    await ctx.db.patch(assistantId, { themeId });

    return await ctx.db.get(themeId);
  },
});

// Generate upload URL for theme logo
export const generateLogoUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
