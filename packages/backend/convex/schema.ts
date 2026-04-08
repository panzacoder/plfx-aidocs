import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import {
  UserModel,
  OrganizationModel,
  AIProviderModel,
  AssistantModel,
  FileModel,
  ThemeModel,
  PlanModel,
  SubscriptionModel,
} from "./models";

export default defineSchema({
  ...authTables,

  users: defineTable(UserModel.fields)
    .index("email", ["email"])
    .index("polarId", ["polarId"]),

  plans: defineTable(PlanModel.fields)
    .index("key", ["key"])
    .index("polarProductId", ["polarProductId"]),

  subscriptions: defineTable(SubscriptionModel.fields)
    .index("userId", ["userId"])
    .index("polarId", ["polarId"]),

  organizations: defineTable(OrganizationModel.fields)
    .index("by_ownerId", ["ownerId"]),

  aiProviders: defineTable(AIProviderModel.fields)
    .index("by_organizationId", ["organizationId"]),

  assistants: defineTable(AssistantModel.fields)
    .index("by_organizationId", ["organizationId"])
    .index("by_aiProviderId", ["aiProviderId"]),

  files: defineTable(FileModel.fields)
    .index("by_assistantId", ["assistantId"]),

  themes: defineTable(ThemeModel.fields)
    .index("by_assistantId", ["assistantId"]),
});
