import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { vi } from "vitest";

// Custom render function that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Common test helpers
export const mockUserEvent = async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  return userEvent.setup();
};

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: "user_123",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
  ...overrides,
});

export const createMockOrganization = (overrides = {}) => ({
  id: "org_123",
  name: "Test Organization",
  slug: "test-org",
  description: "A test organization",
  ...overrides,
});

export const createMockAssistant = (overrides = {}) => ({
  id: "assistant_123",
  name: "Test Assistant",
  description: "A test assistant",
  instructions: "You are a helpful assistant",
  model: "gpt-4-turbo-preview" as const,
  mode: "open" as const,
  tools: {
    retrieval: false,
    codeInterpreter: false,
    functionCalling: false,
  },
  organizationId: "org_123",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Mock Convex hooks
export const mockConvexQuery = (returnValue: any) => ({
  data: returnValue,
  isLoading: false,
  error: null,
});

export const mockConvexMutation = (mockFn = vi.fn()) => ({
  mutate: mockFn,
  isLoading: false,
  error: null,
});