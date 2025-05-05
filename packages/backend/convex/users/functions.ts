import { getAuthUserId } from "@convex-dev/auth/server";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { mutation, query, action } from "@/_generated/server";
import { username } from "@/utils/validators";
import { api, internal } from "@/_generated/api";

export const getUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      return;
    }
    
    // Get organization data if user belongs to one
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
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
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
    if (!userId) {
      throw new Error("User not found");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateUserImage = mutation({
  args: {
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    ctx.db.patch(userId, { imageId: args.imageId });
  },
});

export const removeUserImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    ctx.db.patch(userId, { imageId: undefined, image: undefined });
  },
});

export const deleteCurrentUserAccount = action({
  args: {},
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    
    const user = await ctx.runQuery(api.users.functions.getUser);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get user's organization
    if (user.organization?._id) {
      // Cancel the organization's subscription if it exists
      if (user.organization.polarSubscriptionId) {
        await ctx.runAction(api.organizations.subscription.cancelOrganizationSubscription, {
          organizationId: user.organization._id
        });
      }
      
      // If user is the owner, delete the organization
      if (user.organization.ownerId === userId) {
        // Consider what to do with other members of the organization
        // For now, just delete the organization
        await ctx.runMutation(internal.organizations.internal.deleteOrganization, {
          id: user.organization._id
        });
      } else {
        // If not the owner, just remove the user from the members list
        await ctx.runMutation(api.organizations.functions.removeMember, {
          organizationId: user.organization._id,
          userId
        });
      }
    }
    
    // Delete auth accounts
    await ctx.runMutation(internal.users.functions.deleteUserAuthAccounts, {
      userId
    });
    
    // Finally delete the user
    await ctx.runMutation(internal.users.functions.deleteUser, {
      userId
    });
    
    return true;
  },
});

// Internal mutation to delete a user's auth accounts
export const deleteUserAuthAccounts = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await asyncMap(
      ["google" /* add other providers as needed */],
      async (provider) => {
        const authAccount = await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) =>
            q.eq("userId", args.userId).eq("provider", provider),
          )
          .unique();
        if (!authAccount) {
          return;
        }
        await ctx.db.delete(authAccount._id);
      },
    );
  },
});

// Internal mutation to delete a user
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});
