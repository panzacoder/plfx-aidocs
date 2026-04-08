import { z } from "zod";
import { zx } from "zodvex/core";

export const createAssistantSchema = z.object({
  organizationId: zx.id("organizations"),
  aiProviderId: zx.id("aiProviders").optional(),
  name: z.string().min(1, "Name is required"),
  model: z.string().default("gpt-4o"),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]).default("open"),
  restrictedResponse: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowedDomains: z.array(z.string()).default([]),
});

export const updateAssistantSchema = z.object({
  assistantId: zx.id("assistants"),
  name: z.string().min(1).optional(),
  model: z.string().optional(),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]).optional(),
  restrictedResponse: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowedDomains: z.array(z.string()).optional(),
  passwordHash: z.string().optional(),
  status: z.enum(["draft", "ready", "error"]).optional(),
});

export const listAssistantsSchema = z.object({
  organizationId: zx.id("organizations"),
});

export const getAssistantSchema = z.object({
  assistantId: zx.id("assistants"),
});

export const deleteAssistantSchema = z.object({
  assistantId: zx.id("assistants"),
});
