import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Load environment variables before tests
    setupFiles: ["./src/test/setup.ts"],
    // Increase timeout for database operations
    testTimeout: 10000,
    // Run integration tests sequentially to avoid race conditions
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
