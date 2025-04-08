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
import type * as aiProviders_functions from "../aiProviders/functions.js";
import type * as aiProviders_validators from "../aiProviders/validators.js";
import type * as assistants_functions from "../assistants/functions.js";
import type * as assistants_validators from "../assistants/validators.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as email_index from "../email/index.js";
import type * as email_templates_subscriptionEmail from "../email/templates/subscriptionEmail.js";
import type * as env from "../env.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as schemas_aiProviders from "../schemas/aiProviders.js";
import type * as schemas_assistants from "../schemas/assistants.js";
import type * as subscriptions_functions from "../subscriptions/functions.js";
import type * as users_functions from "../users/functions.js";
import type * as utils_validators from "../utils/validators.js";
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
  "aiProviders/functions": typeof aiProviders_functions;
  "aiProviders/validators": typeof aiProviders_validators;
  "assistants/functions": typeof assistants_functions;
  "assistants/validators": typeof assistants_validators;
  auth: typeof auth;
  constants: typeof constants;
  "email/index": typeof email_index;
  "email/templates/subscriptionEmail": typeof email_templates_subscriptionEmail;
  env: typeof env;
  http: typeof http;
  init: typeof init;
  "schemas/aiProviders": typeof schemas_aiProviders;
  "schemas/assistants": typeof schemas_assistants;
  "subscriptions/functions": typeof subscriptions_functions;
  "users/functions": typeof users_functions;
  "utils/validators": typeof utils_validators;
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
