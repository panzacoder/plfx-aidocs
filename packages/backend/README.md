# Backend Package

This package contains the Convex backend with organization-based subscription model using Polar.

## Subscription Model

Our application uses an organization-based subscription model with Polar as the source of truth:

- Organizations contain subscription data (status, plan, etc.)
- Users belong to organizations
- Polar manages all subscription and billing details
- We only store references to Polar entities (customerIds, subscriptionIds)

## Setting Up Polar Integration

1. **Environment Variables**

   You need to set the following environment variables:

   ```bash
   npx convex env set POLAR_ACCESS_TOKEN "your-polar-access-token"
   npx convex env set POLAR_WEBHOOK_SECRET "your-polar-webhook-secret"
   ```

2. **Initialize Polar Products**

   When you start the Convex development server, the `init.ts` file will automatically create the product offerings in Polar:

   ```bash
   npx convex dev
   ```

3. **Update Plan IDs**

   After initialization, you'll see the created Polar product and price IDs in the console. You need to update the `planIdMap` in the billing page with these IDs:

   ```typescript
   // In settings/billing/page.tsx
   const planIdMap: Record<string, string> = {
     free: "YOUR_FREE_PLAN_ID",
     pro: selectedPlanInterval === "month" ? "YOUR_PRO_MONTHLY_PRICE_ID" : "YOUR_PRO_YEARLY_PRICE_ID",
     enterprise: selectedPlanInterval === "month" ? "YOUR_ENTERPRISE_MONTHLY_PRICE_ID" : "YOUR_ENTERPRISE_YEARLY_PRICE_ID"
   };
   ```

4. **Configure Webhooks**

   In the Polar dashboard, set up a webhook pointing to:

   ```
   https://your-convex-deployment.convex.cloud/webhooks/polar
   ```

   Enable the following event types:
   - subscription.created
   - subscription.updated
   - subscription.canceled
   - customer.created
   - customer.updated

## Key Files

- `organizations/schema.ts` - Organization schema with subscription fields
- `organizations/subscription.ts` - Core subscription management functions
- `organizations/functions.ts` - Organization CRUD operations
- `webhooks.ts` - Handles Polar webhook events
- `http.ts` - HTTP endpoint for webhook reception
- `init.ts` - Creates products in Polar during initialization 