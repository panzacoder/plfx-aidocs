import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFirstOrganization = query({
  args: {},
  returns: v.union(v.id("organizations"), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    // First, get the user and check their organizationId field
    const user = await ctx.db.get(userId);
    if (user?.organizationId) {
      // Verify the organization still exists
      const org = await ctx.db.get(user.organizationId);
      if (org) {
        return org._id;
      }
    }
    
    // Fallback: Check if user is the owner of any organization
    const ownedOrg = await ctx.db
      .query("organizations")
      .withIndex("ownerId", (q) => q.eq("ownerId", userId))
      .first();
    
    if (ownedOrg) {
      return ownedOrg._id;
    }
    
    // Final fallback: Check if user is a member of any organization
    const orgs = await ctx.db.query("organizations").collect();
    for (const org of orgs) {
      if (org.members.includes(userId)) {
        return org._id;
      }
    }
    
    return null;
  },
}); 