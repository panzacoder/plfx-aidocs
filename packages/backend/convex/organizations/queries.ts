import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const getFirstOrganization = query({
  args: {},
  returns: v.union(v.id("organizations"), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject as Id<"users">;
    
    // First check if user is the owner of any organization
    const ownedOrg = await ctx.db
      .query("organizations")
      .withIndex("ownerId", (q) => q.eq("ownerId", userId ))
      .first();
    
    if (ownedOrg) {
      return ownedOrg._id;
    }
    
    // Then check if user is a member of any organization
    const orgs = await ctx.db.query("organizations").collect();
    for (const org of orgs) {
      if (org.members.includes(userId)) {
        return org._id;
      }
    }
    
    return null;
  },
}); 