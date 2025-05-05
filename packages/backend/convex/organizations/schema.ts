import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

export const organizations = {
  name: z.string(),
  ownerId: zid("users"),
  members: z.array(zid("users")),
  
  // Polar integration fields
  polarCustomerId: z.string().optional(),
  polarSubscriptionId: z.string().optional(),
  subscriptionStatus: z.enum(["active", "canceled", "trialing", "none"]).default("none"),
  subscriptionPlan: z.string().optional(), // Store plan key or ID
  
  // Optional metadata
  billingEmail: z.string().optional(),
  billingName: z.string().optional(),
  subscriptionUpdatedAt: z.number().optional(),
};

export const zOrganizations = z.object(organizations);

export const Organizations = Table("organizations", zodToConvexFields(organizations));
export type OrganizationDoc = Doc<"organizations">;
