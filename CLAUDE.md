# Project Context for AI Agents

_Critical rules and patterns that AI agents must follow when implementing code in this project._

---

## Generated Files — Do Not Edit Directly

- **`apps/webapp/src/schema/schema.d.ts`** — Auto-generated from the backend OpenAPI spec. NEVER edit directly. Always regenerate:
  1. Start the backend: `pnpm --filter=backend dev`
  2. Generate: `pnpm --filter=webapp sync-schema-dev` (hits `http://localhost:4000/documentation/json`)
  3. The types flow: Zod schemas (packages/types) → Fastify routes → OpenAPI JSON → openapi-typescript → schema.d.ts
