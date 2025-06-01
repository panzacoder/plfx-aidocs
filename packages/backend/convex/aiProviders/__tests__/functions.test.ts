import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConvexTestingHelper } from "convex/testing";
import { api } from "../_generated/api";
import schema from "../schema";

const t = new ConvexTestingHelper(schema);

describe("AI Providers Functions - Organization Validation", () => {
  beforeEach(async () => {
    // Clear all data before each test
    await t.mutation(async ({ db }) => {
      const users = await db.query("users").collect();
      const orgs = await db.query("organizations").collect();
      const providers = await db.query("aiProviders").collect();
      
      for (const user of users) await db.delete(user._id);
      for (const org of orgs) await db.delete(org._id);
      for (const provider of providers) await db.delete(provider._id);
    });
  });

  describe("createAIProvider", () => {
    it("should create AI provider when user is organization owner", async () => {
      // Setup: Create user and organization
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner User",
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

      // Mock authentication
      const mockAuth = vi.fn().mockResolvedValue(userId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test: Create AI provider
      const result = await t.mutation(api.aiProviders.functions.createAIProvider, {
        organizationId: orgId,
        apiKey: "test-api-key",
      });

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(orgId);
      expect(result.apiKey).toBe("test-api-key");
      expect(result.type).toBe("OpenAI");
    });

    it("should create AI provider when user is organization member", async () => {
      // Setup: Create users and organization
      const ownerId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner User",
        });
      });

      const memberId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "member@test.com",
          name: "Member User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: ownerId,
          members: [memberId],
        });
      });

      // Mock authentication as member
      const mockAuth = vi.fn().mockResolvedValue(memberId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test: Create AI provider as member
      const result = await t.mutation(api.aiProviders.functions.createAIProvider, {
        organizationId: orgId,
        apiKey: "test-api-key",
      });

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(orgId);
    });

    it("should reject AI provider creation when user is not authenticated", async () => {
      // Mock no authentication
      const mockAuth = vi.fn().mockResolvedValue(null);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      const orgId = await t.mutation(async ({ db }) => {
        const userId = await db.insert("users", { email: "test@test.com", name: "Test" });
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: userId,
          members: [],
        });
      });

      // Test: Should throw error
      await expect(
        t.mutation(api.aiProviders.functions.createAIProvider, {
          organizationId: orgId,
          apiKey: "test-api-key",
        })
      ).rejects.toThrow("Not authenticated");
    });

    it("should reject AI provider creation when user has no access to organization", async () => {
      // Setup: Create users and organization
      const ownerId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner User",
        });
      });

      const unauthorizedUserId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "unauthorized@test.com",
          name: "Unauthorized User",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: ownerId,
          members: [], // unauthorized user is not a member
        });
      });

      // Mock authentication as unauthorized user
      const mockAuth = vi.fn().mockResolvedValue(unauthorizedUserId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test: Should throw access denied error
      await expect(
        t.mutation(api.aiProviders.functions.createAIProvider, {
          organizationId: orgId,
          apiKey: "test-api-key",
        })
      ).rejects.toThrow("Access denied to this organization");
    });

    it("should reject AI provider creation when organization does not exist", async () => {
      const userId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "user@test.com",
          name: "Test User",
        });
      });

      // Mock authentication
      const mockAuth = vi.fn().mockResolvedValue(userId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test: Should throw organization not found error
      await expect(
        t.mutation(api.aiProviders.functions.createAIProvider, {
          organizationId: "invalid-org-id" as any,
          apiKey: "test-api-key",
        })
      ).rejects.toThrow("Organization not found");
    });
  });

  describe("listAIProviders", () => {
    it("should list AI providers when user has access to organization", async () => {
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

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "test-key",
        });
      });

      // Mock authentication
      const mockAuth = vi.fn().mockResolvedValue(userId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      const result = await t.query(api.aiProviders.functions.listAIProviders, {
        organizationId: orgId,
      });

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe(providerId);
    });

    it("should reject listing when user has no access to organization", async () => {
      // Setup
      const ownerId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner",
        });
      });

      const unauthorizedUserId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "unauthorized@test.com",
          name: "Unauthorized",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: ownerId,
          members: [],
        });
      });

      // Mock authentication as unauthorized user
      const mockAuth = vi.fn().mockResolvedValue(unauthorizedUserId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      await expect(
        t.query(api.aiProviders.functions.listAIProviders, {
          organizationId: orgId,
        })
      ).rejects.toThrow("Access denied to this organization");
    });
  });

  describe("getAIProvider", () => {
    it("should get AI provider when user has access", async () => {
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

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "test-key",
        });
      });

      // Mock authentication
      const mockAuth = vi.fn().mockResolvedValue(userId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      const result = await t.query(api.aiProviders.functions.getAIProvider, {
        providerId: providerId,
      });

      expect(result).toBeDefined();
      expect(result!._id).toBe(providerId);
    });

    it("should reject getting AI provider when user has no access", async () => {
      // Setup
      const ownerId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner",
        });
      });

      const unauthorizedUserId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "unauthorized@test.com",
          name: "Unauthorized",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: ownerId,
          members: [],
        });
      });

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "test-key",
        });
      });

      // Mock authentication as unauthorized user
      const mockAuth = vi.fn().mockResolvedValue(unauthorizedUserId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      await expect(
        t.query(api.aiProviders.functions.getAIProvider, {
          providerId: providerId,
        })
      ).rejects.toThrow("Access denied to this organization");
    });
  });

  describe("updateAIProvider", () => {
    it("should update AI provider when user has access", async () => {
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

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "old-key",
        });
      });

      // Mock authentication
      const mockAuth = vi.fn().mockResolvedValue(userId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      const result = await t.mutation(api.aiProviders.functions.updateAIProvider, {
        providerId: providerId,
        apiKey: "new-key",
      });

      expect(result.apiKey).toBe("new-key");
    });

    it("should reject update when user has no access", async () => {
      // Setup similar to get test
      const ownerId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner",
        });
      });

      const unauthorizedUserId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "unauthorized@test.com",
          name: "Unauthorized",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: ownerId,
          members: [],
        });
      });

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "test-key",
        });
      });

      // Mock authentication as unauthorized user
      const mockAuth = vi.fn().mockResolvedValue(unauthorizedUserId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      await expect(
        t.mutation(api.aiProviders.functions.updateAIProvider, {
          providerId: providerId,
          apiKey: "new-key",
        })
      ).rejects.toThrow("Access denied to this organization");
    });
  });

  describe("deleteAIProvider", () => {
    it("should delete AI provider when user has access and no assistants use it", async () => {
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

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "test-key",
        });
      });

      // Mock authentication
      const mockAuth = vi.fn().mockResolvedValue(userId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      await t.mutation(api.aiProviders.functions.deleteAIProvider, {
        providerId: providerId,
      });

      // Verify deletion
      const provider = await t.query(async ({ db }) => {
        return await db.get(providerId);
      });
      expect(provider).toBeNull();
    });

    it("should reject deletion when user has no access", async () => {
      // Setup similar to other tests
      const ownerId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "owner@test.com",
          name: "Owner",
        });
      });

      const unauthorizedUserId = await t.mutation(async ({ db }) => {
        return await db.insert("users", {
          email: "unauthorized@test.com",
          name: "Unauthorized",
        });
      });

      const orgId = await t.mutation(async ({ db }) => {
        return await db.insert("organizations", {
          name: "Test Org",
          slug: "test-org",
          ownerId: ownerId,
          members: [],
        });
      });

      const providerId = await t.mutation(async ({ db }) => {
        return await db.insert("aiProviders", {
          organizationId: orgId,
          type: "OpenAI",
          apiKey: "test-key",
        });
      });

      // Mock authentication as unauthorized user
      const mockAuth = vi.fn().mockResolvedValue(unauthorizedUserId);
      vi.mock("@convex-dev/auth/server", () => ({
        getAuthUserId: mockAuth,
      }));

      // Test
      await expect(
        t.mutation(api.aiProviders.functions.deleteAIProvider, {
          providerId: providerId,
        })
      ).rejects.toThrow("Access denied to this organization");
    });
  });
});