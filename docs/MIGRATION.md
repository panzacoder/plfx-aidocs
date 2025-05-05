# Migration to Organization-Based Subscriptions

This document provides a step-by-step guide to migrate from the individual user subscription model to the new organization-based subscription model.

## Overview

The new subscription model:
- Moves subscriptions from individual users to organizations
- Uses Polar as the source of truth for subscription data
- Simplifies the data model by removing the plans and subscriptions tables
- Provides better support for team-based billing

## Prerequisites

1. Ensure you have a recent backup of your database
2. Verify Polar has all your product definitions set up
3. Configure the `POLAR_WEBHOOK_SECRET` environment variable:
   ```
   npx convex env set POLAR_WEBHOOK_SECRET "your-webhook-secret"
   ```

## Migration Steps

### 1. Deploy the New Code

Deploy the updated code to your development environment first:

```
npx convex dev
```

### 2. Prepare for Migration

Run the preparation function to back up your existing subscription and plan data:

```javascript
// From your development console or a script
await convex.run("migrations:prepareForMigration");
```

### 3. Run the Migration

Migrate existing subscriptions to the organization model:

```javascript
// From your development console or a script
const result = await convex.run("migrations:migrateSubscriptionsToOrganizations");
console.log(`Migrated ${result.totalMigrated} subscriptions with ${result.totalErrors} errors`);

// If there are errors, inspect them:
if (result.errors.length > 0) {
  console.log("Errors:", result.errors);
}
```

### 4. Clean Up User Fields

Remove the old subscription-related fields from user documents:

```javascript
// From your development console or a script
const cleanup = await convex.run("migrations:cleanupUserFields");
console.log(`Cleaned up ${cleanup.total} user documents`);
```

### 5. Verify Migration

Check a few organizations to ensure they have the correct subscription data:

```javascript
// Get some sample organizations
const orgs = await convex.query("organizations:getUserOrganization");
console.log(orgs);
```

Verify that:
- Organizations have the correct polarCustomerId, polarSubscriptionId, and subscriptionStatus
- Users are associated with the correct organization
- Feature access checks work correctly

### 6. Configure Polar Webhooks

Set up webhooks in the Polar dashboard pointing to your webhook endpoint:

```
https://your-convex-deployment.convex.cloud/webhooks/polar
```

Be sure to enable the following event types:
- subscription.created
- subscription.updated
- subscription.canceled
- customer.created
- customer.updated

### 7. Finalize and Clean Up

After verifying everything works correctly, you can remove the old tables. 
**THIS IS A DESTRUCTIVE OPERATION AND CANNOT BE UNDONE!**

1. First, edit the `migrations.ts` file to uncomment the deleteTable lines in the finalizeAndCleanup function
2. Then run:

```javascript
// From your development console or a script - ONLY AFTER VERIFICATION
await convex.run("migrations:finalizeAndCleanup");
```

## Rollback Plan

If you need to roll back:

1. Restore from your database backup
2. Revert the code changes
3. Re-deploy

## Post-Migration Tasks

- Update UI components to use the new organization-based subscription API
- Communicate the changes to users if necessary
- Monitor for any issues after the migration 