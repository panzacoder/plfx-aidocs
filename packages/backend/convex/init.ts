"use node";

import { Polar } from "@polar-sh/sdk";
import { internalAction } from "@/_generated/server";
import { env } from "@/env";

/**
 * Seed Polar products if they don't already exist.
 * Plans are now managed entirely in Polar — no local plans table.
 */
export default internalAction(async () => {
  const polar = new Polar({
    server: "sandbox",
    accessToken: env.POLAR_ACCESS_TOKEN,
  });

  const products = await polar.products.list({ isArchived: false });
  if (products?.result?.items?.length) {
    console.info("Polar products already exist, skipping seed.");
    return;
  }

  // Create Free plan
  await polar.products.create({
    name: "Free",
    description: "Basic access to the platform.",
    prices: [
      {
        amountType: "free",
        recurringInterval: "month",
      },
    ],
  });

  // Create Pro plan
  await polar.products.create({
    name: "Pro",
    description: "Full access to all features.",
    prices: [
      {
        amountType: "fixed",
        priceAmount: 2000,
        recurringInterval: "month",
      },
      {
        amountType: "fixed",
        priceAmount: 20000,
        recurringInterval: "year",
      },
    ],
  });

  console.info("Polar products created successfully.");
});
