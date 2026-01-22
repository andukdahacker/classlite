# Story 1.4: Multi-Tenant Data Isolation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Center Owner,
I want my data to be completely isolated from other centers,
so that I comply with privacy laws and prevent data leaks.

## Acceptance Criteria

1. **Tenanted Client Extension:** Implement a reusable `getTenantedClient(centerId)` function in `@workspace/db` that returns a Prisma Client instance extended with RLS-like filtering. [Source: architecture.md#Data Architecture]
2. **Query Interception:** The extension MUST automatically inject `where: { center_id: centerId }` into all find/count/aggregate queries for all models that have a `center_id` field.
3. **Mutation Interception:** The extension MUST automatically inject `data: { center_id: centerId }` into all create/update queries (or validate it matches).
4. **Usage Enforcement:** The backend API modules MUST use `getTenantedClient(req.user.centerId)` instead of the raw `prisma` client.
5. **Isolation Verification:**
   - **Given** data exists in Center A and Center B.
   - **When** a user from Center A queries `db.user.findMany()`.
   - **Then** ONLY Center A users are returned.
   - **And** raw SQL logs show the `WHERE "center_id" = '...'` clause.

## Tasks / Subtasks

- [x] **DB Package Extension** (AC: 1, 2, 3)
  - [x] Create `packages/db/src/tenanted-client.ts`
  - [x] Implement `prisma.$extends` with `query` and `model` extensions
  - [x] Add logic to inject `center_id` into `params.args.where` for reads
  - [x] Add logic to inject `center_id` into `params.args.data` for writes
- [x] **Backend Integration** (AC: 4)
  - [x] Create/Update `apps/backend/src/lib/db.ts` to export `getTenantedClient`
  - [x] Update a sample route (e.g., `GET /api/v1/centers` or `users`) to use the tenanted client
- [x] **Testing** (AC: 5)
  - [x] Create `packages/db/src/tenanted-client.test.ts`
  - [x] Verify Cross-Tenant Isolation: Create Center A & B. Insert data into both. Query with Center A client. Assert B data is hidden.

## Dev Notes

- **Prisma Extension Pattern:** Use `query: { $allModels: { ... } }` to intercept operations.
- **Model Filtering:** Not all models might have `center_id`.
  - `Center` table: Usually global/admin access. The extension should probably SKIP `Center` model or handle it differently if accessed by Admin. For `Owner` context, they should only see THEIR center.
  - `User`, `Course`, `Class`, etc.: MUST be filtered.
- **Performance:** Extensions are lightweight, but ensure we don't create a new `PrismaClient` connection pool on every request. The _extension_ is per-request, but the _base client_ should be singleton.
- **Error Handling:** If `centerId` is missing/null, the client should throw an error or default to a safe state (return nothing), rather than querying globally.
- **Previous Story Learning (Story 1.3):** Don't just implement the utility; **APPLY** it. Ensure the `getTenantedClient` is actually used in at least one route to prove it works.

### Project Structure Notes

- **Extension Location:** `packages/db/src/tenanted-client.ts`
- **Usage:** Import from `@workspace/db`
- **Avoid:** Do NOT put this logic in `apps/backend` middleware. It belongs in the DB package to be reusable.

### References

- [Source: architecture.md#Data Architecture] - "Logical Isolation via Prisma Client Extensions"
- [Source: epics.md#Story 1.4] - Requirements
- [Source: https://www.prisma.io/docs/orm/prisma-client/client-extensions] - Syntax guide

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- Fixed type errors in `tenanted-client.ts` by using type assertions for args.
- Fixed duplicated code blocks in `auth.routes.ts`.

### Completion Notes List

- Implemented `getTenantedClient(prisma, centerId)` in `@workspace/db`. Changed signature to accept `prisma` instance for DI/Singleton pattern (backend manages connection).
- Updated `apps/backend/src/modules/auth/auth.routes.ts` (`GET /me`) to use the tenanted client, verifying isolation on `CenterMembership` model.
- Created `packages/db/src/tenanted-client.test.ts` with logic verification tests for query/mutation interception.
- Verified backend integration via `vitest`.
- [Refactor] Improved `tenanted-client.ts` type safety and cleaned up logic during code review.
- [New] Created `packages/db/src/tenanted-client.integration.test.ts` for AC #5 verification (Cross-Tenant Isolation).

### File List

- packages/db/src/tenanted-client.ts
- packages/db/src/tenanted-client.test.ts
- packages/db/src/tenanted-client.integration.test.ts
- packages/db/src/index.ts
- packages/db/package.json
- apps/backend/src/modules/auth/auth.routes.ts

## Senior Developer Review (AI)

- **Date:** 2026-01-22
- **Result:** Approved (Fixes Applied)
- **Findings Fixed:**
  - **Critical:** Implemented `verification` via `tenanted-client.integration.test.ts` (AC #5).
  - **Medium:** Improved type safety and comments in `tenanted-client.ts` to address fragility concerns.
  - **Low:** Added missing `test` script to `packages/db/package.json`.
