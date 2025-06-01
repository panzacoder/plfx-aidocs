import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@v1/backend/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

/**
 * This is a proxy that forwards clerk auth to convex
 */
export async function GET(req: NextRequest) {
  const authObj = auth();
  const userId = authObj.userId;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new Response("Convex URL not configured", { status: 500 });
  }

  const client = new ConvexHttpClient(convexUrl);

  try {
    const clerkJWT = await authObj.getToken({ template: "convex" });

    // Fetch user agent token by providing clerk JWT
    const response = await client.query(api.auth.getUserConvexToken, {
      clerkJWT,
    });

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error getting Convex token:", error);
    return new Response("Error getting token", { status: 500 });
  }
}
