import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Handle subscription created event
export const handleSubscriptionCreated = internalAction({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const event = args.event;
    const subscriptionData = event.data;
    
    // Find organization by Polar customer ID
    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarCustomerId, 
      { polarCustomerId: subscriptionData.customerId }
    );
    
    if (!organization) {
      console.error(`No organization found for customer ${subscriptionData.customerId}`);
      return;
    }
    
    // Update organization with subscription details
    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      polarSubscriptionId: subscriptionData.id,
      subscriptionStatus: subscriptionData.status,
      subscriptionPlan: subscriptionData.productKey,
      subscriptionUpdatedAt: Date.now()
    });
    
    console.log(`Updated subscription for organization ${organization._id}`);
  }
});

// Handle subscription updated event
export const handleSubscriptionUpdated = internalAction({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const event = args.event;
    const subscriptionData = event.data;
    
    // Find organization by subscription ID
    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarSubscriptionId, 
      { polarSubscriptionId: subscriptionData.id }
    );
    
    if (!organization) {
      console.error(`No organization found for subscription ${subscriptionData.id}`);
      return;
    }
    
    // Update organization with new subscription details
    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      subscriptionStatus: subscriptionData.status,
      subscriptionPlan: subscriptionData.productKey,
      subscriptionUpdatedAt: Date.now()
    });
    
    console.log(`Updated subscription for organization ${organization._id}`);
  }
});

// Handle subscription canceled event
export const handleSubscriptionCanceled = internalAction({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const event = args.event;
    const subscriptionData = event.data;
    
    // Find organization by subscription ID
    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarSubscriptionId, 
      { polarSubscriptionId: subscriptionData.id }
    );
    
    if (!organization) {
      console.error(`No organization found for subscription ${subscriptionData.id}`);
      return;
    }
    
    // Update organization subscription status
    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      subscriptionStatus: "canceled",
      subscriptionUpdatedAt: Date.now()
    });
    
    console.log(`Canceled subscription for organization ${organization._id}`);
  }
});

// Handle customer events
export const handleCustomerEvent = internalAction({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const event = args.event;
    const customerData = event.data;
    
    // Find organization by Polar customer ID
    const organization = await ctx.runQuery(
      internal.organizations.internal.getByPolarCustomerId, 
      { polarCustomerId: customerData.id }
    );
    
    if (!organization) {
      console.log(`No organization found for customer ${customerData.id}`);
      // This might be a new customer - check metadata for org ID
      if (customerData.metadata?.organizationId) {
        // Update organization with customer ID
        await ctx.runMutation(internal.organizations.internal.update, {
          id: customerData.metadata.organizationId,
          polarCustomerId: customerData.id,
          billingEmail: customerData.email,
          billingName: customerData.name
        });
      }
      return;
    }
    
    // Update organization with customer details
    await ctx.runMutation(internal.organizations.internal.update, {
      id: organization._id,
      billingEmail: customerData.email,
      billingName: customerData.name
    });
  }
}); 