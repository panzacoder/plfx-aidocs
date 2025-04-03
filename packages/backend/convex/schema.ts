import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { AIProviders } from "./validators/aiProviders";
import { Assistants } from "./validators/assistants";
import { Organizations } from "./validators/organizations";
import { Plans } from "./validators/plans";
import { Subscriptions } from "./validators/subscriptions";

export default defineSchema({
  ...authTables,
  users: defineTable({
    // Convex Auth fields
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // custom fields
    username: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    polarId: v.optional(v.string()),
    polarSubscriptionPendingId: v.optional(v.id("_scheduled_functions")),
  })
    .index("email", ["email"])
    .index("polarId", ["polarId"]),
  plans: Plans.table
    .index("key", ["key"])
    .index("polarProductId", ["polarProductId"]),
  subscriptions: Subscriptions.table
    .index("userId", ["userId"])
    .index("polarId", ["polarId"]),
  organizations: Organizations.table.index("by_ownerId", ["ownerId"]),
  aiProviders: AIProviders.table.index("by_organizationId", ["organizationId"]),
  assistants: Assistants.table.index("by_aiProviderId", ["aiProviderId"]),
});
