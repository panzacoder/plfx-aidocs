import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { AIProviders } from "./aiProviders/schema";
import { Assistants } from "./assistants/schema";
import { Organizations } from "./organizations/schema";
import { Users } from "./users/schema";
import { Files } from "./files/schema";

export default defineSchema({
  ...authTables,
  
  users: Users.table
    .index("email", ["email"])
    .index("organizationId", ["organizationId"]),
  
  organizations: Organizations.table
    .index("ownerId", ["ownerId"])
    .index("polarCustomerId", ["polarCustomerId"])
    .index("polarSubscriptionId", ["polarSubscriptionId"]),
  
  aiProviders: AIProviders.table
    .index("organizationId", ["organizationId"]),
  
  assistants: Assistants.table
    .index("aiProviderId", ["aiProviderId"])
    .index("organizationId", ["organizationId"]),
  
  files: Files.table
    .index("assistantId", ["assistantId"]),
  
  // Note: plans and subscriptions tables are removed
});
