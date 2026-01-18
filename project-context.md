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

---

## Code Patterns & Conventions

### Directory Structure

- **Feature-First:** Code is organized by Domain (e.g., `modules/grading`), not Type (e.g., `controllers/`).
- **Co-location:** Unit tests (`.test.ts`) live next to the source file.

### Naming

- **API:** `kebab-case` URLs (e.g., `/api/v1/grading-jobs`).
- **DB:** `PascalCase` Models, `snake_case` Database Columns (via `@map`).
- **Components:** `PascalCase` (e.g., `GradingWorkbench.tsx`).

### Error Handling

- **Backend:** Throw `createError()` from `@fastify/error` or return standardized error objects.
- **Frontend:** Handle errors in `onError` callbacks of mutations, display via Toasts.

---

## Testing Rules

### Unit & Integration

- **Framework:** Vitest
- **Location:** Co-located with source code (`src/features/auth/auth.service.test.ts`).
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

### Commits

- **Format:** Conventional Commits (`feat: add grading job`, `fix: auth redirect`).
- **Scope:** Optional but encouraged (`feat(grading): ...`).

### Branching

- **Feature:** `feat/description`
- **Fix:** `fix/issue-id-description`
