import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

export const files = {
  assistantId: zid("assistants"),
  externalId: z.string(), // OpenAI File ID
  name: z.string(),
  purpose: z.enum(["assistants"]), // OpenAI file purpose
  size: z.number(),
  type: z.string(), // MIME type
  status: z.enum(["uploading", "processing", "ready", "failed"]),
  metadata: z.record(z.string(), z.string()).optional(),
  lastUpdated: z.number(),
};
export const zFiles = z.object(files);

export const Files = Table("files", zodToConvexFields(files));
export type FilesDoc = Doc<"files">;
