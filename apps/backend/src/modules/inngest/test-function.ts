import { inngest } from "./client.js";

/**
 * Simple test function to verify Inngest is set up correctly.
 * This can be removed once real functions are added.
 *
 * To test locally:
 * 1. Run: npx inngest-cli@latest dev
 * 2. Open http://localhost:8288
 * 3. Trigger the "test/hello" event
 */
export const testHelloFunction = inngest.createFunction(
  { id: "test-hello" },
  { event: "test/hello" },
  async ({ event, step }) => {
    const greeting = await step.run("create-greeting", async () => {
      return `Hello, ${event.data.name || "World"}!`;
    });

    return { greeting };
  }
);
