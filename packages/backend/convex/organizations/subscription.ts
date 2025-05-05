import { action, query, mutation } from "@/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/_generated/api";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/env";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get Polar client
const getPolarClient = () => new Polar({
  server: "sandbox", // Change to "production" for prod
  accessToken: env.POLAR_ACCESS_TOKEN,
});

// Get full subscription information for an organization
export const getOrganizationSubscription = action({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(api.organizations.functions.get, { id: args.organizationId });
    if (!org?.polarCustomerId) return null;
    
    const polar = getPolarClient();
    try {
      // Get customer state from Polar
      const customerState = await polar.customers.getState({
        id: org.polarCustomerId,
      });
      
      // Get subscription details if available
      let subscriptionDetails = null;
      if (org.polarSubscriptionId) {
        subscriptionDetails = await polar.subscriptions.get({
          id: org.polarSubscriptionId
        });
      }
      
      return {
        customerState,
        subscription: subscriptionDetails,
        organization: org
      };
    } catch (error) {
      console.error("Error fetching Polar subscription:", error);
      return { organization: org, error: "Failed to fetch subscription details" };
    }
  }
});

// Create checkout for organization subscription
export const createOrganizationCheckout = action({
  args: {
    organizationId: v.id("organizations"),
    planId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(api.organizations.functions.get, { id: args.organizationId });
    if (!org) throw new Error("Organization not found");
    
    // Get admin user for contact info
    const adminUser = await ctx.runQuery(api.users.functions.get, { id: org.ownerId });
    if (!adminUser?.email) throw new Error("Admin email not found");
    
    const polar = getPolarClient();
    try {
      // Create or update customer in Polar
      let customerId = org.polarCustomerId;
      
      if (!customerId) {
        const customer = await polar.customers.create({
          email: adminUser.email,
          name: org.name,
          metadata: { organizationId: args.organizationId }
        });
        customerId = customer.id;
        
        // Save customer ID to organization
        await ctx.runMutation(api.organizations.functions.update, {
          id: args.organizationId,
          polarCustomerId: customerId
        });
      }
      
      // Create checkout session
      const checkout = await polar.checkouts.create({
        productPriceId: args.planId,
        customerId: customerId,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl || args.successUrl
      });
      
      return { url: checkout.url };
    } catch (error) {
      console.error("Error creating checkout:", error);
      throw new Error("Failed to create checkout");
    }
  }
});

// Cancel organization subscription
export const cancelOrganizationSubscription = action({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(api.organizations.functions.get, { id: args.organizationId });
    if (!org?.polarSubscriptionId) {
      return { success: false, error: "No active subscription" };
    }
    
    const polar = getPolarClient();
    try {
      await polar.subscriptions.cancel({
        id: org.polarSubscriptionId
      });
      
      // Update local organization status
      await ctx.runMutation(api.organizations.functions.update, {
        id: args.organizationId,
        subscriptionStatus: "canceled",
        subscriptionUpdatedAt: Date.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return { success: false, error: "Failed to cancel subscription" };
    }
  }
});

// Check if organization has access to specific feature
export const hasFeatureAccess = query({
  args: {
    organizationId: v.id("organizations"),
    featureKey: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org || org.subscriptionStatus !== "active") return false;
    
    // Simple feature check based on plan
    // Can be expanded to use Polar's entitlements API for more complex cases
    const planFeatures = {
      "free": ["basic_access"],
      "pro": ["basic_access", "advanced_features", "support"],
      "enterprise": ["basic_access", "advanced_features", "support", "dedicated_support", "custom_integrations"]
    };
    
    const plan = org.subscriptionPlan || "free";
    return planFeatures[plan]?.includes(args.featureKey) || false;
  }
});

// Check if current user has access to specific feature via organization
export const hasUserFeatureAccess = query({
  args: {
    featureKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    
    // Get user's organization
    const user = await ctx.db.get(userId);
    if (!user?.organizationId) return false;
    
    return ctx.db.query().api.organizations.subscription.hasFeatureAccess({
      organizationId: user.organizationId,
      featureKey: args.featureKey
    });
  }
}); 