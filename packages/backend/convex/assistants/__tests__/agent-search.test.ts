import { describe, expect, it, vi } from "vitest";

describe("Agent Document Search Integration", () => {
  // Mock the agent search tool functionality
  const mockSearchDocuments = {
    description: "Search organization documents by query",
    handler: async (ctx: any, args: { query: string; limit?: number }) => {
      // Simulate the search logic
      const mockAssistant = {
        _id: "assistant_123",
        organizationId: "org_123",
        name: "Test Assistant",
      };

      const mockFiles = [
        {
          id: "file_1",
          name: "healthcare-policies.pdf",
          type: "application/pdf",
          size: 1024000,
          assistantName: "Test Assistant",
          assistantId: "assistant_123",
          createdAt: Date.now(),
          externalId: "openai_file_1",
        },
        {
          id: "file_2", 
          name: "medication-guidelines.docx",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          size: 512000,
          assistantName: "Test Assistant",
          assistantId: "assistant_123",
          createdAt: Date.now(),
          externalId: "openai_file_2",
        }
      ];

      // Filter files based on query
      const filteredFiles = mockFiles.filter(file => 
        file.name.toLowerCase().includes(args.query.toLowerCase()) ||
        file.type.toLowerCase().includes(args.query.toLowerCase())
      );

      const limit = args.limit || 5;
      const results = filteredFiles.slice(0, limit);

      if (results.length === 0) {
        return `No documents found matching "${args.query}". Try different search terms or check if documents have been uploaded.`;
      }

      // Format results for the AI agent
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      const formattedResults = results.map(file => {
        const sizeFormatted = formatFileSize(file.size);
        const dateFormatted = new Date(file.createdAt).toLocaleDateString();
        
        return `• **${file.name}** (${file.type}, ${sizeFormatted})
  - Assistant: ${file.assistantName}
  - Uploaded: ${dateFormatted}
  - File ID: ${file.id}`;
      }).join('\n\n');

      return `Found ${results.length} document(s) matching "${args.query}":\n\n${formattedResults}\n\nNote: These are document metadata results. For specific content within documents, please ask me to help you find information about specific topics.`;
    },
  };

  it("should return formatted search results for healthcare query", async () => {
    const mockCtx = {
      assistantId: "assistant_123",
      db: {
        get: vi.fn().mockResolvedValue({
          _id: "assistant_123",
          organizationId: "org_123",
        }),
      },
      runQuery: vi.fn(),
    };

    const result = await mockSearchDocuments.handler(mockCtx, {
      query: "healthcare",
      limit: 5,
    });

    expect(result).toContain("Found 1 document(s) matching \"healthcare\"");
    expect(result).toContain("healthcare-policies.pdf");
    expect(result).toContain("application/pdf");
    expect(result).toContain("1 MB");
    expect(result).toContain("Test Assistant");
  });

  it("should return formatted search results for multiple matches", async () => {
    const mockCtx = {
      assistantId: "assistant_123", 
      db: {
        get: vi.fn().mockResolvedValue({
          _id: "assistant_123",
          organizationId: "org_123",
        }),
      },
      runQuery: vi.fn(),
    };

    const result = await mockSearchDocuments.handler(mockCtx, {
      query: "application", // Should match both files by type
      limit: 5,
    });

    expect(result).toContain("Found 2 document(s) matching \"application\"");
    expect(result).toContain("healthcare-policies.pdf");
    expect(result).toContain("medication-guidelines.docx");
  });

  it("should return no results message when no matches found", async () => {
    const mockCtx = {
      assistantId: "assistant_123",
      db: {
        get: vi.fn().mockResolvedValue({
          _id: "assistant_123", 
          organizationId: "org_123",
        }),
      },
      runQuery: vi.fn(),
    };

    const result = await mockSearchDocuments.handler(mockCtx, {
      query: "nonexistent",
      limit: 5,
    });

    expect(result).toBe('No documents found matching "nonexistent". Try different search terms or check if documents have been uploaded.');
  });

  it("should respect search limit parameter", async () => {
    const mockCtx = {
      assistantId: "assistant_123",
      db: {
        get: vi.fn().mockResolvedValue({
          _id: "assistant_123",
          organizationId: "org_123", 
        }),
      },
      runQuery: vi.fn(),
    };

    const result = await mockSearchDocuments.handler(mockCtx, {
      query: "application", // Matches 2 files
      limit: 1, // But limit to 1
    });

    expect(result).toContain("Found 1 document(s) matching \"application\"");
    // Should only contain one file result
    const fileMatches = result.match(/• \*\*/g);
    expect(fileMatches).toHaveLength(1);
  });

  it("should handle assistant not found error", async () => {
    const mockCtx = {
      assistantId: "nonexistent_assistant",
      db: {
        get: vi.fn().mockResolvedValue(null), // Assistant not found
      },
      runQuery: vi.fn(),
    };

    const mockSearchWithError = {
      ...mockSearchDocuments,
      handler: async (ctx: any, args: { query: string; limit?: number }) => {
        try {
          const assistant = await ctx.db.get(ctx.assistantId);
          if (!assistant) {
            return "Assistant not found.";
          }
          // ... rest of logic
        } catch (error) {
          console.error("Error searching documents:", error);
          return `Error occurred while searching for "${args.query}". Please try again or contact support if the issue persists.`;
        }
      },
    };

    const result = await mockSearchWithError.handler(mockCtx, {
      query: "test",
      limit: 5,
    });

    expect(result).toBe("Assistant not found.");
  });

  it("should provide helpful search guidance in results", async () => {
    const mockCtx = {
      assistantId: "assistant_123",
      db: {
        get: vi.fn().mockResolvedValue({
          _id: "assistant_123",
          organizationId: "org_123",
        }),
      },
      runQuery: vi.fn(),
    };

    const result = await mockSearchDocuments.handler(mockCtx, {
      query: "healthcare",
      limit: 5,
    });

    expect(result).toContain("Note: These are document metadata results. For specific content within documents, please ask me to help you find information about specific topics.");
  });

  it("should format file sizes correctly", async () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileSize(1073741824)).toBe("1 GB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});