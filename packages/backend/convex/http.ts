import { httpRouter } from "convex/server";
import { Webhook } from "standardwebhooks";
import { internal } from "@/_generated/api";
import { httpAction } from "@/_generated/server";
import { auth } from "@/auth";
import { env } from "./env";

const http = httpRouter();

auth.addHttpRoutes(http);

// Organization-level Polar webhook handler
http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("webhook-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    try {
      const webhook = new Webhook(env.POLAR_WEBHOOK_SECRET);
      const event = webhook.verify(body, {
        "webhook-signature": signature,
      }) as any;

      switch (event.type) {
        case "subscription.created":
          await ctx.runAction(internal.webhooks.handleSubscriptionCreated, {
            event,
          });
          break;
        case "subscription.updated":
          await ctx.runAction(internal.webhooks.handleSubscriptionUpdated, {
            event,
          });
          break;
        case "subscription.canceled":
          await ctx.runAction(internal.webhooks.handleSubscriptionCanceled, {
            event,
          });
          break;
        case "customer.created":
        case "customer.updated":
          await ctx.runAction(internal.webhooks.handleCustomerEvent, {
            event,
          });
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

// CORS preflight for upload proxy
http.route({
  path: "/upload-proxy",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      }),
    });
  }),
});

// Upload proxy — allows cross-origin file uploads to Convex storage
http.route({
  path: "/upload-proxy",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    try {
      const blob = await request.blob();
      const storageId = await ctx.storage.store(blob);

      return new Response(JSON.stringify({ storageId }), {
        status: 200,
        headers: new Headers({
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }),
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: new Headers({
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }),
      });
    }
  }),
});

export default http;
