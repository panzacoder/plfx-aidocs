/**
 * Zodvex model definitions for all custom tables.
 *
 * These are the source of truth for table shapes. The Convex schema in
 * schema.ts is derived from these models via defineZodModel + zodToConvexFields.
 *
 * Client-safe — these can be imported from React code for form validation.
 */
import { z } from "zod";
import { zx, defineZodModel } from "zodvex/core";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const UserModel = defineZodModel("users", {
  name: z.string().optional(),
  image: z.string().optional(),
  email: z.string().optional(),
  emailVerificationTime: z.number().optional(),
  phone: z.string().optional(),
  phoneVerificationTime: z.number().optional(),
  isAnonymous: z.boolean().optional(),
  username: z.string().optional(),
  imageId: zx.id("_storage").optional(),
  polarId: z.string().optional(),
  polarSubscriptionPendingId: zx.id("_scheduled_functions").optional(),
});

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------
export const OrganizationModel = defineZodModel("organizations", {
  name: z.string(),
  ownerId: zx.id("users"),
  members: z.array(zx.id("users")),
});

// ---------------------------------------------------------------------------
// AI Providers
// ---------------------------------------------------------------------------
export const AIProviderModel = defineZodModel("aiProviders", {
  organizationId: zx.id("organizations"),
  provider: z.enum(["openai"]),
  apiKey: z.string(),
});

// ---------------------------------------------------------------------------
// Assistants
// ---------------------------------------------------------------------------
export const AssistantModel = defineZodModel("assistants", {
  organizationId: zx.id("organizations"),
  aiProviderId: zx.id("aiProviders").optional(),

  // Identity
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),

  // Chat behavior
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),

  // LLM config
  model: z.string(), // e.g. "gpt-4o", "gpt-4o-mini"

  // Publishing
  isPublic: z.boolean(),
  allowedDomains: z.array(z.string()),
  passwordHash: z.string().optional(),

  // Theme
  themeId: zx.id("themes").optional(),

  // RAG
  ragNamespace: z.string().optional(),

  // Status
  status: z.enum(["draft", "ready", "error"]),
});

// ---------------------------------------------------------------------------
// Files (documents uploaded for RAG ingestion)
// ---------------------------------------------------------------------------
export const FileModel = defineZodModel("files", {
  assistantId: zx.id("assistants"),
  storageId: zx.id("_storage"),
  name: z.string(),
  size: z.number(),
  type: z.string(), // MIME type
  status: z.enum(["uploading", "processing", "ready", "failed"]),
});

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------
export const ThemeModel = defineZodModel("themes", {
  assistantId: zx.id("assistants"),
  preset: z.enum(["default", "minimal", "professional"]),
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoId: zx.id("_storage").optional(),
  welcomeMessage: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Plans (billing)
// ---------------------------------------------------------------------------
const PriceSchema = z.object({
  polarId: z.string(),
  amount: z.number(),
});

export const PlanModel = defineZodModel("plans", {
  key: z.enum(["free", "pro"]),
  polarProductId: z.string(),
  name: z.string(),
  description: z.string(),
  prices: z.object({
    month: z.object({ usd: PriceSchema }).optional(),
    year: z.object({ usd: PriceSchema }).optional(),
  }),
});

// ---------------------------------------------------------------------------
// Subscriptions (billing)
// ---------------------------------------------------------------------------
export const SubscriptionModel = defineZodModel("subscriptions", {
  userId: zx.id("users"),
  planId: zx.id("plans"),
  polarId: z.string(),
  polarPriceId: z.string(),
  currency: z.enum(["usd", "eur"]),
  interval: z.enum(["month", "year"]),
  status: z.string(),
  currentPeriodStart: z.number().optional(),
  currentPeriodEnd: z.number().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});
