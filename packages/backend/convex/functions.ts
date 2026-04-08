/**
 * Zodvex function builders for type-safe Convex functions.
 *
 * Use these instead of raw query/mutation/action from _generated/server.
 * They provide automatic Zod validation and codec-aware DB access.
 */
import { initZodvex } from "zodvex/server";
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import schema from "./schema";

export const { zq, zm, za, ziq, zim, zia } = initZodvex(schema, {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
});
