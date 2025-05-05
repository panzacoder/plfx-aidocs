import { Polar } from "@polar-sh/sdk";
import { asyncMap } from "convex-helpers";
import { internalAction } from "@/_generated/server";
import { env } from "@/env";
import { CURRENCIES, INTERVALS, PLANS } from "@/constants";

type PlanKey = (typeof PLANS)[keyof typeof PLANS];

// Define our product offerings - these will be created in Polar but not stored locally
const seedProducts = [
  {
    key: PLANS.FREE,
    name: "Free",
    description: "Some of the things, free forever.",
    amountType: "free",
    prices: {
      [INTERVALS.MONTH]: {
        [CURRENCIES.USD]: 0,
      },
    },
  },
  {
    key: PLANS.PRO,
    name: "Pro",
    description: "All the things for one low monthly price.",
    amountType: "fixed",
    prices: {
      [INTERVALS.MONTH]: {
        [CURRENCIES.USD]: 2000,
      },
      [INTERVALS.YEAR]: {
        [CURRENCIES.USD]: 20000,
      },
    },
  },
] as const;

export default internalAction(async (ctx) => {
  /**
   * Initialize Polar Products.
   */
  const polar = new Polar({
    server: "sandbox",
    accessToken: env.POLAR_ACCESS_TOKEN,
  });
  
  // Check if products already exist
  const existingProducts = await polar.products.list({
    isArchived: false,
  });
  if (existingProducts?.result?.items?.length) {
    console.info("🏃‍♂️ Skipping Polar products creation - products already exist.");
    return;
  }

  // Create products in Polar
  const createdProducts = await asyncMap(seedProducts, async (product) => {
    // Create Polar product
    const polarProduct = await polar.products.create({
      name: product.name,
      description: product.description,
      prices: Object.entries(product.prices).map(([interval, amount]) => ({
        amountType: product.amountType,
        priceAmount: amount.usd,
        recurringInterval: interval,
      })),
    });
    
    console.info(`Created Polar product: ${product.name} (${polarProduct.id})`);
    
    // Map prices for reference
    const monthPrice = polarProduct.prices.find(
      (price) =>
        price.type === "recurring" &&
        price.recurringInterval === INTERVALS.MONTH,
    );
    const yearPrice = polarProduct.prices.find(
      (price) =>
        price.type === "recurring" &&
        price.recurringInterval === INTERVALS.YEAR,
    );
    
    // Return product info for logging
    return {
      key: product.key,
      name: product.name,
      id: polarProduct.id,
      monthPriceId: monthPrice?.id,
      yearPriceId: yearPrice?.id,
    };
  });

  console.info("📦 Polar Products have been successfully created:");
  console.info(JSON.stringify(createdProducts, null, 2));
  
  // Reminder about adding plan IDs to the UI
  console.info("\n⚠️ Important: Update the planIdMap in your billing page with these Polar product/price IDs");
});
