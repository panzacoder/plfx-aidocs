import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

// Schema definition for the assistants table
export const assistants = {
  organizationId: zid("organizations"),
  aiProviderId: zid("aiProviders").optional(),
  externalId: z.string(),
  name: z.string().optional(),
  disclaimer: z.string().optional(),
  initialPrompt: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  // Updated model enum to include gpt-4o
  model: z.enum(["gpt-4o", "gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  fileIds: z.array(z.string()),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])),
  metadata: z.record(z.string(), z.string()).optional(),
  status: z.enum(["creating", "ready", "failed"]),
  lastSynced: z.number().optional(),
  // Add a field to store agent thread ID for reference
  agentThreadId: z.string().optional(),
  // Mark everything as using the agent now (removing optional)
  usesAgent: z.boolean().default(true),
};

// Export the table schema for use in schema.ts
export const Assistants = Table("assistants", zodToConvexFields(assistants));
export type AssistantDoc = Doc<"assistants">;
