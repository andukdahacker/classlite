# Story 1.1: Tenant Provisioning System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Platform Admin**,
I want to **provision new Center tenants with a unique `center_id`**,
so that **new customers can have their own isolated environment**.

## Acceptance Criteria

1.  **Given** a valid request with Center Name and Owner Email
    **When** the provisioning script or API is executed
    **Then** a new Center record is created in the database with a unique `center_id` (CUID)
    **And** an Owner user is created in Firebase Auth
    **And** the Firebase User has custom claims set: `{ center_id: <id>, role: 'owner' }`
    **And** an Owner user record is created in the database linked to this center
    **And** a default "Welcome" email is triggered to the Owner via Resend

2.  **Given** an invalid request (missing name or email)
    **When** the API is called
    **Then** it returns a 400 Bad Request error with Zod validation details

3.  **Given** a request with an email that already exists
    **When** the API is called
    **Then** it returns a 409 Conflict error

## Tasks / Subtasks

- [x] **Database Schema (Prisma)**

  - [x] Define `User` model in `packages/db/prisma/schema.prisma`
  - [x] Define `AuthAccount` model
  - [x] Define `Center` model
  - [x] Define `CenterMembership` model
  - [x] Define RBAC models: `Permission`, `RolePermission`, `MembershipPermission`
  - [x] Run `pnpm --filter db db:push` to apply changes (Moved schema to packages/db as per architecture best practices)

- [x] **Shared Types (Zod)**

  - [x] Create `packages/types/src/tenant/dto.ts`
  - [x] Define `CreateTenantSchema`
  - [x] Export inferred TypeScript types

- [x] **Backend Service (Tenant Module)**

  - [x] Create `apps/backend/src/modules/tenants/tenant.service.ts`
  - [x] Implement `createTenant` method
  - [x] Use Prisma transaction to ensure atomicity:
    1. Create `User` (if not exists)
    2. Create `AuthAccount` (link to Firebase UID)
    3. Create `Center`
    4. Create `CenterMembership` (Role: OWNER, Status: ACTIVE)
  - [x] Integrate Firebase Admin SDK to:
    1. Create user in Firebase (if not exists)
    2. Set custom claims `{ center_id: <id>, role: 'owner' }`
    3. Generate Password Reset Link (for onboarding)
  - [x] Integrate Resend to send welcome email containing the Password Reset Link

- [x] **Backend Controller (Tenant Module)**

  - [x] Create `apps/backend/src/modules/tenants/tenant.controller.ts`
  - [x] Implement `provision` handler
  - [x] Register route `POST /api/v1/tenants` in `apps/backend/src/modules/tenants/tenant.routes.ts`
  - [x] Protect route (Platform Admin check)

- [x] **Testing**
  - [x] Write unit tests for `tenant.service.ts` (mocking Prisma and Firebase)

## Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] Fix unprotected provisioning route (added x-platform-admin-key check)
- [x] [AI-Review][CRITICAL] Fix AC 3 violation: Enforce conflict check if email exists in DB or Firebase
- [x] [AI-Review][HIGH] Ensure atomic cleanup of Firebase user if DB transaction fails
- [x] [AI-Review][HIGH] Inject environment variables via Fastify getEnvs for better testability and security
- [x] [AI-Review][LOW] Use arrow functions in controllers to avoid `.bind(this)` in routes

## Dev Agent Record

### Architecture Compliance

- **Module Location:** `apps/backend/src/modules/tenants/`
- **Shared Types:** MUST use `@workspace/types` for DTOs.
- **Database:** MUST use `@workspace/db`. Access `prisma` instance via DI or global/singleton (as per scaffold).
- **Auth:** Use `firebase-admin` for backend user creation.
- **Email:** Use `resend` (ensure `RESEND_API_KEY` is in env).

### Technical Requirements

- **Center ID:** Use CUID (`@default(cuid())` in Prisma).
- **Custom Claims:** Essential for the Multi-Tenancy strategy. The `center_id` claim is the source of truth for the `TenantedClient` extension (to be implemented later, but data must be correct now).
- **Isolation:** This story SETS UP the isolation by creating the binding (User -> Center).

### Libraries

- `firebase-admin`: For user management.
- `resend`: For transactional emails.
- `zod`: For validation.
- `fastify-type-provider-zod`: For type-safe routes.

### References

- **Architecture:** `_bmad-output/planning-artifacts/architecture.md` (Section: Multi-Tenancy Strategy, Auth & Security)
- **PRD:** `_bmad-output/planning-artifacts/prd.md` (FR2, FR1)
- **Epics:** `_bmad-output/planning-artifacts/epics.md` (Story 1.1)

## Dev Agent Record

### Agent Model Used

- BMad Create-Story Agent (Sm Persona)

### Completion Notes List

- Story context created based on comprehensive artifact analysis.
- Implementation completed with adversarial review follow-ups addressed.
- **Security:** Provisioning route protected by `PLATFORM_ADMIN_API_KEY`.
- **Atomicity:** Improved transaction flow with Firebase cleanup on failure.
- **Validation:** Enforced AC 3 (Conflict on existing email).
- **Architecture:** Followed class-based Service/Controller pattern with Fastify dependency injection.

### File List

- `apps/backend/src/modules/tenants/tenant.service.ts`
- `apps/backend/src/modules/tenants/tenant.controller.ts`
- `apps/backend/src/modules/tenants/tenant.routes.ts`
- `apps/backend/src/modules/tenants/tenant.service.test.ts`
- `packages/db/prisma/schema.prisma`
- `packages/types/src/tenant/dto.ts`
- `apps/backend/src/env.ts`
- `apps/backend/src/index.ts`

### Change Log

- Created Tenant module (Controller, Service, Routes).
- Updated Prisma schema with User, Center, and RBAC models.
- Defined shared DTOs in `packages/types`.
- Implemented provisioning logic with Firebase Auth and Resend integration.
- Added platform security layer for administrative routes.
- Updated environment configuration for center provisioning.
