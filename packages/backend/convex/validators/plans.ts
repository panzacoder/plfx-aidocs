import { zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "../_generated/dataModel";
import { PLANS, CURRENCIES, INTERVALS } from "./constants";

const price = {
  polarId: z.string(),
  amount: z.number(),
};
const zPrice = z.object(price);

const prices = {
  [CURRENCIES.USD]: zPrice,
};
const zPrices = z.object(prices);

export const plans = {
  key: z.enum([PLANS.FREE, PLANS.PRO]),
  polarProductId: z.string(),
  name: z.string(),
  description: z.string(),
  prices: z.object({
    [INTERVALS.MONTH]: zPrices.optional(),
    [INTERVALS.YEAR]: zPrices.optional(),
  }),
};
export const zPlans = z.object(plans);

export const Plans = Table("plans", zodToConvexFields(plans));
export type PlanDoc = Doc<"plans">;
