import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Search files within an organization by query
 * This function searches both file metadata and content
 */
export const searchFiles = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all assistants for this organization
    const assistants = await ctx.db
      .query("assistants")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (assistants.length === 0) {
      return [];
    }

    // Get all files for these assistants
    const allFiles = [];
    for (const assistant of assistants) {
      const files = await ctx.db
        .query("files")
        .withIndex("assistantId", (q) => q.eq("assistantId", assistant._id))
        .filter((q) => q.eq(q.field("status"), "ready"))
        .collect();
      
      // Add assistant info to each file for context
      allFiles.push(...files.map(file => ({
        ...file,
        assistantName: assistant.name,
        assistantId: assistant._id,
      })));
    }

    if (allFiles.length === 0) {
      return [];
    }

    // Simple text-based search for now
    // This searches file names and metadata
    const queryLower = args.query.toLowerCase();
    const matchingFiles = allFiles.filter(file => {
      const nameMatch = file.name.toLowerCase().includes(queryLower);
      const typeMatch = file.type.toLowerCase().includes(queryLower);
      
      // Search in metadata if available
      let metadataMatch = false;
      if (file.metadata) {
        metadataMatch = Object.values(file.metadata).some(value => 
          value.toLowerCase().includes(queryLower)
        );
      }
      
      return nameMatch || typeMatch || metadataMatch;
    });

    // Sort by relevance (name matches first, then other matches)
    matchingFiles.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(queryLower);
      const bNameMatch = b.name.toLowerCase().includes(queryLower);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // If both or neither match on name, sort by creation time (newest first)
      return b._creationTime - a._creationTime;
    });

    // Return limited results with relevant information
    return matchingFiles.slice(0, limit).map(file => ({
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      assistantName: file.assistantName,
      assistantId: file.assistantId,
      createdAt: file._creationTime,
      externalId: file.externalId,
    }));
  },
});

/**
 * Get organization ID for an assistant (helper function)
 */
export const getOrganizationIdForAssistant = internalQuery({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const assistant = await ctx.db.get(args.assistantId);
    return assistant?.organizationId || null;
  },
});

/**
 * Search files by content (placeholder for future content indexing)
 * This would be used when we implement full-text search on file contents
 */
export const searchFileContent = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Implement full-text search when file content indexing is available
    // For now, return empty results since we don't have content indexing yet
    
    // Future implementation could:
    // 1. Index file contents when uploaded
    // 2. Store text content in a searchable format
    // 3. Use vector embeddings for semantic search
    // 4. Combine with metadata search
    
    return [];
  },
});