import { FastifyInstance } from "fastify";
import { serve } from "inngest/fastify";
import { inngest } from "./client.js";
import { functions } from "./functions.js";

/**
 * Inngest webhook routes.
 *
 * The /api/inngest endpoint handles:
 * - GET: Introspection (used by Inngest Dev Server to discover functions)
 * - POST: Event reception
 * - PUT: Function execution callbacks
 *
 * Local development:
 *   npx inngest-cli@latest dev
 *   Dev server runs at http://localhost:8288
 */
export async function inngestRoutes(fastify: FastifyInstance) {
  // Inngest requires GET, POST, and PUT methods on the same route
  const handler = serve({
    client: inngest,
    functions,
  });

  fastify.route({
    method: ["GET", "POST", "PUT"],
    url: "/api/inngest",
    handler,
  });
}
