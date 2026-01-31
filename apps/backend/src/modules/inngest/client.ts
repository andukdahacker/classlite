import { Inngest } from "inngest";

/**
 * Inngest client for ClassLite background jobs.
 *
 * Usage:
 * - Import `inngest` to send events: `await inngest.send({ name: "event/name", data: {...} })`
 * - Import `functions` array in inngest.routes.ts for the serve handler
 *
 * In production, set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY environment variables.
 * For local development, the Inngest Dev Server works without authentication.
 */
export const inngest = new Inngest({
  id: "classlite",
});
