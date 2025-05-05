import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Step 1: Prepare for migration by backing up existing data
export const prepareForMigration = internalMutation({
  handler: async (ctx) => {
    // Create backup collections
    await ctx.db.system.createTable("backup_subscriptions");
    await ctx.db.system.createTable("backup_plans");
    
    // Copy existing data
    const subscriptions = await ctx.db.query("subscriptions").collect();
    const plans = await ctx.db.query("plans").collect();
    
    for (const sub of subscriptions) {
      await ctx.db.insert("backup_subscriptions", sub);
    }
    
    for (const plan of plans) {
      await ctx.db.insert("backup_plans", plan);
    }
    
    console.log(`Backed up ${subscriptions.length} subscriptions and ${plans.length} plans`);
    return {
      subscriptions: subscriptions.length,
      plans: plans.length
    };
  }
});

// Step 2: Migrate subscriptions to organizations
export const migrateSubscriptionsToOrganizations = internalMutation({
  handler: async (ctx) => {
    // Get all subscriptions
    const subscriptions = await ctx.db.query("subscriptions").collect();
    const migrated = [];
    const errors = [];
    
    // Process each subscription
    for (const sub of subscriptions) {
      try {
        const user = await ctx.db.get(sub.userId);
        if (!user) {
          errors.push({ subscriptionId: sub._id, error: "User not found" });
          continue;
        }
        
        // Find or create organization for this user
        let orgId;
        const existingOrg = await ctx.db
          .query("organizations")
          .withIndex("ownerId", q => q.eq("ownerId", user._id))
          .first();
          
        if (existingOrg) {
          orgId = existingOrg._id;
        } else {
          // Create new organization
          orgId = await ctx.db.insert("organizations", {
            name: `${user.name || user.username || "User"}'s Organization`,
            ownerId: user._id,
            members: [user._id],
          });
        }
        
        // Get plan info
        const plan = sub.planId ? await ctx.db.get(sub.planId) : null;
        
        // Update organization with subscription data
        await ctx.db.patch(orgId, {
          polarCustomerId: user.polarId,
          polarSubscriptionId: sub.polarId,
          subscriptionStatus: sub.status || "active",
          subscriptionPlan: plan?.key || "free",
          subscriptionUpdatedAt: Date.now()
        });
        
        // Update user with organization
        await ctx.db.patch(user._id, {
          organizationId: orgId,
          role: "owner"
        });
        
        migrated.push({
          userId: user._id,
          orgId,
          subscriptionId: sub._id
        });
      } catch (error) {
        errors.push({
          subscriptionId: sub._id,
          error: error.message
        });
      }
    }
    
    return {
      migrated,
      errors,
      totalMigrated: migrated.length,
      totalErrors: errors.length
    };
  }
});

// Step 3: Clean up old fields from user documents
export const cleanupUserFields = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const cleaned = [];
    
    for (const user of users) {
      if (user.polarId || user.polarSubscriptionPendingId) {
        await ctx.db.patch(user._id, {
          polarId: undefined,
          polarSubscriptionPendingId: undefined
        });
        cleaned.push(user._id);
      }
    }
    
    return { cleaned, total: cleaned.length };
  }
});

// Final step: Delete old tables (DANGER: only run after verifying migration success)
export const finalizeAndCleanup = internalMutation({
  handler: async (ctx) => {
    // CAUTION: This is destructive and irreversible
    // Uncomment only after confirming migration success
    
    // await ctx.db.system.deleteTable("subscriptions");
    // await ctx.db.system.deleteTable("plans");
    
    return { status: "Tables not deleted - uncomment code to proceed" };
  }
}); 