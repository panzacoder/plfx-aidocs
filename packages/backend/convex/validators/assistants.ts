import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "../_generated/dataModel";

export const assistants = {
  aiProviderId: zid("aiProviders"),
  externalId: z.string(),
};
export const zAssistants = z.object(assistants);

export const Assistants = Table("assistants", zodToConvexFields(assistants));
export type AssistantDoc = Doc<"assistants">;
