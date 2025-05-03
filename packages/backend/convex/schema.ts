import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { AIProviders } from "./aiProviders/schema";
import { Assistants } from "./assistants/schema";
import { Organizations } from "./organizations/schema";
import { Plans } from "./plans/schema";
import { Subscriptions } from "./subscriptions/schema";
import { Users } from "./users/schema";
import { Files } from "./files/schema";
export default defineSchema({
  ...authTables,
  users: Users.table.index("email", ["email"]).index("polarId", ["polarId"]),
  plans: Plans.table
    .index("key", ["key"])
    .index("polarProductId", ["polarProductId"]),
  subscriptions: Subscriptions.table
    .index("userId", ["userId"])
    .index("polarId", ["polarId"]),
  organizations: Organizations.table.index("by_ownerId", ["ownerId"]),
  aiProviders: AIProviders.table.index("by_organizationId", ["organizationId"]),
  assistants: Assistants.table
    .index("by_aiProviderId", ["aiProviderId"])
    .index("by_organizationId", ["organizationId"]),
  files: Files.table.index("by_assistantId", ["assistantId"]),
});
