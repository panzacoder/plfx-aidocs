import { z } from "zod";
import { zid } from "convex-helpers/server/zod";
import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod";
import { mutation, query } from "@/_generated/server";

// Create custom query and mutation functions that accept Zod schemas
export const zQuery = zCustomQuery(query, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);

// Zod schemas for function arguments (used by both frontend and backend)
export const createAIProviderSchema = z.object({
  organizationId: zid("organizations"),
  apiKey: z.string().min(1, "API Key is required"),
});

export const listAIProvidersSchema = z.object({
  organizationId: zid("organizations"),
});

export const getAIProviderSchema = z.object({
  providerId: zid("aiProviders"),
});

export const updateAIProviderSchema = z.object({
  providerId: zid("aiProviders"),
  apiKey: z.string().min(1, "API Key is required"),
});

export const deleteAIProviderSchema = z.object({
  providerId: zid("aiProviders"),
});
