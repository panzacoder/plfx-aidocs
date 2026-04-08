import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFirstOrganization = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Check user's organizationId first (fastest path)
    const user = await ctx.db.get(userId);
    if (user?.organizationId) {
      return await ctx.db.get(user.organizationId);
    }

    // Fallback: check if user owns any org
    const ownedOrg = await ctx.db
      .query("organizations")
      .withIndex("ownerId", (q) => q.eq("ownerId", userId))
      .first();

    return ownedOrg ?? null;
  },
});
