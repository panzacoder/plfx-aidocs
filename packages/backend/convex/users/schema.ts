import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

export const users = {
  name: z.string().optional(),
  image: z.string().optional(),
  email: z.string().optional(),
  emailVerificationTime: z.number().optional(),
  phone: z.string().optional(),
  phoneVerificationTime: z.number().optional(),
  isAnonymous: z.boolean().optional(),

  username: z.string().optional(),
  imageId: zid("_storage").optional(),
  polarId: z.string().optional(),
  polarSubscriptionPendingId: zid("_scheduled_functions").optional(),
};
export const zUsers = z.object(users);

export const Users = Table("users", zodToConvexFields(users));
export type UserDoc = Doc<"users">;
