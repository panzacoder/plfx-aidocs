import { mutation } from "@/_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { username } from "@/utils/validators";

/**
 * Complete user onboarding in a single atomic operation.
 * Creates both the username and personal organization together.
 */
export const completeOnboarding = mutation({
  args: {
    username: v.string(),
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const validatedUsername = username.safeParse(args.username);
    if (!validatedUsername.success) {
      throw new Error(
        validatedUsername.error.issues[0]?.message || "Invalid username",
      );
    }

    // Already onboarded
    if (user.username && user.organizationId) {
      const organization = await ctx.db.get(user.organizationId);
      return { success: true, user, organization, message: "Already onboarded" };
    }

    // Set username
    if (!user.username) {
      await ctx.db.patch(userId, { username: validatedUsername.data });
    }

    // Create organization
    let organizationId = user.organizationId;
    if (!organizationId) {
      const orgName =
        args.organizationName || `${validatedUsername.data}'s Organization`;

      organizationId = await ctx.db.insert("organizations", {
        name: orgName,
        ownerId: userId,
        members: [userId],
        subscriptionStatus: "none",
      });

      await ctx.db.patch(userId, { organizationId, role: "owner" });
    }

    const updatedUser = await ctx.db.get(userId);
    const organization = await ctx.db.get(organizationId);

    return { success: true, user: updatedUser, organization };
  },
});

/**
 * Check if user needs onboarding.
 */
export const checkOnboardingStatus = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId)
      return { needsOnboarding: true, reason: "not_authenticated" };

    const user = await ctx.db.get(userId);
    if (!user) return { needsOnboarding: true, reason: "user_not_found" };

    if (!user.username)
      return { needsOnboarding: true, reason: "no_username" };

    if (!user.organizationId)
      return { needsOnboarding: true, reason: "no_organization" };

    const organization = await ctx.db.get(user.organizationId);
    if (!organization)
      return { needsOnboarding: true, reason: "organization_missing" };

    return { needsOnboarding: false, user, organization };
  },
});
