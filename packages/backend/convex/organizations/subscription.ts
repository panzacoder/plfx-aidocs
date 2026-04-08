"use node";

import { action } from "@/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/_generated/api";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/env";
import { getAuthUserId } from "@convex-dev/auth/server";

const getPolarClient = () =>
  new Polar({
    server: "sandbox", // Change to "production" for prod
    accessToken: env.POLAR_ACCESS_TOKEN,
  });

// Get full subscription information for an organization
export const getOrganizationSubscription = action({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(api.organizations.functions.get, {
      id: args.organizationId,
    });
    if (!org?.polarCustomerId) return null;

    const polar = getPolarClient();
    try {
      const customerState = await polar.customers.getState({
        id: org.polarCustomerId,
      });

      let subscriptionDetails = null;
      if (org.polarSubscriptionId) {
        subscriptionDetails = await polar.subscriptions.get({
          id: org.polarSubscriptionId,
        });
      }

      return { customerState, subscription: subscriptionDetails, organization: org };
    } catch (error) {
      console.error("Error fetching Polar subscription:", error);
      return {
        organization: org,
        error: "Failed to fetch subscription details",
      };
    }
  },
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
    const org = await ctx.runQuery(api.organizations.functions.get, {
      id: args.organizationId,
    });
    if (!org) throw new Error("Organization not found");

    const adminUser = await ctx.runQuery(api.users.functions.get, {
      id: org.ownerId,
    });
    if (!adminUser?.email) throw new Error("Admin email not found");

    const polar = getPolarClient();
    try {
      let customerId = org.polarCustomerId;

      if (!customerId) {
        const customer = await polar.customers.create({
          email: adminUser.email,
          name: org.name,
          metadata: { organizationId: args.organizationId },
        });
        customerId = customer.id;

        await ctx.runMutation(api.organizations.functions.update, {
          id: args.organizationId,
          polarCustomerId: customerId,
        });
      }

      const checkout = await polar.checkouts.create({
        productPriceId: args.planId,
        customerId,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl || args.successUrl,
      });

      return { url: checkout.url };
    } catch (error) {
      console.error("Error creating checkout:", error);
      throw new Error("Failed to create checkout");
    }
  },
});

// Cancel organization subscription
export const cancelOrganizationSubscription = action({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(api.organizations.functions.get, {
      id: args.organizationId,
    });
    if (!org?.polarSubscriptionId) {
      return { success: false, error: "No active subscription" };
    }

    const polar = getPolarClient();
    try {
      await polar.subscriptions.cancel({ id: org.polarSubscriptionId });

      await ctx.runMutation(api.organizations.functions.update, {
        id: args.organizationId,
        subscriptionStatus: "canceled",
        subscriptionUpdatedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return { success: false, error: "Failed to cancel subscription" };
    }
  },
});
