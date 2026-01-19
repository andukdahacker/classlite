# Story 1.2: User Authentication with Firebase

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to log in using Google OAuth or Email/Password,
so that I can securely access the platform.

## Acceptance Criteria

1. **Frontend Authentication:** Users can sign in using Google OAuth or Email/Password via Firebase Client SDK. [Source: epics.md#Story 1.2]
2. **Token Verification:** The frontend sends the Firebase ID Token to the backend `POST /api/v1/auth/login` for verification.
3. **Identity Sync:** Backend verifies the token using Firebase Admin SDK and syncs user identity with the local database.
4. **Custom Claims Injection:** Backend retrieves `center_id` and `role` from the database and sets them as Firebase Custom Claims if missing or outdated. [Source: architecture.md#Authentication & Security]
5. **Role-Based Redirection:** Upon successful login, the frontend redirects users to their specific dashboard based on their role:
   - `OWNER` -> `/dashboard/owner`
   - `TEACHER` -> `/dashboard/teacher`
   - `STUDENT` -> `/dashboard/student`
6. **Auth Middleware:** Implement a Fastify middleware to verify the ID token on protected routes and attach the payload to `request.jwtPayload`. [Source: AGENTS.md#Middleware]

## Tasks / Subtasks

- [ ] **Infrastructure & Configuration** (AC: 1, 2)
  - [ ] Configure Firebase Client SDK in `apps/webapp`
  - [ ] Configure Firebase Admin SDK in `apps/backend` (Ensure `FIREBASE_*` env vars are used)
- [ ] **Shared Types & Validation** (AC: 2)
  - [ ] Define `LoginRequestSchema` and `AuthResponseSchema` in `packages/types/src/auth/`
- [ ] **Backend Implementation** (AC: 2, 3, 4, 6)
  - [ ] Create `apps/backend/src/modules/auth/` (controller, service, routes)
  - [ ] Implement `login` endpoint that verifies ID token and returns user context
  - [ ] Implement `syncCustomClaims` logic in auth service
  - [ ] Create `apps/backend/src/middlewares/auth.middleware.ts` to protect routes
- [ ] **Frontend Implementation** (AC: 1, 5)
  - [ ] Create `apps/webapp/src/features/auth/`
  - [ ] Implement `useAuth` hook using Firebase `onAuthStateChanged`
  - [ ] Build Login page with Google and Email/Password options
  - [ ] Implement protected route wrapper and role-based redirection logic
- [ ] **Testing**
  - [ ] Add unit tests for `AuthService` (verifying token and claims logic)
  - [ ] Add E2E tests for login flow using Playwright

## Dev Notes

- **Firebase Custom Claims:** Used to persist multi-tenancy context (`center_id`) and `role` in the ID token. This allows the frontend to route correctly without extra API calls and the backend to enforce isolation efficiently.
- **Middleware:** The auth middleware should decode the token and attach `center_id` and `role` to `request.jwtPayload` for use in services (specifically the Tenanted Prisma Client).
- **Security:** Ensure `PLATFORM_ADMIN_API_KEY` is NOT used for regular user auth; it is for provisioning.
- **Data Isolation:** Future stories will rely on the `center_id` provided by this auth flow to filter database queries.

### Project Structure Notes

- **Backend:** Module located in `apps/backend/src/modules/auth/`.
- **Frontend:** Feature located in `apps/webapp/src/features/auth/`.
- **Shared:** Types in `packages/types/src/auth/`.
- Alignment with the existing `modules/tenants` pattern established in Story 1.1.

### References

- [Source: apps/backend/src/index.ts] - Route registration pattern.
- [Source: architecture.md#Authentication & Security] - Firebase Auth and Custom Claims strategy.
- [Source: epics.md#Story 1.2] - Original story definition.
- [Source: AGENTS.md#Middleware] - Auth middleware requirements.

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Simulated)

### Debug Log References

### Completion Notes List

### File List
