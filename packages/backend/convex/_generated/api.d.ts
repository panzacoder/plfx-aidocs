/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiProviders from "../aiProviders.js";
import type * as assistants from "../assistants.js";
import type * as auth from "../auth.js";
import type * as email_index from "../email/index.js";
import type * as email_templates_subscriptionEmail from "../email/templates/subscriptionEmail.js";
import type * as env from "../env.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as schemas_aiProviders from "../schemas/aiProviders.js";
import type * as schemas_assistants from "../schemas/assistants.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as utils_validators from "../utils/validators.js";
import type * as validators_aiProviders from "../validators/aiProviders.js";
import type * as validators_assistants from "../validators/assistants.js";
import type * as validators_constants from "../validators/constants.js";
import type * as validators_organizations from "../validators/organizations.js";
import type * as validators_plans from "../validators/plans.js";
import type * as validators_subscriptions from "../validators/subscriptions.js";
import type * as web from "../web.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiProviders: typeof aiProviders;
  assistants: typeof assistants;
  auth: typeof auth;
  "email/index": typeof email_index;
  "email/templates/subscriptionEmail": typeof email_templates_subscriptionEmail;
  env: typeof env;
  http: typeof http;
  init: typeof init;
  "schemas/aiProviders": typeof schemas_aiProviders;
  "schemas/assistants": typeof schemas_assistants;
  subscriptions: typeof subscriptions;
  users: typeof users;
  "utils/validators": typeof utils_validators;
  "validators/aiProviders": typeof validators_aiProviders;
  "validators/assistants": typeof validators_assistants;
  "validators/constants": typeof validators_constants;
  "validators/organizations": typeof validators_organizations;
  "validators/plans": typeof validators_plans;
  "validators/subscriptions": typeof validators_subscriptions;
  web: typeof web;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
