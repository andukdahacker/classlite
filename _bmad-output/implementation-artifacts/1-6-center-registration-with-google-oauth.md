# Story 1.6: Center Registration with Google OAuth

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a new Center Owner,
I want to register my center using my Google account,
so that I don't have to remember another password and can get started faster.

## Acceptance Criteria

1. **Google Signup on Registration Page:** The Center Registration page must include a "Continue with Google" button. [x]
2. **Unified Registration Flow:** When using Google, the user must still provide a Center Name and Center Slug (auto-generated from name). [x]
3. **Backend Google Center Registration:** Implement `POST /api/v1/auth/signup/center/google` that accepts `idToken`, `centerName`, and `centerSlug`. [x]
4. **Identity Linking:** If a user with that Google email already exists but has no center membership, the backend should link the new center to the existing user. [x]
5. **Conflict Handling:**
   - Return **409 Conflict** if the Center Slug is already taken. [x]
   - Return **409 Conflict** if the user already belongs to a center (a user can only own/belong to one center in MVP). [x]
6. **Token Verification:** The backend must verify the Google ID Token using Firebase Admin SDK. [x]
7. **Custom Claims:** Upon successful registration, set Firebase Custom Claims `{ center_id, role: 'OWNER' }`. [x]

## Tasks / Subtasks

- [x] **Shared Types & Validation**
  - [x] Add `CenterSignupWithGoogleRequestSchema` to `packages/types/src/auth/dto.ts`
- [x] **Backend Implementation**
  - [x] Add `centerSignupWithGoogle` method to `AuthService` in `apps/backend/src/modules/auth/auth.service.ts`
  - [x] Add controller method and route for `POST /api/v1/auth/signup/center/google`
- [x] **Frontend Implementation**
  - [x] Add `signupCenterWithGoogle` to `apps/webapp/src/features/auth/auth.api.ts`
  - [x] Create `useSignupCenterWithGoogleMutation` hook in `auth.hooks.ts`
  - [x] Update `SignupCenterForm` to include "Continue with Google" button
  - [x] Handle the flow: user enters Center details -> clicks "Google Signup" -> Firebase Google Auth Popup -> Call Backend -> Redirect
- [x] **Testing**
  - [x] Add unit tests for `centerSignupWithGoogle` in `auth.service.test.ts`

## Dev Notes

- **Firebase Provider:** When using Google, we don't call `firebaseAuth.createUser()`. Instead, we verify the token received from the frontend.
- **Prisma Transaction:** Ensure Center, User (if not exists), AuthAccount, and Membership are created in a single transaction.
- **Role Casing:** Ensure `OWNER` is used (uppercase).

### Project Structure Notes

- **Backend Module:** `apps/backend/src/modules/auth/`
- **Frontend Feature:** `apps/webapp/src/features/auth/`

### References

- [Source: 1-2-user-authentication-with-firebase.md] - Base auth implementation.
- [Source: architecture.md#Authentication & Security] - Firebase strategy.

## Dev Agent Record

### Agent Model Used

gpt-4o

### Debug Log References

- Implemented `centerSignupWithGoogle` in `AuthService` with identity linking and conflict handling.
- Added `POST /api/v1/auth/signup/center/google` route in backend.
- Updated `SignupCenterForm` with Google signup flow.
- Manually updated `schema.d.ts` in webapp to include the new route for type safety.
- Fixed minor LSP issues during implementation.

### Completion Notes List

- Added `CenterSignupWithGoogleRequestSchema` to `@workspace/types`.
- Implemented `centerSignupWithGoogle` in `backend`.
- Added unit tests for the new backend service method.
- Added `signupCenterWithGoogle` API call and React Query hook in `webapp`.
- Integrated Google Auth popup and backend call in `SignupCenterForm`.

### File List

- `packages/types/src/auth/dto.ts`
- `packages/types/src/auth/dto.test.ts`
- `apps/backend/src/modules/auth/auth.service.ts`
- `apps/backend/src/modules/auth/auth.service.test.ts`
- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/src/modules/auth/auth.routes.ts`
- `apps/backend/src/modules/auth/auth.routes.integration.test.ts`
- `apps/backend/src/middlewares/role.middleware.ts`
- `apps/backend/src/middlewares/role.middleware.test.ts`
- `apps/backend/src/middlewares/role.middleware.integration.test.ts`
- `apps/webapp/src/schema/schema.d.ts`
- `apps/webapp/src/features/auth/auth.api.ts`
- `apps/webapp/src/features/auth/auth.hooks.ts`
- `apps/webapp/src/features/auth/components/signup-center-form.tsx`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-01-20: Implemented Center Registration with Google OAuth (Story 1.6).
- 2026-01-20: Addressed code review findings (identity linking updates, claim clearing, and documentation).
- 2026-01-20: Fixed Code Review issues:
  - Added `auth.routes.integration.test.ts` to test endpoint wiring (Medium).
  - Fixed race condition in `auth.service.ts` by handling Prisma P2002 errors (Low).
  - Improved frontend UX by signing out on failure (Low).
  - Added untracked role middleware files to git (Medium).
  - Acknowledged manual schema update (High/Process) - confirmed schema matches code.
