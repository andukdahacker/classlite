import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./src/test-setup.ts"],
    testTimeout: 10000,
  },
});
