import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const handleSubscriptionCreated = internalAction({
  args: { event: v.any() },
  handler: async (ctx, args) => {
    const subscriptionData = args.event.data;

    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarCustomerId,
      { polarCustomerId: subscriptionData.customerId },
    );

    if (!organization) {
      console.error(
        `No organization found for customer ${subscriptionData.customerId}`,
      );
      return;
    }

    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      polarSubscriptionId: subscriptionData.id,
      subscriptionStatus: subscriptionData.status,
      subscriptionPlan: subscriptionData.productKey,
      subscriptionUpdatedAt: Date.now(),
    });
  },
});

export const handleSubscriptionUpdated = internalAction({
  args: { event: v.any() },
  handler: async (ctx, args) => {
    const subscriptionData = args.event.data;

    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarSubscriptionId,
      { polarSubscriptionId: subscriptionData.id },
    );

    if (!organization) {
      console.error(
        `No organization found for subscription ${subscriptionData.id}`,
      );
      return;
    }

    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      subscriptionStatus: subscriptionData.status,
      subscriptionPlan: subscriptionData.productKey,
      subscriptionUpdatedAt: Date.now(),
    });
  },
});

export const handleSubscriptionCanceled = internalAction({
  args: { event: v.any() },
  handler: async (ctx, args) => {
    const subscriptionData = args.event.data;

    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarSubscriptionId,
      { polarSubscriptionId: subscriptionData.id },
    );

    if (!organization) {
      console.error(
        `No organization found for subscription ${subscriptionData.id}`,
      );
      return;
    }

    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      subscriptionStatus: "canceled",
      subscriptionUpdatedAt: Date.now(),
    });
  },
});

export const handleCustomerEvent = internalAction({
  args: { event: v.any() },
  handler: async (ctx, args) => {
    const customerData = args.event.data;

    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarCustomerId,
      { polarCustomerId: customerData.id },
    );

    if (!organization) {
      // New customer — check metadata for org ID
      if (customerData.metadata?.organizationId) {
        await ctx.runMutation(internal.organizations.internal.update, {
          id: customerData.metadata.organizationId,
          polarCustomerId: customerData.id,
          billingEmail: customerData.email,
          billingName: customerData.name,
        });
      }
      return;
    }

    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      billingEmail: customerData.email,
      billingName: customerData.name,
    });
  },
});
