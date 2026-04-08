import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the zod schemas used for form validation
// These mirror what the zodvex models define

describe("Form validation schemas", () => {
  const usernameSchema = z
    .string()
    .min(3)
    .max(32)
    .toLowerCase()
    .trim()
    .regex(
      /^[a-zA-Z0-9]+$/,
      "Username may only contain alphanumeric characters.",
    );

  describe("username validation", () => {
    it("accepts valid usernames", () => {
      expect(usernameSchema.safeParse("alice").success).toBe(true);
      expect(usernameSchema.safeParse("bob123").success).toBe(true);
      expect(usernameSchema.safeParse("CamelCase").success).toBe(true);
    });

    it("rejects too short usernames", () => {
      expect(usernameSchema.safeParse("ab").success).toBe(false);
    });

    it("rejects too long usernames", () => {
      const long = "a".repeat(33);
      expect(usernameSchema.safeParse(long).success).toBe(false);
    });

    it("rejects usernames with special characters", () => {
      expect(usernameSchema.safeParse("user@name").success).toBe(false);
      expect(usernameSchema.safeParse("user name").success).toBe(false);
      expect(usernameSchema.safeParse("user-name").success).toBe(false);
    });

    it("lowercases the result", () => {
      const result = usernameSchema.parse("MyName");
      expect(result).toBe("myname");
    });
  });

  describe("assistant form schema", () => {
    const formSchema = z.object({
      name: z.string().min(1, { message: "Name is required" }),
      model: z.string(),
      instructions: z.string().optional(),
      description: z.string().optional(),
      mode: z.enum(["open", "restricted"]),
      isPublic: z.boolean(),
      allowedDomains: z.string().optional(),
    });

    it("accepts valid assistant data", () => {
      const result = formSchema.safeParse({
        name: "Test Assistant",
        model: "gpt-4o",
        mode: "open",
        isPublic: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = formSchema.safeParse({
        name: "",
        model: "gpt-4o",
        mode: "open",
        isPublic: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid mode", () => {
      const result = formSchema.safeParse({
        name: "Test",
        model: "gpt-4o",
        mode: "invalid",
        isPublic: false,
      });
      expect(result.success).toBe(false);
    });

    it("accepts restricted mode with response", () => {
      const result = formSchema.safeParse({
        name: "Test",
        model: "gpt-4o",
        mode: "restricted",
        isPublic: true,
        allowedDomains: "example.com, test.com",
      });
      expect(result.success).toBe(true);
    });
  });
});
