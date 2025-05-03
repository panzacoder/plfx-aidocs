import { z } from "zod";
import { zid } from "convex-helpers/server/zod";
import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod";
import { mutation, query } from "@/_generated/server";

// Create custom query and mutation functions that accept Zod schemas
export const zQuery = zCustomQuery(query, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);

// Zod schemas for function arguments (used by both frontend and backend)
export const createAssistantSchema = z.object({
  organizationId: zid("organizations"),
  aiProviderId: zid("aiProviders").optional(),
  name: z.string().min(1, "Name is required"),
  model: z.enum(["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]).default("open"),
  restrictedResponse: z.string().optional(),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])).default(["retrieval"]),
  fileIds: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const listAssistantsSchema = z.object({
  organizationId: zid("organizations"),
});

export const getAssistantSchema = z.object({
  assistantId: zid("assistants"),
});

export const updateAssistantSchema = z.object({
  assistantId: zid("assistants"),
  name: z.string().min(1, "Name is required").optional(),
  model: z.enum(["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]).optional(),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]).optional(),
  restrictedResponse: z.string().optional(),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])).optional(),
  fileIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  status: z.enum(["creating", "ready", "failed"]).optional(),
});

export const deleteAssistantSchema = z.object({
  assistantId: zid("assistants"),
});

export const syncAssistantSchema = z.object({
  assistantId: zid("assistants"),
});

export const addFileToAssistantSchema = z.object({
  assistantId: zid("assistants"),
  fileId: z.string(),
});

export const removeFileFromAssistantSchema = z.object({
  assistantId: zid("assistants"),
  fileId: z.string(),
});
