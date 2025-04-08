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
  aiProviderId: zid("aiProviders"),
  externalId: z.string().min(1, "External ID is required"),
});

export const listAssistantsSchema = z.object({
  aiProviderId: zid("aiProviders"),
});

export const getAssistantSchema = z.object({
  assistantId: zid("assistants"),
});

export const updateAssistantSchema = z.object({
  assistantId: zid("assistants"),
  externalId: z.string().min(1, "External ID is required"),
});

export const deleteAssistantSchema = z.object({
  assistantId: zid("assistants"),
});
