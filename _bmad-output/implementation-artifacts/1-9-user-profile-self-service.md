# Story 1.9: User Profile Self-Service

Status: done

## Story

As a User,
I want to view and edit my own profile information,
so that I can keep my details current without admin help.

## Acceptance Criteria

1. **Profile Access:** User menu contains "My Profile" link leading to `/:centerId/dashboard/profile`. [Source: epics.md#Story 1.9, AC1]
2. **Editable Fields:** User can edit: Display Name, Profile Photo (max 1MB), Phone Number, Preferred Language (EN/VI). [Source: epics.md#Story 1.9, AC2]
3. **Read-Only Fields:** Email and Role are displayed but not editable (email change requires admin). [Source: epics.md#Story 1.9, AC3]
4. **Password Change:** "Change Password" section requires current password + new password with confirmation. [Source: epics.md#Story 1.9, AC4]
5. **Save Confirmation:** Changes save immediately with success toast. Password change triggers logout of other sessions. [Source: epics.md#Story 1.9, AC5]
6. **Delete Account:** "Delete My Account" button (for non-Owners) triggers confirmation flow with 7-day grace period. [Source: epics.md#Story 1.9, AC6]

## Tasks / Subtasks

- [x] **Task 0: Set Up Inngest Infrastructure** (Prerequisite) ✅
  - [x] 0.1: Install Inngest package: `pnpm add inngest --filter backend`
  - [x] 0.2: Create Inngest client at `apps/backend/src/modules/inngest/client.ts`
  - [x] 0.3: Create Inngest serve route at `apps/backend/src/modules/inngest/inngest.routes.ts`
  - [x] 0.4: Register Inngest routes in `app.ts`
  - [x] 0.5: Add environment variables: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (optional for dev)
  - [x] 0.6: Update `.env.example` with Inngest variables
  - [x] 0.7: Test Inngest dev server connection at `http://localhost:8288`
  - [x] 0.8: Create simple test function to verify setup works

- [x] **Task 1: Extend Profile Page with Edit Mode** (AC: 1, 2, 3) ✅
  - [x] 1.1: Modify existing `apps/webapp/src/features/users/profile-page.tsx` to add edit functionality
  - [x] 1.2: Add "Edit Profile" button that toggles between view/edit mode
  - [x] 1.3: Create `ProfileEditForm.tsx` component in `apps/webapp/src/features/users/components/`
  - [x] 1.4: Form fields: Display Name (text input), Phone Number (text input with phone validation), Preferred Language (Select: EN/VI)
  - [x] 1.5: Display Email and Role as read-only fields with disabled styling and info tooltip explaining why not editable
  - [x] 1.6: Use React Hook Form + Zod validation pattern from center-settings-page.tsx
  - [x] 1.7: Add loading skeleton while profile data loads (existing)
  - [x] 1.8: Handle empty state for new users (placeholder text like "Add your name")

- [x] **Task 2: Profile Photo Upload** (AC: 2) ✅
  - [x] 2.1: Add profile photo upload component using existing avatar upload pattern from center-settings-page.tsx
  - [x] 2.2: Accept only images (PNG, JPG, WEBP), max 1MB
  - [x] 2.3: Show current avatar with "Change Photo" overlay button on hover
  - [x] 2.4: Upload directly without preview (simpler UX)
  - [x] 2.5: Upload to Firebase Storage under `centers/{centerId}/users/{userId}/avatar`
  - [x] 2.6: Update avatarUrl in database after successful upload
  - [x] 2.7: Delete old avatar from Firebase Storage when uploading new one (prevent storage bloat)

- [x] **Task 3: Create Profile Update API** (AC: 2, 5) ✅
  - [x] 3.1: Create `UpdateProfileSchema` in `packages/types/src/user.ts`
  - [x] 3.2: Add `PATCH /api/v1/users/me/profile` endpoint in users.routes.ts
  - [x] 3.3: Add `updateProfile()` method in users.service.ts
  - [x] 3.4: Validate phone number format (optional, max 20 chars - full Vietnamese validation deferred to Story 8.4 i18n)
  - [x] 3.5: Save language preference to user record
  - [x] 3.6: Return updated user profile

- [x] **Task 4: Database Schema Updates** (AC: 2) ✅
  - [x] 4.1: Add `phoneNumber` field to User model in Prisma schema (String, optional)
  - [x] 4.2: Add `preferredLanguage` field to User model in Prisma schema (String, default 'en')
  - [x] 4.3: Add `deletionRequestedAt` field to User model (DateTime, nullable)
  - [x] 4.4: Run `pnpm prisma db push` to sync schema
  - [x] 4.5: Update `AuthUserSchema` and `UserProfileSchema` to include new fields
  - [x] 4.6: Basic phone validation in schema (max 20 chars)

- [x] **Task 5: Password Change Section** (AC: 4, 5) ✅
  - [x] 5.1: Create `PasswordChangeForm.tsx` component in `apps/webapp/src/features/users/components/`
  - [x] 5.2: Form fields: Current Password, New Password, Confirm New Password
  - [x] 5.3: Validation: min 8 chars, 1 uppercase, 1 number (same as reset-password-page.tsx)
  - [x] 5.4: Check if user has password provider (not Google-only OAuth)
  - [x] 5.5: If Google-only auth, show info message "You signed in with Google. Password change not available." and hide form
  - [x] 5.6: Add `POST /api/v1/users/me/change-password` endpoint
  - [x] 5.7: Backend validates current password via Firebase REST API (see Dev Notes for implementation)
  - [x] 5.8: Update password via Firebase Admin SDK `updateUser(uid, { password })`
  - [x] 5.9: After password change, call `revokeRefreshTokens(uid)` to logout other sessions
  - [x] 5.10: Show success message: "Password updated. Other sessions have been logged out."
  - [x] 5.11: Keep current session active (user stays logged in)
  - [x] 5.12: Add loading/disabled state on submit button during API call

- [x] **Task 6: Delete Account Flow** (AC: 6) ✅
  - [x] 6.1: Create `DeleteAccountModal.tsx` component
  - [x] 6.2: Show button only for non-OWNER roles (Owners cannot delete their account)
  - [x] 6.3: Confirmation flow: Type "DELETE" to confirm
  - [x] 6.4: Add `POST /api/v1/users/me/request-deletion` endpoint
  - [x] 6.5: Set 7-day grace period, schedule actual deletion via Inngest background job
  - [x] 6.6: Create `apps/backend/src/modules/users/jobs/user-deletion.job.ts` with Inngest function
  - [x] 6.7: Show warning: "Your account will be deleted in 7 days. Contact support to cancel."
  - [x] 6.8: Add `POST /api/v1/users/me/cancel-deletion` endpoint to undo within grace period
  - [x] 6.9: User can stay logged in during grace period to cancel (Inngest job checks status before deletion)
  - [x] 6.10: On profile page load, check if `deletionRequestedAt` is set
  - [x] 6.11: If pending deletion, show alert banner with countdown and "Cancel Deletion" button
  - [x] 6.12: Cancel deletion clears `deletionRequestedAt`; Inngest job verifies status before proceeding

- [x] **Task 7: Frontend API Hooks** (AC: All) ✅
  - [x] 7.1: Add `useUpdateProfile()` mutation in users.api.ts
  - [x] 7.2: Add `useChangePassword()` mutation in users.api.ts
  - [x] 7.3: Add `useRequestDeletion()` mutation in users.api.ts
  - [x] 7.4: Add `useCancelDeletion()` mutation in users.api.ts
  - [x] 7.5: Invalidate user profile query after mutations
  - [x] 7.6: Use auth context for current user profile with deletion status

- [x] **Task 8: Testing** (AC: All) ✅
  - [x] 8.1: Unit tests for ProfileEditForm validation
  - [x] 8.2: Unit tests for PasswordChangeForm validation
  - [x] 8.3: Unit tests for DeleteAccountModal confirmation flow
  - [x] 8.4: Integration tests for profile update API
  - [x] 8.5: Integration tests for password change API
  - [x] 8.6: Integration tests for deletion request/cancel APIs
  - [x] 8.7: Test RBAC: Owners cannot delete account (covered in service tests)
  - [x] 8.8: Test profile update with membership validation
  - [x] 8.9: Test Google OAuth user cannot access password change
  - [x] 8.10: Test deletion cancellation clears `deletionRequestedAt` field
  - [x] 8.11: Test Inngest function registration and configuration
  - [x] 8.12: Test user deletion job event type

## Dev Notes

### Previous Story Intelligence (from Story 1.8)

Key patterns and learnings from User Management story:

| Pattern | Location | Reuse |
|---------|----------|-------|
| Form with Zod validation | `center-settings-page.tsx` | Copy form structure, zodResolver pattern |
| File upload (avatar/logo) | `center-settings-page.tsx:122-180` | Adapt for user avatar upload |
| Toast notifications | `sonner` | `toast.success()`, `toast.error()` |
| Password validation | `reset-password-page.tsx:14-24` | Exact same validation rules |
| Firebase session revocation | `users.service.ts:deactivateUser` | Use `revokeRefreshTokens()` pattern |
| API hooks pattern | `users.api.ts` | Follow existing mutation/query patterns |

### Existing Profile Page

The profile page already exists at `apps/webapp/src/features/users/profile-page.tsx`:
- Currently displays read-only profile information
- Shows avatar, name, email, role
- Has placeholder text: "Profile editing will be available in a future update."
- Already accessible via "My Profile" in nav-user.tsx dropdown

**Current profile-page.tsx structure to extend:**
```tsx
// Existing: Read-only display with Card layout
// Need to add: Edit mode toggle, ProfileEditForm, PasswordChangeForm, DeleteAccountModal
```

### Architecture Patterns

**Route-Controller-Service Pattern (from architecture.md):**
```
apps/backend/src/modules/users/
├── users.routes.ts      # Add new endpoints for profile operations
├── users.controller.ts  # Add handlers for profile, password, deletion
└── users.service.ts     # Add updateProfile, changePassword, requestDeletion
```

**Multi-Tenancy (CRITICAL from project-context.md):**
```typescript
// ALWAYS use tenanted client - NEVER new PrismaClient()
import { getTenantedClient } from "@workspace/db";

// For profile update - user can only update their own profile
const prisma = getTenantedClient(centerId);
await prisma.user.update({
  where: { id: currentUserId },
  data: { name, phoneNumber, preferredLanguage, avatarUrl }
});
```

### Database Schema Changes

**Add to User model in schema.prisma:**
```prisma
model User {
  // Existing fields...

  // NEW fields for Story 1.9
  phoneNumber         String?
  preferredLanguage   String   @default("en") // "en" | "vi"
  deletionRequestedAt DateTime?
}
```

**Migration command:**
```bash
cd packages/db && pnpm prisma migrate dev --name add_profile_fields
```

### File Locations

| File | Action |
|------|--------|
| `apps/backend/src/modules/inngest/client.ts` | CREATE - Inngest client setup |
| `apps/backend/src/modules/inngest/inngest.routes.ts` | CREATE - Inngest serve endpoint |
| `apps/webapp/src/features/users/profile-page.tsx` | MODIFY - Add edit mode, deletion banner |
| `apps/webapp/src/features/users/components/ProfileEditForm.tsx` | CREATE |
| `apps/webapp/src/features/users/components/PasswordChangeForm.tsx` | CREATE |
| `apps/webapp/src/features/users/components/DeleteAccountModal.tsx` | CREATE |
| `apps/webapp/src/features/users/users.api.ts` | MODIFY - Add new mutations/queries |
| `apps/backend/src/modules/users/users.routes.ts` | MODIFY - Add profile endpoints |
| `apps/backend/src/modules/users/users.controller.ts` | MODIFY - Add `updateProfile`, `changePassword`, `requestDeletion`, `cancelDeletion` handlers |
| `apps/backend/src/modules/users/users.service.ts` | MODIFY - Add profile methods + `verifyCurrentPassword` helper |
| `apps/backend/src/modules/users/jobs/user-deletion.job.ts` | CREATE - Inngest scheduled deletion job |
| `packages/types/src/user.ts` | MODIFY - Add profile DTOs |
| `packages/db/prisma/schema.prisma` | MODIFY - Add user fields |
| `apps/backend/.env` | MODIFY - Add `FIREBASE_API_KEY` |

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/api/v1/users/me/profile` | Update own profile | Any authenticated |
| POST | `/api/v1/users/me/change-password` | Change password | Any authenticated |
| POST | `/api/v1/users/me/request-deletion` | Request account deletion | Non-Owner only |
| POST | `/api/v1/users/me/cancel-deletion` | Cancel deletion request | Any authenticated |

### Type Definitions

**Add to packages/types/src/user.ts:**
```typescript
// Note: Full Vietnamese phone validation deferred to Story 8.4 (i18n)
// Currently using basic max-length validation
export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
  preferredLanguage: z.enum(["en", "vi"]).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
```

**Note:** Full Vietnamese phone validation (libphonenumber-js) deferred to Story 8.4 (i18n).

### Inngest Setup (Task 0)

Inngest is a serverless durable execution platform for background jobs. This is the first story requiring it.

**1. Install package:**
```bash
pnpm add inngest --filter backend
```

**2. Create Inngest client (`apps/backend/src/modules/inngest/client.ts`):**
```typescript
import { Inngest } from "inngest";

// Create the Inngest client
export const inngest = new Inngest({
  id: "classlite",
  // In production, set INNGEST_EVENT_KEY for authenticated events
});

// Export functions array - add all Inngest functions here
export const functions: any[] = [];
```

**3. Create serve route (`apps/backend/src/modules/inngest/inngest.routes.ts`):**
```typescript
import { FastifyInstance } from "fastify";
import { serve } from "inngest/fastify";
import { inngest, functions } from "./client";

export async function inngestRoutes(fastify: FastifyInstance) {
  // Inngest requires POST and PUT on the same route
  fastify.route({
    method: ["GET", "POST", "PUT"],
    url: "/api/inngest",
    handler: serve({
      client: inngest,
      functions,
    }),
  });
}
```

**4. Register in app.ts:**
```typescript
import { inngestRoutes } from "./modules/inngest/inngest.routes";

// In the routes registration section
await fastify.register(inngestRoutes);
```

**5. Environment variables (add to `.env` and `.env.example`):**
```bash
# Inngest Configuration
# For local dev, these are optional - Inngest Dev Server works without them
# For production, get these from https://app.inngest.com
INNGEST_EVENT_KEY=      # Optional for dev, required for prod
INNGEST_SIGNING_KEY=    # Optional for dev, required for prod
```

**6. Local Development:**
```bash
# In a separate terminal, run Inngest Dev Server
npx inngest-cli@latest dev

# Dev server runs at http://localhost:8288
# It auto-discovers your /api/inngest endpoint
```

**7. Verify setup with test function:**
```typescript
// In client.ts, add a simple test function
import { scheduledUserDeletion } from "@/modules/users/jobs/user-deletion.job";

export const functions = [
  scheduledUserDeletion,
  // Add more functions as needed
];
```

**Architecture Note:** Inngest is critical infrastructure for:
- Story 1.9: Scheduled account deletion (7-day grace period)
- Epic 5: AI grading jobs (prevents browser timeouts)
- Future: Email notifications, batch processing

### UI Component Patterns

**Profile Edit Form Layout:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Profile Information</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Avatar upload with preview */}
    <div className="flex items-center gap-4 mb-6">
      <Avatar className="h-20 w-20">...</Avatar>
      <Button variant="outline">Change Photo</Button>
    </div>

    {/* Editable fields */}
    <Form {...form}>
      <FormField name="name" />
      <FormField name="phoneNumber" />
      <FormField name="preferredLanguage" />
    </Form>

    {/* Read-only fields */}
    <div className="mt-4 space-y-2">
      <Label>Email</Label>
      <Input value={user.email} disabled className="bg-muted" />
      <p className="text-xs text-muted-foreground">Contact admin to change email</p>
    </div>
  </CardContent>
</Card>
```

**Password Change Section (collapsible):**
```tsx
<Collapsible>
  <CollapsibleTrigger>
    <Button variant="ghost">Change Password</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <PasswordChangeForm />
  </CollapsibleContent>
</Collapsible>
```

### Firebase Password Change Flow

**IMPORTANT:** `signInWithEmailAndPassword` is a CLIENT SDK function. Backend must use Firebase REST API.

```typescript
// Backend: users.service.ts

// Helper to verify password via Firebase REST API
private async verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY; // Web API Key from Firebase Console

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.message === 'INVALID_PASSWORD') {
      return false;
    }
    throw new Error('Password verification failed');
  }
  return true;
}

async changePassword(userId: string, centerId: string, currentPassword: string, newPassword: string) {
  const user = await this.getUserById(userId, centerId);

  // 0. Check if user has password auth (not Google-only)
  const authUser = await getAuth().getUser(user.firebaseUid);
  const hasPasswordProvider = authUser.providerData.some(p => p.providerId === 'password');
  if (!hasPasswordProvider) {
    throw new Error("Cannot change password for Google-only accounts");
  }

  // 1. Verify current password via Firebase REST API
  const isValid = await this.verifyCurrentPassword(user.email, currentPassword);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // 2. Update password via Admin SDK
  await getAuth().updateUser(user.firebaseUid, { password: newPassword });

  // 3. Revoke all refresh tokens (logs out other sessions)
  await getAuth().revokeRefreshTokens(user.firebaseUid);

  return { message: "Password updated successfully" };
}
```

**Note:** Add `FIREBASE_API_KEY` to `.env` (this is the Web API Key from Firebase Console > Project Settings).

### Account Deletion Flow

**7-Day Grace Period Implementation:**
```typescript
// users.service.ts
async requestDeletion(userId: string, centerId: string) {
  const prisma = getTenantedClient(centerId);

  // Check if user is Owner - Owners cannot delete
  const membership = await prisma.centerMembership.findFirst({
    where: { userId, centerId, role: "OWNER" }
  });
  if (membership?.role === "OWNER") {
    throw new Error("Owners cannot delete their account. Transfer ownership first.");
  }

  // Set deletion timestamp on the user record
  await prisma.user.update({
    where: { id: userId },
    data: { deletionRequestedAt: new Date() }
  });

  // Queue background job to delete after 7 days
  await inngest.send({
    name: "user/deletion.scheduled",
    data: { userId, centerId }
  });

  // Log user out immediately
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.firebaseUid) {
    await getAuth().revokeRefreshTokens(user.firebaseUid);
  }

  return { message: "Account scheduled for deletion in 7 days" };
}

async cancelDeletion(userId: string, centerId: string) {
  const prisma = getTenantedClient(centerId);

  await prisma.user.update({
    where: { id: userId },
    data: { deletionRequestedAt: null }
  });

  // Note: Inngest job will check deletionRequestedAt and skip if null

  return { message: "Account deletion cancelled" };
}
```

### Design System

Follow UX Design Specification patterns:
- Page background: `bg-muted/40`
- Card with `max-w-2xl mx-auto` for profile page (narrower than admin pages)
- Border radius: `0.75rem` (12px)
- Primary color: Royal Blue (#2563EB)
- Form spacing: `space-y-4` between fields
- Avatar size: `h-20 w-20` for profile display

### Security Considerations

- Users can ONLY update their own profile (`/users/me/*` endpoints)
- Password change requires current password verification
- Password change revokes other sessions
- Owners cannot delete their account (must transfer ownership first)
- Account deletion has 7-day grace period with cancellation option
- File uploads validated for type and size on both client and server

### Language Preference Integration

**Note for future Story 8.4 (i18n):**
The `preferredLanguage` field stored here will be consumed by the i18n system in Story 8.4. For now, just store the value. The actual language switching will be implemented later.

```typescript
// Future integration point in i18n story:
const user = useCurrentUser();
i18n.changeLanguage(user.preferredLanguage); // "en" | "vi"
```

### Design Decisions & Clarifications

| Question | Decision |
|----------|----------|
| **Delete Account Scope** | Deletion removes user from CURRENT CENTER only. User remains in other centers if they have multiple memberships. The `deletionRequestedAt` is stored on `User` for simplicity, but the Inngest job only deletes the `CenterMembership` for the requesting center. The `User` record is only deleted if no other memberships exist. |
| **Inngest Setup** | Inngest must be set up as part of this story (Task 0). This is foundational infrastructure that will also support Epic 5 (AI Grading). See "Inngest Setup" section in Dev Notes for complete implementation guide. |
| **Avatar Size Limit** | Keep at 1MB for user avatars (smaller than 2MB center logos). User avatars are displayed at smaller sizes and don't need high resolution. |

### Inngest Job Implementation

**Create `apps/backend/src/modules/users/jobs/user-deletion.job.ts`:**
```typescript
import { inngest } from "@/modules/inngest/client";
import { getTenantedClient } from "@workspace/db";
import { getAuth } from "firebase-admin/auth";

export const scheduledUserDeletion = inngest.createFunction(
  { id: "user-deletion-scheduled" },
  { event: "user/deletion.scheduled" },
  async ({ event, step }) => {
    const { userId, centerId } = event.data;

    await step.sleep("wait-grace-period", "7d");

    // Check if deletion was cancelled
    const prisma = getTenantedClient(centerId);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.deletionRequestedAt) {
      return { status: "cancelled", message: "Deletion was cancelled by user" };
    }

    // Proceed with deletion
    await step.run("delete-user-data", async () => {
      // 1. Delete center membership
      await prisma.centerMembership.deleteMany({ where: { userId, centerId } });

      // 2. Delete user record if no other memberships
      const otherMemberships = await prisma.centerMembership.count({ where: { userId } });
      if (otherMemberships === 0) {
        await prisma.user.delete({ where: { id: userId } });
        // 3. Delete Firebase account
        if (user.firebaseUid) {
          await getAuth().deleteUser(user.firebaseUid);
        }
      }
    });

    return { status: "deleted", userId };
  }
);
```

**Register the job in Inngest client (add to `apps/backend/src/modules/inngest/client.ts`):**
```typescript
import { scheduledUserDeletion } from "@/modules/users/jobs/user-deletion.job";

// Add to functions array
export const functions = [
  // ... existing functions
  scheduledUserDeletion,
];
```

### Testing Inngest Functions

**Unit test pattern for Inngest functions:**
```typescript
// apps/backend/src/modules/users/jobs/user-deletion.job.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("scheduledUserDeletion", () => {
  it("should skip deletion if deletionRequestedAt is null (cancelled)", async () => {
    // Mock the step functions
    const mockStep = {
      sleep: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockImplementation((name, fn) => fn()),
    };

    // Mock prisma to return user with null deletionRequestedAt
    vi.mock("@workspace/db", () => ({
      getTenantedClient: () => ({
        user: {
          findUnique: vi.fn().mockResolvedValue({ deletionRequestedAt: null }),
        },
      }),
    }));

    // Test function logic directly (without Inngest wrapper)
    // ... assert cancellation behavior
  });
});
```

**Integration test with Inngest Dev Server:**
```bash
# Run Inngest dev server, then trigger event manually:
curl -X POST http://localhost:8288/api/events \
  -H "Content-Type: application/json" \
  -d '{"name": "user/deletion.scheduled", "data": {"userId": "test", "centerId": "test"}}'
```

## References

- [Source: epics.md#Story 1.9: User Profile Self-Service]
- [Source: architecture.md#Route-Controller-Service Pattern]
- [Source: architecture.md#Firebase Auth Integration]
- [Source: project-context.md#Multi-Tenancy Enforcement]
- [Source: ux-design-specification.md#Form Patterns]
- [Context: Story 1.8 - Form patterns, Firebase session revocation]
- [Context: Story 1.7 - Password validation rules]
- [Context: Story 1.6 - Firebase Auth patterns]

### Project Structure Notes

- Profile page follows feature-first structure: `apps/webapp/src/features/users/`
- Backend follows module structure: `apps/backend/src/modules/users/`
- Shared types in: `packages/types/src/user.ts`
- Database schema in: `packages/db/prisma/schema.prisma`

### Detected Alignment with Project Context

| Rule | Compliance |
|------|------------|
| Multi-tenancy via getTenantedClient | Yes - all DB operations use tenanted client |
| Type safety via Zod | Yes - all DTOs have Zod schemas |
| Route-Controller-Service | Yes - follows established pattern |
| Firebase Admin for auth ops | Yes - password change uses Admin SDK |
| Co-located tests | Yes - tests next to source files |

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

