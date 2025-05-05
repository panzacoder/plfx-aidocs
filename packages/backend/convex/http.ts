import {
  type WebhookSubscriptionCreatedPayload,
  type WebhookSubscriptionCreatedPayload$Outbound,
  WebhookSubscriptionCreatedPayload$inboundSchema as WebhookSubscriptionCreatedPayloadSchema,
} from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload";
import {
  type WebhookSubscriptionUpdatedPayload,
  type WebhookSubscriptionUpdatedPayload$Outbound,
  WebhookSubscriptionUpdatedPayload$inboundSchema as WebhookSubscriptionUpdatedPayloadSchema,
} from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload";
import { httpRouter } from "convex/server";
import { Webhook } from "standardwebhooks";
import { internal } from "@/_generated/api";
import type { Doc } from "@/_generated/dataModel";
import { type ActionCtx, httpAction } from "@/_generated/server";
import { auth } from "@/auth";
import {
  sendSubscriptionErrorEmail,
  sendSubscriptionSuccessEmail,
} from "@/email/templates/subscriptionEmail";
import { env } from "./env";

const handleUpdateSubscription = async (
  ctx: ActionCtx,
  user: Doc<"users">,
  subscription:
    | WebhookSubscriptionCreatedPayload
    | WebhookSubscriptionUpdatedPayload,
) => {
  const subscriptionItem = subscription.data;
  await ctx.runMutation(internal.subscriptions.replaceSubscription, {
    userId: user._id,
    subscriptionPolarId: subscription.data.id,
    input: {
      productId: subscriptionItem.productId,
      priceId: subscriptionItem.priceId,
      interval: subscriptionItem.recurringInterval,
      status: subscriptionItem.status,
      currency: "usd",
      currentPeriodStart: subscriptionItem.currentPeriodStart.getTime(),
      currentPeriodEnd: subscriptionItem.currentPeriodEnd?.getTime(),
      cancelAtPeriodEnd: subscriptionItem.cancelAtPeriodEnd,
    },
  });
};

const handleSubscriptionChange = async (
  ctx: ActionCtx,
  event: WebhookSubscriptionCreatedPayload | WebhookSubscriptionUpdatedPayload,
) => {
  const user = await ctx.runQuery(internal.subscriptions.getPolarEventUser, {
    polarId: event.data.userId,
    email: event.data.user.email,
  });
  if (!user?.email) {
    throw new Error("User not found");
  }

  await handleUpdateSubscription(ctx, user, event);

  const freePlan = await ctx.runQuery(internal.subscriptions.getPlanByKey, {
    key: "free",
  });

  // Only send email for paid plans
  if (event.data.productId !== freePlan?.polarProductId) {
    await sendSubscriptionSuccessEmail({
      email: user.email,
      subscriptionId: event.data.id,
    });
  }

  return new Response(null);
};

const handlePolarSubscriptionUpdatedError = async (
  ctx: ActionCtx,
  event: WebhookSubscriptionCreatedPayload | WebhookSubscriptionUpdatedPayload,
) => {
  const subscription = event.data;

  const user = await ctx.runQuery(internal.subscriptions.getPolarEventUser, {
    polarId: subscription.userId,
    email: subscription.user.email,
  });
  if (!user?.email) throw new Error("User not found");

  const freePlan = await ctx.runQuery(internal.subscriptions.getPlanByKey, {
    key: "free",
  });

  // Only send email for paid plans
  if (event.data.productId !== freePlan?.polarProductId) {
    await sendSubscriptionErrorEmail({
      email: user.email,
      subscriptionId: subscription.id,
    });
  }
  return new Response(null);
};

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/events/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!request.body) {
      return new Response(null, { status: 400 });
    }

    const wh = new Webhook(btoa(env.POLAR_WEBHOOK_SECRET));
    const body = await request.text();
    const event = wh.verify(
      body,
      Object.fromEntries(request.headers.entries()),
    ) as
      | WebhookSubscriptionCreatedPayload$Outbound
      | WebhookSubscriptionUpdatedPayload$Outbound;

    try {
      switch (event.type) {
        /**
         * Occurs when a subscription has been created.
         */
        case "subscription.created": {
          return handleSubscriptionChange(
            ctx,
            WebhookSubscriptionCreatedPayloadSchema.parse(event),
          );
        }

        /**
         * Occurs when a subscription has been updated.
         * E.g. when a user upgrades or downgrades their plan.
         */
        case "subscription.updated": {
          return handleSubscriptionChange(
            ctx,
            WebhookSubscriptionUpdatedPayloadSchema.parse(event),
          );
        }
      }
    } catch (err: unknown) {
      switch (event.type) {
        case "subscription.created": {
          return handlePolarSubscriptionUpdatedError(
            ctx,
            WebhookSubscriptionCreatedPayloadSchema.parse(event),
          );
        }

        case "subscription.updated": {
          return handlePolarSubscriptionUpdatedError(
            ctx,
            WebhookSubscriptionUpdatedPayloadSchema.parse(event),
          );
        }
      }

      throw err;
    }

    return new Response(null);
  }),
});

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const signature = request.headers.get("webhook-signature");
    
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }
    
    // Verify webhook signature
    try {
      const webhook = new Webhook(env.POLAR_WEBHOOK_SECRET);
      const event = await webhook.verify(JSON.stringify(payload), signature);
      
      // Process different event types
      switch (event.type) {
        case "subscription.created":
          await ctx.runAction(internal.webhooks.handleSubscriptionCreated, { event });
          break;
        case "subscription.updated":
          await ctx.runAction(internal.webhooks.handleSubscriptionUpdated, { event });
          break;
        case "subscription.canceled":
          await ctx.runAction(internal.webhooks.handleSubscriptionCanceled, { event });
          break;
        case "customer.created":
        case "customer.updated":
          await ctx.runAction(internal.webhooks.handleCustomerEvent, { event });
          break;
        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }
      
      return new Response(null, { status: 200 });
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return new Response("Invalid signature", { status: 403 });
    }
  }),
});

export default http;
