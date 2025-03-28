import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "../_generated/dataModel";

export const aiProviders = {
  organizationId: zid("organizations"),
  type: z.literal("OpenAI"),
  apiKey: z.string(),
};
export const zAIProviders = z.object(aiProviders);

export const AIProviders = Table("aiProviders", zodToConvexFields(aiProviders));
export type AIProviderDoc = Doc<"aiProviders">;
