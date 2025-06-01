import { describe, expect, it, beforeEach } from "vitest";
import { ConvexTestingHelper } from "convex/testing";
import { api } from "../_generated/api";
import schema from "../schema";

const t = new ConvexTestingHelper(schema);

describe("Files Search Functions", () => {
  beforeEach(async () => {
    // Clear all data before each test
    await t.mutation(async ({ db }) => {
      const users = await db.query("users").collect();
      const orgs = await db.query("organizations").collect();
      const assistants = await db.query("assistants").collect();
      const files = await db.query("files").collect();
      
      for (const user of users) await db.delete(user._id);
      for (const org of orgs) await db.delete(org._id);
      for (const assistant of assistants) await db.delete(assistant._id);
      for (const file of files) await db.delete(file._id);
    });
  });

  describe("searchFiles", () => {
    it("should find files by name", async () => {
      // Setup: Create user, organization, assistant, and files
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      const assistantId = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "test-assistant",
          name: "Test Assistant",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      // Create test files
      const file1Id = await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistantId,
          externalId: "file1",
          name: "healthcare-policies.pdf",
          purpose: "assistants",
          size: 1024000,
          type: "application/pdf",
          status: "ready",
          lastUpdated: Date.now(),
        });
      });

      const file2Id = await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistantId,
          externalId: "file2",
          name: "medication-guidelines.docx",
          purpose: "assistants",
          size: 512000,
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          status: "ready",
          lastUpdated: Date.now(),
        });
      });

      // Test: Search for files
      const results = await t.query(api.files.search.searchFiles, {
        organizationId: orgId,
        query: "healthcare",
        limit: 10,
      });

      // Verify results
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("healthcare-policies.pdf");
      expect(results[0].type).toBe("application/pdf");
      expect(results[0].assistantId).toBe(assistantId);
    });

    it("should find files by type", async () => {
      // Setup similar to above but search by type
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      const assistantId = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "test-assistant",
          name: "Test Assistant",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistantId,
          externalId: "file1",
          name: "document.pdf",
          purpose: "assistants",
          size: 1024000,
          type: "application/pdf",
          status: "ready",
          lastUpdated: Date.now(),
        });
      });

      // Test: Search by file type
      const results = await t.query(api.files.search.searchFiles, {
        organizationId: orgId,
        query: "pdf",
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe("document.pdf");
    });

    it("should respect search limit", async () => {
      // Setup with multiple files
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      const assistantId = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "test-assistant",
          name: "Test Assistant",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      // Create multiple files that match
      for (let i = 1; i <= 5; i++) {
        await t.mutation(async ({ db }) => {
          return await db.insert("files", {
            assistantId: assistantId,
            externalId: `file${i}`,
            name: `test-document-${i}.pdf`,
            purpose: "assistants",
            size: 1024000,
            type: "application/pdf",
            status: "ready",
            lastUpdated: Date.now(),
          });
        });
      }

      // Test: Search with limit
      const results = await t.query(api.files.search.searchFiles, {
        organizationId: orgId,
        query: "test",
        limit: 3,
      });

      expect(results.length).toBe(3);
    });

    it("should only return files with ready status", async () => {
      // Setup
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      const assistantId = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "test-assistant",
          name: "Test Assistant",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      // Create files with different statuses
      await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistantId,
          externalId: "file1",
          name: "ready-file.pdf",
          purpose: "assistants",
          size: 1024000,
          type: "application/pdf",
          status: "ready",
          lastUpdated: Date.now(),
        });
      });

      await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistantId,
          externalId: "file2",
          name: "processing-file.pdf",
          purpose: "assistants",
          size: 1024000,
          type: "application/pdf",
          status: "processing",
          lastUpdated: Date.now(),
        });
      });

      // Test: Should only return ready files
      const results = await t.query(api.files.search.searchFiles, {
        organizationId: orgId,
        query: "file",
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe("ready-file.pdf");
    });

    it("should return empty array when no files match", async () => {
      // Setup with organization but no matching files
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      // Test: Search in empty organization
      const results = await t.query(api.files.search.searchFiles, {
        organizationId: orgId,
        query: "nonexistent",
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });

    it("should search across multiple assistants in the same organization", async () => {
      // Setup
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      // Create two assistants
      const assistant1Id = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "assistant1",
          name: "Assistant 1",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      const assistant2Id = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "assistant2",
          name: "Assistant 2",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      // Add files to both assistants
      await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistant1Id,
          externalId: "file1",
          name: "policy-document.pdf",
          purpose: "assistants",
          size: 1024000,
          type: "application/pdf",
          status: "ready",
          lastUpdated: Date.now(),
        });
      });

      await t.mutation(async ({ db }) => {
        return await db.insert("files", {
          assistantId: assistant2Id,
          externalId: "file2",
          name: "policy-handbook.docx",
          purpose: "assistants",
          size: 512000,
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          status: "ready",
          lastUpdated: Date.now(),
        });
      });

      // Test: Search should find files from both assistants
      const results = await t.query(api.files.search.searchFiles, {
        organizationId: orgId,
        query: "policy",
        limit: 10,
      });

      expect(results.length).toBe(2);
      const fileNames = results.map(r => r.name).sort();
      expect(fileNames).toEqual(["policy-document.pdf", "policy-handbook.docx"]);
    });
  });

  describe("getOrganizationIdForAssistant", () => {
    it("should return organization ID for valid assistant", async () => {
      // Setup
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      const assistantId = await t.mutation(async ({ db }) => {
        return await db.insert("assistants", {
          organizationId: orgId,
          externalId: "test-assistant",
          name: "Test Assistant",
          model: "gpt-4-turbo-preview",
          mode: "open",
          fileIds: [],
          tools: ["retrieval"],
          status: "ready",
        });
      });

      // Test
      const result = await t.query(api.files.search.getOrganizationIdForAssistant, {
        assistantId: assistantId,
      });

      expect(result).toBe(orgId);
    });

    it("should return null for non-existent assistant", async () => {
      // Test with invalid assistant ID
      const result = await t.query(api.files.search.getOrganizationIdForAssistant, {
        assistantId: "invalid-id" as any,
      });

      expect(result).toBeNull();
    });
  });
});