/**
 * Zodvex model definitions for all custom tables.
 *
 * These are the source of truth for table shapes and indexes.
 * The Convex schema in schema.ts uses defineZodSchema to derive
 * the Convex schema from these models.
 *
 * Client-safe — can be imported from React code for form validation.
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
  organizationId: zx.id("organizations").optional(),
  role: z.enum(["owner", "admin", "member"]).optional(),
})
  .index("email", ["email"])
  .index("organizationId", ["organizationId"]);

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------
export const OrganizationModel = defineZodModel("organizations", {
  name: z.string(),
  ownerId: zx.id("users"),
  members: z.array(zx.id("users")),
  polarCustomerId: z.string().optional(),
  polarSubscriptionId: z.string().optional(),
  subscriptionStatus: z.enum(["active", "canceled", "trialing", "none"]),
  subscriptionPlan: z.string().optional(),
  billingEmail: z.string().optional(),
  billingName: z.string().optional(),
  subscriptionUpdatedAt: z.number().optional(),
})
  .index("ownerId", ["ownerId"])
  .index("polarCustomerId", ["polarCustomerId"])
  .index("polarSubscriptionId", ["polarSubscriptionId"]);

// ---------------------------------------------------------------------------
// AI Providers
// ---------------------------------------------------------------------------
export const AIProviderModel = defineZodModel("aiProviders", {
  organizationId: zx.id("organizations"),
  provider: z.enum(["openai"]),
  apiKey: z.string(),
}).index("organizationId", ["organizationId"]);

// ---------------------------------------------------------------------------
// Assistants
// ---------------------------------------------------------------------------
export const AssistantModel = defineZodModel("assistants", {
  organizationId: zx.id("organizations"),
  aiProviderId: zx.id("aiProviders").optional(),
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  model: z.string(),
  isPublic: z.boolean(),
  allowedDomains: z.array(z.string()),
  passwordHash: z.string().optional(),
  themeId: zx.id("themes").optional(),
  ragNamespace: z.string().optional(),
  status: z.enum(["draft", "ready", "error"]),
})
  .index("organizationId", ["organizationId"])
  .index("aiProviderId", ["aiProviderId"]);

// ---------------------------------------------------------------------------
// Files (documents uploaded for RAG ingestion)
// ---------------------------------------------------------------------------
export const FileModel = defineZodModel("files", {
  assistantId: zx.id("assistants"),
  storageId: zx.id("_storage"),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["uploading", "processing", "ready", "failed"]),
}).index("assistantId", ["assistantId"]);

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
}).index("assistantId", ["assistantId"]);
