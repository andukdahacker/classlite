# Gemini Code Audit Report

**Date:** 2026-02-06
**Scope:** Stories 1-1, 1-2, 1-3, 2-1 (Gemini-built foundations)
**Auditor:** Claude Opus 4.6

---

## Summary

| Severity | Count | Key Areas |
|----------|-------|-----------|
| CRITICAL | 13 | Tenant isolation, auth bypass, XSS, DoS, role mismatch |
| HIGH | 17 | `any` types, missing error mapping, unprotected routes, fragile patterns |
| MEDIUM | 30+ | Test gaps, inconsistent formats, race conditions, UX issues |
| LOW | 25+ | Dead imports, naming, placeholder UI, minor cleanup |

---

## CRITICAL Findings

### C1. [Story 1-1] Role Casing Mismatch — Provisioned Owners Locked Out
**File:** `apps/backend/src/modules/tenants/tenant.service.ts:210`
**Description:** `setCustomUserClaims` sets `role: "owner"` (lowercase), but `requireRole` checks for `"OWNER"` (uppercase). Newly provisioned tenant owners are locked out of owner-restricted routes until they re-authenticate through the regular login flow which re-syncs claims.
**Fix:** Use `CenterRole.OWNER` enum value instead of `"owner"` string literal.

### C2. [Story 1-1] CORS Header Name Mismatch
**File:** `apps/backend/src/app.ts:112` vs `apps/backend/src/modules/tenants/tenant.routes.ts:87,91`
**Description:** CORS allows `X-Platform-Admin-Api-Key` but route reads `x-platform-admin-key`. Different header names — provisioning may fail from browsers.
**Fix:** Align names: change CORS to `X-Platform-Admin-Key` or route to `x-platform-admin-api-key`.

### C3. [Story 1-1] XSS in HTML Email Template
**File:** `apps/backend/src/modules/tenants/tenant.service.ts:221-228`
**Description:** `ownerName` and `name` interpolated into HTML email without sanitization. Malicious input executes in recipient's email client.
**Fix:** HTML-escape all interpolated values or use a templating library.

### C4. [Story 1-1] Internal Error Messages Leaked to Clients
**File:** `apps/backend/src/modules/tenants/tenant.routes.ts:115,160`
**Description:** Raw `error.message` sent in 500 responses. Internal Prisma/DB errors can leak infrastructure details.
**Fix:** Always use generic message for 500 responses. Log real error server-side.

### C5. [Story 1-2] Unauthenticated Login-Attempt Endpoints — DoS Vector
**File:** `apps/backend/src/modules/auth/auth.routes.ts:154-213`
**Description:** `GET /login-attempt/:email`, `POST /login-attempt`, `DELETE /login-attempt/:email` have no authentication. Anyone can lock out any user by sending 5 failed attempts. `success` field is client-controlled with no server-side verification.
**Fix:** Remove public `POST /login-attempt`. Make `recordLoginAttempt` internal to the login flow. Rate-limit `GET /login-attempt/:email`.

### C6. [Story 1-2] DELETE Login Attempt Guarded Only by NODE_ENV
**File:** `apps/backend/src/modules/auth/auth.routes.ts:217-250`
**Description:** `DELETE /login-attempt/:email` guarded by `NODE_ENV === "production"`. If NODE_ENV not set, endpoint is active.
**Fix:** Invert logic to allowlist: only enable when `NODE_ENV === "development" || NODE_ENV === "test"`.

### C7. [Story 1-2] Email in URL Path Leaks PII
**File:** `apps/backend/src/modules/auth/auth.routes.ts:154-155`
**Description:** `GET /login-attempt/:email` and `DELETE /login-attempt/:email` put email in URL. URLs logged everywhere.
**Fix:** Pass email as query parameter or in request body.

### C8. [Story 1-2/1-3] Auth Middleware Trusts Custom Claims Without Validation
**File:** `apps/backend/src/middlewares/auth.middleware.ts:45-50`
**Description:** `(decodedToken.role as UserRole)` — no runtime validation. Fallback `|| "STUDENT"` means any Firebase user without role claim gets STUDENT access silently.
**Fix:** Validate against `UserRoleSchema` at runtime. Reject tokens without valid role claim.

### C9. [Story 1-3] 403 Response Format Mismatch
**File:** `apps/backend/src/middlewares/role.middleware.ts:38-44`
**Description:** Sends `{data: null, error: {code, message}}` but `ErrorResponseSchema` expects `{message, error?}`. Top-level `message` field is missing. With Zod serialization, 403s may become 500s.
**Fix:** Match response to `ErrorResponseSchema`: `{message: "FORBIDDEN: ...", error: {code: "FORBIDDEN"}}`.

### C10. [Story 2-1] Tenant Isolation Bypass in `upsert`
**File:** `packages/db/src/tenanted-client.ts:87-105`
**Description:** `upsert` only injects `centerId` into `create`, NOT into `where` or `update`. The `where` clause could match a record from a different tenant.
**Fix:** Add centerId injection to `where` in upsert handling.

### C11. [Story 2-1] `findUnique`/`findUniqueOrThrow` Bypass Extension Pipeline
**File:** `packages/db/src/tenanted-client.ts:66-83`
**Description:** Calls `(prisma as any)[modelKey].findFirst(...)` on the base (unextended) Prisma client, bypassing the `$extends` pipeline entirely. Works currently because there's only one extension layer; will break if any other extension is added.
**Fix:** Document limitation. Consider alternative approach that stays within the extension pipeline.

### C12. [Story 1-2] Token Stored in localStorage
**File:** `apps/webapp/src/features/auth/components/signup-center-form.tsx:100,105`
**Description:** Firebase ID token stored in `localStorage`. XSS attack surface, stale tokens never refreshed, duplicates Firebase SDK's token management.
**Fix:** Remove manual localStorage token storage. Use Firebase SDK's `getIdToken(true)`.

### C13. [Story 1-1] Timing-Safe Comparison Not Used for API Key
**File:** `apps/backend/src/modules/tenants/tenant.routes.ts:90-97`
**Description:** Admin API key compared with `!==` (strict equality), susceptible to timing attacks.
**Fix:** Use `crypto.timingSafeEqual()` for comparison.

---

## HIGH Findings

### H1. [Story 1-1] `createTenant` Uses Raw `this.prisma` Instead of Tenanted Client
**File:** `apps/backend/src/modules/tenants/tenant.service.ts:140-205`
**Description:** `CenterMembership` creation bypasses tenanted client. Architectural violation of tenant isolation pattern.
**Fix:** Use `getTenantedClient` for membership creation after center exists.

### H2. [Story 1-1] `GET /:id` Route Bypasses Controller Layer
**File:** `apps/backend/src/modules/tenants/tenant.routes.ts:61-62`
**Description:** GET handler calls `tenantService.getTenant(id)` directly. POST `/:id/logo` also bypasses controller.
**Fix:** Add controller methods for getTenant and uploadLogo.

### H3. [Story 1-1] Missing Slug Uniqueness Check Before Firebase User Creation
**File:** `apps/backend/src/modules/tenants/tenant.service.ts:136-192`
**Description:** Checks email uniqueness but not slug. Firebase user created before DB transaction catches P2002 on slug.
**Fix:** Add explicit slug uniqueness check before creating Firebase user.

### H4. [ALL] `catch (error: any)` Used 12+ Times
**Files:** `auth.routes.ts` (7x), `tenant.routes.ts` (4x), `invitation.routes.ts` (1x)
**Description:** Violates "no `any` types" convention.
**Fix:** Use `catch (error: unknown)` with `error instanceof Error` narrowing.

### H5. [Story 1-2] Auth Service Does NOT Use `getTenantedClient`
**File:** `apps/backend/src/modules/auth/auth.service.ts`
**Description:** Uses raw PrismaClient for all queries including center-scoped operations like `getUserMembership`. `getTenantedClient` is imported in routes but never used.
**Fix:** Use `getTenantedClient` for center-scoped operations.

### H6. [Story 1-2] Error-to-HTTP Mapping via String Prefix Matching
**File:** `apps/backend/src/modules/auth/auth.routes.ts:44-49,73-79,99-105,141-147`
**Description:** `error.message.startsWith("CONFLICT")` — fragile, breaks if message wording changes. Also catches `error: any` and accesses `.message` without instanceof check.
**Fix:** Introduce custom error classes with `statusCode` property.

### H7. [Story 1-2] `/me` Response Not Wrapped in `{data, message}` Format
**File:** `apps/backend/src/modules/auth/auth.controller.ts:38-53`
**Description:** Returns plain `AuthUser` object, not `{data, message}`. Inconsistent with all other controllers.
**Fix:** Wrap response in standard format.

### H8. [Story 1-3] `requireRole` With All 4 Roles Is a No-Op
**Files:** `auth.routes.ts:123`, `tenant.routes.ts:47`, `users.routes.ts:419`
**Description:** `requireRole(["OWNER","ADMIN","TEACHER","STUDENT"])` permits every authenticated user — same as just `authMiddleware`.
**Fix:** Remove or document explicitly.

### H9. [Story 1-3] Notifications Routes Have NO Role-Based Protection
**File:** `apps/backend/src/modules/notifications/notifications.routes.ts`
**Description:** All 5 notification endpoints have `authMiddleware` but zero `requireRole` guards. DELETE endpoint has no ownership check.
**Fix:** Add requireRole to all endpoints. Enforce ownership in DELETE.

### H10. [Story 1-3] Multiple GET Endpoints Lack `requireRole`
**Files:** courses.routes.ts, classes.routes.ts, schedules.routes.ts, sessions.routes.ts
**Description:** All GET/list endpoints have `authMiddleware` but no `requireRole`. Any authenticated user reads all data.
**Fix:** Add explicit requireRole to document access intent.

### H11. [Story 1-3] Login-Attempt POST Allows Unauthenticated DoS
(Overlaps with C5. Separate finding in RBAC context.)

### H12. [Story 2-1] Missing Error-to-HTTP-Status Mapping in Courses/Classes Routes
**Files:** `courses.routes.ts`, `classes.routes.ts`
**Description:** No `try/catch` in handlers. Prisma `P2025` (not found) returns 500 instead of 404.
**Fix:** Add try/catch with Prisma error code mapping or global error handler plugin.

### H13. [Story 2-1] `getCenterStudents` Returns `Promise<any[]>`
**File:** `apps/backend/src/modules/logistics/classes.service.ts:121`
**Fix:** Define proper type in `@workspace/types`.

### H14. [Story 2-1] `(request.query as any).search` Bypasses Type Safety
**File:** `apps/backend/src/modules/logistics/classes.routes.ts:267`
**Fix:** Use proper Fastify generic typing.

### H15. [Story 2-1] Delete Course/Class Has No Cascade Handling
**Files:** `courses.service.ts:46-51`, `classes.service.ts:60-65`
**Description:** Simple delete will 500 on FK constraint if dependent records exist.
**Fix:** Check dependencies, cascade-delete in transaction, or return meaningful error.

### H16. [Story 2-1] Tenanted Client Tests Don't Cover Critical Rewrites
**File:** `packages/db/src/tenanted-client.test.ts`
**Description:** No tests for findUnique->findFirst rewrite, upsert, update, or delete operations.
**Fix:** Add comprehensive tests.

### H17. [Story 1-2] Google Signup Flow Race Condition
**File:** `apps/webapp/src/features/auth/components/signup-center-form.tsx:62-121`
**Description:** Sign-out/re-sign-in dance with module-level semaphore flag. Fragile, can break if component unmounts.
**Fix:** Use ref-based flag inside auth context instead.

---

## MEDIUM Findings (Summary — 30+ items)

**Test Gaps:**
- No tests for `getTenant`, duplicate email conflict, Firebase conflict (1-1)
- No tests for `getUserMembership`, `checkLoginAttempt`, `recordLoginAttempt` (1-2)
- Missing tests for ADMIN role, middleware ordering failure (1-3)
- Missing tests for 6/10 service methods in classes (2-1)
- Tests skip silently when DB unavailable (2-1 integration tests)

**Type Safety:**
- `as any` in test mocks across all stories
- `mockFirebaseAuth as any` in auth service tests
- Mocks manually reimplement Prisma extension pipeline (brittle)

**Pattern Inconsistencies:**
- Inconsistent response format for error responses (some `{message}`, some `{data:null, error:{}}`)
- Inconsistent `preHandler` attachment (module-level hook vs per-route)
- Variable naming inconsistency (`api` vs `typedFastify`)

**Frontend Issues:**
- `useAuthUserQuery` has no-op queryFn (reads from its own cache)
- Frontend passes `centerId=""` fallback (should guard or use undefined)
- RosterManager search fires on every keystroke without debounce
- CourseDrawer uses browser native `confirm()` instead of shadcn Dialog
- Frontend hooks don't expose mutation error/loading states
- Student count uses wrong field (`cls.studentCount` vs `cls._count.students`)
- CourseDrawer step 2 is placeholder with disabled inputs

**Backend Issues:**
- Auto-user-creation on login without invitation check
- Race condition between uniqueness check and create in centerSignup
- Custom claims set outside transaction (non-atomic provisioning)
- Center model queried via tenanted client unnecessarily
- console.log in app.ts

---

## Files Affected by Story

### Story 1-1 (Tenant Provisioning)
- `apps/backend/src/modules/tenants/tenant.service.ts`
- `apps/backend/src/modules/tenants/tenant.controller.ts`
- `apps/backend/src/modules/tenants/tenant.routes.ts`
- `apps/backend/src/modules/tenants/tenant.service.test.ts`
- `packages/types/src/tenant/dto.ts`
- `apps/backend/src/env.ts`
- `apps/backend/src/app.ts`

### Story 1-2 (Auth)
- `apps/backend/src/modules/auth/auth.service.ts`
- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/src/modules/auth/auth.routes.ts`
- `apps/backend/src/modules/auth/auth.service.test.ts`
- `apps/backend/src/middlewares/auth.middleware.ts`
- `packages/types/src/auth/dto.ts`
- `apps/webapp/src/features/auth/auth.api.ts`
- `apps/webapp/src/features/auth/auth.hooks.ts`
- `apps/webapp/src/features/auth/components/signup-center-form.tsx`
- `apps/webapp/src/features/auth/login-page.tsx`

### Story 1-3 (RBAC)
- `apps/backend/src/middlewares/role.middleware.ts`
- `apps/backend/src/middlewares/role.middleware.test.ts`
- `apps/backend/src/middlewares/role.middleware.integration.test.ts`

### Story 2-1 (Course & Class Management)
- `packages/db/src/tenanted-client.ts`
- `packages/db/src/tenanted-client.test.ts`
- `apps/backend/src/modules/logistics/courses.service.ts`
- `apps/backend/src/modules/logistics/courses.controller.ts`
- `apps/backend/src/modules/logistics/courses.routes.ts`
- `apps/backend/src/modules/logistics/courses.service.test.ts`
- `apps/backend/src/modules/logistics/classes.service.ts`
- `apps/backend/src/modules/logistics/classes.controller.ts`
- `apps/backend/src/modules/logistics/classes.routes.ts`
- `apps/backend/src/modules/logistics/classes.service.test.ts`
- `apps/webapp/src/features/logistics/hooks/use-logistics.ts`
- `apps/webapp/src/features/logistics/components/CourseDrawer.tsx`
- `apps/webapp/src/features/logistics/components/RosterManager.tsx`
- `apps/webapp/src/features/logistics/courses-page.tsx`
- `apps/webapp/src/features/logistics/classes-page.tsx`

---

## Recommendations

1. **Fix CRITICALs before deploying Epic 2** — especially C1 (role lockout), C5 (DoS), C8 (claims validation), C10 (tenant isolation)
2. **Fix HIGHs during Epic 3 development** — as each area is touched, fix adjacent HIGH issues
3. **MEDIUMs are tech debt** — address during dedicated cleanup sprints or as part of story work
