/**
 * Convex schema definition.
 *
 * Uses zodvex models as the source of truth for table shapes and indexes,
 * composed with authTables from @convex-dev/auth.
 *
 * We use zodToConvexFields to convert zodvex model fields to Convex validators,
 * replicating what defineZodSchema's internal tableFromModel() does, so we can
 * spread authTables alongside our custom tables.
 */
import { authTables } from "@convex-dev/auth/server";
import { zodToConvexFields } from "convex-helpers/server/zod";
import { defineSchema, defineTable } from "convex/server";
import {
  UserModel,
  OrganizationModel,
  AIProviderModel,
  AssistantModel,
  FileModel,
  ThemeModel,
} from "./models";

/** Convert a zodvex model (with indexes) to a Convex TableDefinition. */
function modelToTable(model: any) {
  let table = defineTable(zodToConvexFields(model.fields));
  for (const [name, fields] of Object.entries(model.indexes)) {
    const userFields = (fields as string[]).filter(
      (f) => f !== "_creationTime",
    );
    table = table.index(name, userFields as any);
  }
  return table;
}

export default defineSchema({
  ...authTables,
  users: modelToTable(UserModel),
  organizations: modelToTable(OrganizationModel),
  aiProviders: modelToTable(AIProviderModel),
  assistants: modelToTable(AssistantModel),
  files: modelToTable(FileModel),
  themes: modelToTable(ThemeModel),
});
