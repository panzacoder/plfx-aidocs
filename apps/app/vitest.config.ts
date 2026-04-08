/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@v1/backend": path.resolve(__dirname, "../../packages/backend"),
      "@v1/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});
