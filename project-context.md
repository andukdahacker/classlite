---
project_name: "classlite"
user_name: "Ducdo"
date: "2026-01-18"
sections_completed:
  [
    "technology_stack",
    "critical_rules",
    "patterns",
    "testing",
    "quality",
    "workflow",
  ]
existing_patterns_found: 4
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Monorepo

- **Manager:** TurboRepo (`turbo`) + pnpm
- **Languages:** TypeScript (Strict Mode), Node.js (LTS)

### Backend (`apps/backend`)

- **Framework:** Fastify (v5+)
- **Validation:** Zod (via `fastify-type-provider-zod`)
- **Database:** Prisma (with Client Extensions)
- **Queues:** Inngest (Serverless Durable Execution)
- **Auth:** Firebase Admin SDK

### Frontend (`apps/webapp`)

- **Framework:** React (Vite)
- **State:** TanStack Query (v5) + Context API
- **Router:** React Router / TanStack Router (Implied)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Forms:** React Hook Form + Zod Resolver
- **Auth:** Firebase Client SDK

### Shared (`packages/*`)

- **UI:** Shadcn (Radix Primitives)
- **Types:** Zod Schemas (`z.infer` types)
- **DB:** Prisma Schema & Tenanted Client

---

## Critical Implementation Rules

### 1. Multi-Tenancy Enforcement

- **Rule:** NEVER use `new PrismaClient()` directly in feature code.
- **Pattern:** ALWAYS import `getTenantedClient(centerId)` from `@workspace/db`.
- **Reason:** To prevent data leaks between Centers.

### 2. Type Safety Boundary

- **Rule:** ALL API requests and responses must be typed via Zod.
- **Pattern:** Use `fastify-type-provider-zod` in backend routes.
- **Reason:** Ensures end-to-end type safety without manual interface duplication.

### 3. Async Workloads

- **Rule:** NEVER run long-running tasks (grading > 5s) in the main HTTP request.
- **Pattern:** Use `inngest.send()` to offload to background workers.
- **Reason:** Prevents browser timeouts and serverless function limits.

### 4. Offline First

- **Rule:** Mutations must support offline queuing.
- **Pattern:** Use TanStack Query `useMutation` with `networkMode: 'offlineFirst'`.
- **Reason:** Students must be able to submit work without internet.

### 5. Layered Architecture (Route-Controller-Service)

- **Rule:** Controllers must be "pure" (decoupled from Fastify).
- **Pattern:**
  - **Service:** Interacts with DB/External APIs only. Returns raw data.
  - **Controller:** Orchestrates services, formats the standard response `{ data, message }`, and throws domain errors.
  - **Route:** Handles Fastify-specific logic (`request`, `reply`), extracts params/body, calls the controller, and maps errors to HTTP status codes.
- **Reason:** Simplifies unit testing of business logic without mocking the entire Fastify request/reply lifecycle.

---

## Code Patterns & Conventions

### Directory Structure

- **Feature-First:** Code is organized by Domain (e.g., `modules/grading`), not Type (e.g., `controllers/`).
- **Co-location:** Unit tests (`.test.ts`) live next to the source file.

### Naming

- **API:** `kebab-case` URLs (e.g., `/api/v1/grading-jobs`).
- **DB Models:** `PascalCase` in Prisma schema (e.g., `model ClassSession`).
- **DB Columns:** `snake_case` in PostgreSQL via `@map` on every field (e.g., `@map("start_time")`).
- **DB Tables:** `snake_case` in PostgreSQL via `@@map` on every model (e.g., `@@map("class_session")`). **Rule:** ALL Prisma models MUST have a `@@map("snake_case_name")` directive to ensure consistent snake_case table names in the database. Do NOT leave models without `@@map` — PostgreSQL tables should never use PascalCase.
- **Components:** `PascalCase` (e.g., `GradingWorkbench.tsx`).

### Error Handling

- **Domain Errors:** Throw standard `Error` with clear messages in Services/Controllers.
- **Mapping:** The **Route layer** catches these errors and uses `reply.status(code).send({ message })` to map them to HTTP status codes (400, 401, 409, etc.).
- **Frontend:** Handle errors in `onError` callbacks of mutations, display via Toasts.

---

## Testing Rules

### Unit & Integration

- **Framework:** Vitest
- **Location:** Co-located with source code (`src/features/auth/auth.service.test.ts`).
- **Command:** ALWAYS use `pnpm --filter=backend test` to run backend tests.
- **Pattern:** Integration tests should spin up a real Fastify instance using `buildApp()`.
- **Database:** Use a dedicated test database or Docker container. Do NOT mock Prisma Client methods if testing logic that depends on DB constraints.

### End-to-End (E2E)

- **Framework:** Playwright
- **Location:** `apps/e2e/`
- **Pattern:** Tests run against a fully built production container.

---

## Code Quality Rules

### Imports

- **Internal:** Use relative imports for files in the same module (`./utils`).
- **External:** Use path aliases (`~/lib/db`) or workspace packages (`@workspace/types`).
- **Forbidden:** Never import directly from `../../../../apps/backend` (cross-app imports).

### Style

- **Linting:** Strict ESLint rules enabled. No `console.log` in production code.
- **Types:** No `any`. Use `unknown` with narrowing if type is truly dynamic.

---

## Development Workflow

### Database (packages/db)

- **Generate Prisma Client:** `pnpm --filter=db db:generate`
- **Create Migration:** `pnpm --filter=db db:migrate:create --name <description>` (generates SQL without applying)
- **Apply Migrations (dev):** `pnpm --filter=db db:migrate:dev` (creates + applies migrations locally)
- **Apply Migrations (deploy):** `pnpm --filter=db db:migrate:deploy` (applies pending migrations — used in CI/staging/production)
- **Migration Status:** `pnpm --filter=db db:migrate:status` (check which migrations are applied)
- **Prisma Studio:** `pnpm --filter=db db:studio`
- **Build:** `pnpm --filter=db build` (generate + tsc + copy generated)
- **Rule:** After modifying `schema.prisma`, run `db:migrate:dev --name <description>` to generate a migration SQL file, then commit the migration with code changes. Do NOT use `db:push` for schema changes — it is deprecated for prototyping only. Always use `pnpm --filter=db` prefix, NOT bare `npx prisma`.
- **Migration Workflow:** Modify schema → `db:migrate:dev --name <desc>` → migration SQL generated in `packages/db/prisma/migrations/` → commit migration with code → PR review → `db:migrate:deploy` runs automatically on staging/production start.
- **Rollback:** Prisma Migrate does not support down migrations. To revert a bad migration, create a new corrective migration that undoes the changes.

### Schema Sync (Frontend)

- **Rule:** ALWAYS run `pnpm --filter=webapp sync-schema-dev` after adding new backend routes.
- **Prerequisite:** Backend must be running locally (`pnpm --filter=backend dev`).
- **Reason:** The frontend uses `openapi-fetch` with auto-generated TypeScript types from the backend OpenAPI schema. New routes won't have type definitions until the schema is synced.
- **Location:** Schema is generated to `apps/webapp/src/schema/schema.d.ts`.

### Commits

- **Format:** Conventional Commits (`feat: add grading job`, `fix: auth redirect`).
- **Scope:** Optional but encouraged (`feat(grading): ...`).

### Branching

- **Feature:** `feat/description`
- **Fix:** `fix/issue-id-description`
