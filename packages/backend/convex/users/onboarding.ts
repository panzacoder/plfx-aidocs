import { mutation } from "@/_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { username } from "@/utils/validators";

/**
 * Complete user onboarding in a single atomic operation
 * This ensures username and organization creation happen together
 */
export const completeOnboarding = mutation({
  args: {
    username: v.string(),
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate username
    const validatedUsername = username.safeParse(args.username);
    if (!validatedUsername.success) {
      throw new Error(validatedUsername.error.issues[0]?.message || "Invalid username");
    }

    // Check if user already has username and organization
    if (user.username && user.organizationId) {
      const organization = await ctx.db.get(user.organizationId);
      return {
        success: true,
        user: { ...user, username: user.username },
        organization,
        message: "Already onboarded",
      };
    }

    try {
      // Step 1: Update username if not already set
      if (!user.username) {
        await ctx.db.patch(userId, { 
          username: validatedUsername.data 
        });
      }

      // Step 2: Create organization if user doesn't have one
      let organizationId = user.organizationId;
      let organization = null;

      if (!organizationId) {
        const orgName = args.organizationName || `${validatedUsername.data}'s Organization`;
        
        organizationId = await ctx.db.insert("organizations", {
          name: orgName,
          ownerId: userId,
          members: [userId],
          subscriptionStatus: "none",
        });

        // Step 3: Associate user with organization
        await ctx.db.patch(userId, {
          organizationId,
          role: "owner",
        });
      }

      // Get final state
      const updatedUser = await ctx.db.get(userId);
      organization = await ctx.db.get(organizationId);

      return {
        success: true,
        user: updatedUser,
        organization,
        message: "Onboarding completed successfully",
      };
    } catch (error) {
      console.error("Onboarding error:", error);
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
  },
});

/**
 * Check if user needs onboarding
 */
export const checkOnboardingStatus = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { needsOnboarding: true, reason: "not_authenticated" };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { needsOnboarding: true, reason: "user_not_found" };
    }

    // Check if user has username
    if (!user.username) {
      return { needsOnboarding: true, reason: "no_username" };
    }

    // Check if user has organization
    if (!user.organizationId) {
      return { needsOnboarding: true, reason: "no_organization" };
    }

    // Check if organization exists
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      return { needsOnboarding: true, reason: "organization_missing" };
    }

    return { 
      needsOnboarding: false, 
      user, 
      organization 
    };
  },
});