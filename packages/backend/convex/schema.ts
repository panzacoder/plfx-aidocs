import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import {
  UserModel,
  OrganizationModel,
  AIProviderModel,
  AssistantModel,
  FileModel,
  ThemeModel,
} from "./models";

export default defineSchema({
  ...authTables,

  users: defineTable(UserModel.fields)
    .index("email", ["email"])
    .index("organizationId", ["organizationId"]),

  organizations: defineTable(OrganizationModel.fields)
    .index("ownerId", ["ownerId"])
    .index("polarCustomerId", ["polarCustomerId"])
    .index("polarSubscriptionId", ["polarSubscriptionId"]),

  aiProviders: defineTable(AIProviderModel.fields)
    .index("organizationId", ["organizationId"]),

  assistants: defineTable(AssistantModel.fields)
    .index("organizationId", ["organizationId"])
    .index("aiProviderId", ["aiProviderId"]),

  files: defineTable(FileModel.fields)
    .index("assistantId", ["assistantId"]),

  themes: defineTable(ThemeModel.fields)
    .index("assistantId", ["assistantId"]),
});
