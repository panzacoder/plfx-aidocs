import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

export const organizations = {
  name: z.string(),
  ownerId: zid("users"),
  members: z.array(zid("users")),
};
export const zOrganizations = z.object(organizations);

export const Organizations = Table(
  "organizations",
  zodToConvexFields(organizations),
);
export type OrganizationDoc = Doc<"organizations">;
