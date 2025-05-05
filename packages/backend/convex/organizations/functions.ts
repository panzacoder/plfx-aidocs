import { mutation, query } from "@/_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get a specific organization by ID
export const get = query({
  args: {
    id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get organization for the current user
export const getUserOrganization = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user?.organizationId) return null;
    
    return await ctx.db.get(user.organizationId);
  },
});

// Create a new organization
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Create the organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      ownerId: userId,
      members: [userId],
      subscriptionStatus: "none",
    });
    
    // Update the user to associate with this organization
    await ctx.db.patch(userId, {
      organizationId,
      role: "owner",
    });
    
    return organizationId;
  },
});

// Update an organization
export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Verify user has permission
    const org = await ctx.db.get(args.id);
    if (!org) {
      throw new Error("Organization not found");
    }
    
    if (org.ownerId !== userId) {
      throw new Error("Not authorized to update this organization");
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    
    return id;
  },
});

// Add a member to organization
export const addMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    
    // Verify user has permission
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    
    if (org.ownerId !== currentUserId) {
      throw new Error("Not authorized to add members");
    }
    
    // Add to members array
    const updatedMembers = [...org.members, args.userId];
    await ctx.db.patch(args.organizationId, {
      members: updatedMembers,
    });
    
    // Update the user
    await ctx.db.patch(args.userId, {
      organizationId: args.organizationId,
      role: args.role,
    });
    
    return args.organizationId;
  },
});

// Remove a member from organization
export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    
    // Verify user has permission
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    
    if (org.ownerId !== currentUserId) {
      throw new Error("Not authorized to remove members");
    }
    
    // Owner cannot be removed
    if (org.ownerId === args.userId) {
      throw new Error("Cannot remove the owner");
    }
    
    // Remove from members array
    const updatedMembers = org.members.filter(id => id !== args.userId);
    await ctx.db.patch(args.organizationId, {
      members: updatedMembers,
    });
    
    // Update the user
    await ctx.db.patch(args.userId, {
      organizationId: undefined,
      role: undefined,
    });
    
    return args.organizationId;
  },
}); 