import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "../_generated/dataModel";
import { CURRENCIES, INTERVALS } from "./constants";

export const subscriptions = {
  userId: zid("users"),
  planId: zid("plans"),
  polarId: z.string(),
  polarPriceId: z.string(),
  currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
  interval: z.enum([INTERVALS.MONTH, INTERVALS.YEAR]),
  status: z.string(),
  currentPeriodStart: z.number().optional(),
  currentPeriodEnd: z.number().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
};
export const zSubscriptions = z.object(subscriptions);

export const Subscriptions = Table(
  "subscriptions",
  zodToConvexFields(subscriptions),
);
export type SubscriptionDoc = Doc<"subscriptions">;
