import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

export const assistants = {
  organizationId: zid("organizations"),
  aiProviderId: zid("aiProviders").optional(),
  externalId: z.string(),
  name: z.string().optional(),
  disclaimer: z.string().optional(),
  initialPrompt: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  model: z.enum(["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  fileIds: z.array(z.string()),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])),
  metadata: z.record(z.string(), z.string()).optional(),
  status: z.enum(["creating", "ready", "failed"]),
  lastSynced: z.number().optional(),
};
export const zAssistants = z.object(assistants);

export const Assistants = Table("assistants", zodToConvexFields(assistants));
export type AssistantDoc = Doc<"assistants">;
