import { getAuthUserId } from "@convex-dev/auth/server";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { action, mutation, query } from "@/_generated/server";
import { api, internal } from "@/_generated/api";
import { username } from "@/utils/validators";

export const getUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const user = await ctx.db.get(userId);
    if (!user) return;

    // Get organization data
    let organization = null;
    if (user.organizationId) {
      organization = await ctx.db.get(user.organizationId);
    }

    return {
      ...user,
      name: user.username || user.name,
      organization,
      avatarUrl: user.imageId
        ? await ctx.storage.getUrl(user.imageId)
        : undefined,
    };
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const validatedUsername = username.safeParse(args.username);
    if (!validatedUsername.success) {
      throw new Error(validatedUsername.error.message);
    }
    await ctx.db.patch(userId, { username: validatedUsername.data });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not found");
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateUserImage = mutation({
  args: { imageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    ctx.db.patch(userId, { imageId: args.imageId });
  },
});

export const removeUserImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    ctx.db.patch(userId, { imageId: undefined, image: undefined });
  },
});

// Account deletion as an action (handles org cleanup + subscription cancellation)
export const deleteCurrentUserAccount = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.users.functions.getUser);
    if (!user) throw new Error("User not found");

    // Handle organization cleanup
    if (user.organization?._id) {
      // Cancel subscription if active
      if (user.organization.polarSubscriptionId) {
        await ctx.runAction(
          api.organizations.subscription.cancelOrganizationSubscription,
          { organizationId: user.organization._id },
        );
      }

      // If owner, delete the org; otherwise just remove membership
      if (user.organization.ownerId === user._id) {
        await ctx.runMutation(
          internal.organizations.internal.deleteOrganization,
          { id: user.organization._id },
        );
      } else {
        await ctx.runMutation(api.organizations.functions.removeMember, {
          organizationId: user.organization._id,
          userId: user._id,
        });
      }
    }

    // Delete auth accounts
    await ctx.runMutation(internal.users.functions.deleteUserAuthAccounts, {
      userId: user._id,
    });

    // Delete the user
    await ctx.runMutation(internal.users.functions.deleteUser, {
      userId: user._id,
    });

    return true;
  },
});

// Internal mutations for account deletion
export const deleteUserAuthAccounts = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await asyncMap(["google"], async (provider) => {
      const authAccount = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", args.userId).eq("provider", provider),
        )
        .unique();
      if (authAccount) await ctx.db.delete(authAccount._id);
    });
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});
