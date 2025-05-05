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
import type * as assistants_actions from "../assistants/actions.js";
import type * as assistants_functions from "../assistants/functions.js";
import type * as assistants_internal from "../assistants/internal.js";
import type * as assistants_validators from "../assistants/validators.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as email_index from "../email/index.js";
import type * as email_templates_subscriptionEmail from "../email/templates/subscriptionEmail.js";
import type * as env from "../env.js";
import type * as files_actions from "../files/actions.js";
import type * as files_functions from "../files/functions.js";
import type * as files_internal from "../files/internal.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as migrations from "../migrations.js";
import type * as openai_client from "../openai/client.js";
import type * as openai_files from "../openai/files.js";
import type * as organizations_functions from "../organizations/functions.js";
import type * as organizations_internal from "../organizations/internal.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as organizations_subscription from "../organizations/subscription.js";
import type * as organizations from "../organizations.js";
import type * as schemas_aiProviders from "../schemas/aiProviders.js";
import type * as schemas_assistants from "../schemas/assistants.js";
import type * as users_auth from "../users/auth.js";
import type * as users_functions from "../users/functions.js";
import type * as users_onboarding from "../users/onboarding.js";
import type * as users from "../users.js";
import type * as utils_validators from "../utils/validators.js";
import type * as web from "../web.js";
import type * as webhooks from "../webhooks.js";

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
  "assistants/actions": typeof assistants_actions;
  "assistants/functions": typeof assistants_functions;
  "assistants/internal": typeof assistants_internal;
  "assistants/validators": typeof assistants_validators;
  auth: typeof auth;
  constants: typeof constants;
  "email/index": typeof email_index;
  "email/templates/subscriptionEmail": typeof email_templates_subscriptionEmail;
  env: typeof env;
  "files/actions": typeof files_actions;
  "files/functions": typeof files_functions;
  "files/internal": typeof files_internal;
  http: typeof http;
  init: typeof init;
  migrations: typeof migrations;
  "openai/client": typeof openai_client;
  "openai/files": typeof openai_files;
  "organizations/functions": typeof organizations_functions;
  "organizations/internal": typeof organizations_internal;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  "organizations/subscription": typeof organizations_subscription;
  organizations: typeof organizations;
  "schemas/aiProviders": typeof schemas_aiProviders;
  "schemas/assistants": typeof schemas_assistants;
  "users/auth": typeof users_auth;
  "users/functions": typeof users_functions;
  "users/onboarding": typeof users_onboarding;
  users: typeof users;
  "utils/validators": typeof utils_validators;
  web: typeof web;
  webhooks: typeof webhooks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
