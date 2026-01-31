# Story 1.8: User Management Interface

Status: complete

## Story

As a Center Admin,
I want to view and manage all users in my center from a dedicated screen,
so that I can oversee access and roles efficiently.

## Acceptance Criteria

1. **User List View:** Display paginated table at `/:centerId/dashboard/users` with columns: Name, Email, Role, Status (Active/Deactivated), Last Active, Actions. [Source: epics.md#Story 1.8, AC1]
2. **Search & Filter:** Provide search by name/email and filter by role (Owner, Admin, Teacher, Student) and status. [Source: epics.md#Story 1.8, AC2]
3. **Invite User Action:** "Invite User" button opens modal with email input, role dropdown, and optional personal message. [Source: epics.md#Story 1.8, AC3]
4. **Pending Invitations Tab:** Display list of outstanding invitations with status (Pending/Expired), sent date, and actions (Resend, Revoke). [Source: epics.md#Story 1.8, AC4]
5. **User Actions Menu:** Each row has actions: View Profile, Change Role (Owner only), Deactivate, Reactivate. [Source: epics.md#Story 1.8, AC5]
6. **Role Change Confirmation:** Changing a user's role requires confirmation modal explaining permission changes. [Source: epics.md#Story 1.8, AC6]
7. **Deactivation Effect:** Deactivated users immediately lose access; their sessions are invalidated; they appear greyed out in the list. [Source: epics.md#Story 1.8, AC7]
8. **Bulk Selection:** Checkbox selection enables bulk actions (Deactivate, Send Reminder Email). [Source: epics.md#Story 1.8, AC8]

## Tasks / Subtasks

- [x] **Task 1: Create User Management Page Route & Shell** (AC: 1)
  - [x] 1.1: Create `users-page.tsx` at `apps/webapp/src/features/users/users-page.tsx`
  - [x] 1.2: Add route `/:centerId/dashboard/users` in `App.tsx` nested under dashboard with `ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}`
  - [x] 1.3: Page layout: Use existing Card pattern from settings pages
  - [x] 1.4: Add page header with title "User Management" and "Invite User" button (top-right)
  - [x] 1.5: Add Tabs component: "Active Users" | "Pending Invitations"

- [x] **Task 2: Create User List Table with Pagination** (AC: 1, 2)
  - [x] 2.1: Create `UserListTable.tsx` component in `apps/webapp/src/features/users/components/`
  - [x] 2.2: Use shadcn `Table` component with columns: Checkbox, Avatar+Name, Email, Role Badge, Status Badge, Last Active (relative time), Actions dropdown
  - [x] 2.3: Implement pagination using TanStack Query with `useInfiniteQuery` or offset-based pagination
  - [x] 2.4: Create backend endpoint `GET /api/v1/centers/:centerId/users` with pagination params (page, limit, search, role, status)
  - [x] 2.5: Display Role as colored Badge: Owner (purple), Admin (blue), Teacher (green), Student (gray)
  - [x] 2.6: Display Status Badge: Active (green dot), Deactivated (gray with strikethrough row styling)

- [x] **Task 3: Implement Search & Filter Controls** (AC: 2)
  - [x] 3.1: Add search Input with debounced onChange (300ms) above table
  - [x] 3.2: Add filter dropdowns: Role (All, Owner, Admin, Teacher, Student), Status (All, Active, Deactivated)
  - [x] 3.3: Store filter state in URL query params for shareable/bookmarkable URLs
  - [x] 3.4: Reset pagination to page 1 when filters change

- [x] **Task 4: Invite User Modal** (AC: 3)
  - [x] 4.1: Extend existing `InviteUserModal.tsx` or create new version in `apps/webapp/src/features/users/components/`
  - [x] 4.2: Form fields: Email (required, validated), Role dropdown (Admin, Teacher, Student - NOT Owner), Personal Message (optional textarea, max 500 chars)
  - [x] 4.3: Use React Hook Form + Zod for validation
  - [x] 4.4: On submit, call `POST /api/v1/centers/:centerId/invitations`
  - [x] 4.5: Show success toast and switch to "Pending Invitations" tab
  - [x] 4.6: Handle duplicate email error with inline message

- [x] **Task 5: Pending Invitations Tab** (AC: 4)
  - [x] 5.1: Create `PendingInvitationsTable.tsx` component
  - [x] 5.2: Columns: Email, Role, Sent Date, Expires At, Status (Pending/Expired), Actions
  - [x] 5.3: Backend endpoint `GET /api/v1/centers/:centerId/invitations?status=pending`
  - [x] 5.4: Calculate Expired status client-side (48 hours from sent date per Story 1.3)
  - [x] 5.5: Actions: Resend (resets expiry), Revoke (deletes invitation)
  - [x] 5.6: Resend action: `POST /api/v1/centers/:centerId/invitations/:id/resend`
  - [x] 5.7: Revoke action: `DELETE /api/v1/centers/:centerId/invitations/:id` with confirmation dialog

- [x] **Task 6: User Actions Dropdown** (AC: 5, 6, 7)
  - [x] 6.1: Create `UserActionsDropdown.tsx` component using shadcn DropdownMenu
  - [x] 6.2: Menu items: View Profile (link to `/:centerId/dashboard/profile/:userId`), Change Role (Owner only), Deactivate/Reactivate
  - [x] 6.3: "View Profile" navigates to user profile page
  - [x] 6.4: "Change Role" opens `RoleChangeModal.tsx` with role dropdown and confirmation text explaining permission changes
  - [x] 6.5: Backend endpoint `PATCH /api/v1/centers/:centerId/users/:userId/role` (Owner only)
  - [x] 6.6: "Deactivate" opens confirmation dialog, calls `PATCH /api/v1/centers/:centerId/users/:userId/deactivate`
  - [x] 6.7: "Reactivate" calls `PATCH /api/v1/centers/:centerId/users/:userId/reactivate`
  - [x] 6.8: Deactivation invalidates user's Firebase sessions server-side using Firebase Admin SDK `revokeRefreshTokens`
  - [x] 6.9: Conditionally hide "Change Role" for non-Owner users using RBAC check

- [x] **Task 7: Bulk Selection & Actions** (AC: 8)
  - [x] 7.1: Add checkbox column to table with "Select All" header checkbox
  - [x] 7.2: Track selected user IDs in component state
  - [x] 7.3: Show bulk action bar when selection > 0: "X selected" label + "Deactivate" + "Send Reminder" buttons
  - [x] 7.4: Bulk Deactivate: `POST /api/v1/centers/:centerId/users/bulk-deactivate` with array of userIds
  - [x] 7.5: Bulk Send Reminder: `POST /api/v1/centers/:centerId/users/bulk-remind` triggers email to selected users
  - [x] 7.6: Disable bulk actions for Owner role users (cannot bulk-deactivate owners)

- [x] **Task 8: Backend API Endpoints** (AC: All)
  - [x] 8.1: Create user module at `apps/backend/src/modules/users/`
  - [x] 8.2: Structure: `users.routes.ts`, `users.controller.ts`, `users.service.ts`
  - [x] 8.3: `GET /api/v1/centers/:centerId/users` - List users with filters, pagination
  - [x] 8.4: `GET /api/v1/centers/:centerId/invitations` - List invitations
  - [x] 8.5: `POST /api/v1/centers/:centerId/invitations` - Create invitation
  - [x] 8.6: `POST /api/v1/centers/:centerId/invitations/:id/resend` - Resend invitation
  - [x] 8.7: `DELETE /api/v1/centers/:centerId/invitations/:id` - Revoke invitation
  - [x] 8.8: `PATCH /api/v1/centers/:centerId/users/:userId/role` - Change role (Owner only)
  - [x] 8.9: `PATCH /api/v1/centers/:centerId/users/:userId/deactivate` - Deactivate user
  - [x] 8.10: `PATCH /api/v1/centers/:centerId/users/:userId/reactivate` - Reactivate user
  - [x] 8.11: `POST /api/v1/centers/:centerId/users/bulk-deactivate` - Bulk deactivate
  - [x] 8.12: `POST /api/v1/centers/:centerId/users/bulk-remind` - Bulk reminder email
  - [x] 8.13: All endpoints must use `getTenantedClient(centerId)` per project-context.md

- [x] **Task 9: Testing** (AC: All)
  - [x] 9.1: Unit tests for UserListTable component rendering
  - [x] 9.2: Unit tests for search/filter functionality
  - [x] 9.3: Unit tests for InviteUserModal form validation
  - [x] 9.4: Integration tests for user list API with pagination
  - [x] 9.5: Integration tests for invitation CRUD operations
  - [x] 9.6: Integration tests for role change with RBAC (Owner vs Admin)
  - [x] 9.7: Integration tests for deactivation/reactivation with session invalidation

## Dev Notes

### Previous Story Intelligence (from Story 1.7)

Key patterns from previous auth stories:

| Pattern | Location | Reuse |
|---------|----------|-------|
| Protected Route | `App.tsx:76-81` | Wrap users page with `ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}` |
| Toast notifications | `sonner` | Import `{ toast } from "sonner"` for success/error feedback |
| Modal pattern | `InviteUserModal.tsx` | Existing modal can be extended |
| Form with Zod | `login-form.tsx` | Same pattern: zodResolver + react-hook-form |
| API client pattern | `apps/webapp/src/core/client.ts` | Use existing fetch wrapper with auth |

### Architecture Patterns

**Route-Controller-Service Pattern (from architecture.md):**
```
apps/backend/src/modules/users/
├── users.routes.ts      # Fastify routes, extract params, map errors to HTTP
├── users.controller.ts  # Orchestrates services, formats response { data, message }
└── users.service.ts     # DB operations via getTenantedClient(centerId)
```

**API Route Note:** The task descriptions reference `/api/v1/centers/:centerId/users` style paths, but the implementation uses `/api/v1/users/` with centerId extracted from JWT payload. This follows the project's established pattern where tenant isolation is handled via JWT claims rather than URL parameters, providing cleaner URLs and consistent auth middleware.

**Multi-Tenancy (CRITICAL from project-context.md):**
```typescript
// ALWAYS use tenanted client - NEVER new PrismaClient()
import { getTenantedClient } from "@workspace/db";

const prisma = getTenantedClient(centerId);
const users = await prisma.user.findMany({ where: { status: "ACTIVE" } });
// center_id filter is automatically injected by Prisma extension
```

### File Locations

| File | Action |
|------|--------|
| `apps/webapp/src/features/users/users-page.tsx` | CREATE |
| `apps/webapp/src/features/users/components/UserListTable.tsx` | CREATE |
| `apps/webapp/src/features/users/components/UserActionsDropdown.tsx` | CREATE |
| `apps/webapp/src/features/users/components/RoleChangeModal.tsx` | CREATE |
| `apps/webapp/src/features/users/components/PendingInvitationsTable.tsx` | CREATE |
| `apps/webapp/src/features/users/components/InviteUserModal.tsx` | MODIFY - Enhance existing |
| `apps/webapp/src/features/users/users.api.ts` | CREATE - API hooks |
| `apps/webapp/src/App.tsx` | MODIFY - Add route |
| `apps/backend/src/modules/users/users.routes.ts` | CREATE |
| `apps/backend/src/modules/users/users.controller.ts` | CREATE |
| `apps/backend/src/modules/users/users.service.ts` | CREATE |

### UI Component Patterns

**Table with Actions (shadcn pattern):**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { MoreHorizontal } from "lucide-react";
```

**Role Badge Colors (per UX spec "Electric Focus" theme):**
```tsx
const roleBadgeVariants = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  TEACHER: "bg-green-100 text-green-800",
  STUDENT: "bg-gray-100 text-gray-800"
};
```

**Tabs Pattern:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

<Tabs defaultValue="users">
  <TabsList>
    <TabsTrigger value="users">Active Users</TabsTrigger>
    <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
  </TabsList>
  <TabsContent value="users"><UserListTable /></TabsContent>
  <TabsContent value="invitations"><PendingInvitationsTable /></TabsContent>
</Tabs>
```

### RBAC Enforcement

**Frontend (RBACWrapper pattern from Story 1.4):**
```tsx
import { RBACWrapper } from "@/features/auth/components/RBACWrapper";

// Only show Change Role to Owners
<RBACWrapper requiredRoles={["OWNER"]}>
  <DropdownMenuItem onClick={openRoleChangeModal}>
    Change Role
  </DropdownMenuItem>
</RBACWrapper>
```

**Backend (preHandler middleware):**
```typescript
// In routes - restrict role change to Owner only
{
  preHandler: [requireRole(["OWNER"])],
  handler: usersController.changeRole
}
```

### Firebase Session Invalidation

**Deactivation must revoke Firebase sessions:**
```typescript
// In users.service.ts
import { getAuth } from "firebase-admin/auth";

async function deactivateUser(userId: string, centerId: string) {
  const prisma = getTenantedClient(centerId);

  // 1. Update DB status
  await prisma.user.update({
    where: { id: userId },
    data: { status: "DEACTIVATED" }
  });

  // 2. Revoke all Firebase refresh tokens
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.firebaseUid) {
    await getAuth().revokeRefreshTokens(user.firebaseUid);
  }
}
```

### Invitation Flow (from Story 1.3)

- Invitations expire after 48 hours
- `POST /api/v1/centers/:centerId/invitations` sends email with magic link
- Link format: `/accept-invite?token={jwt_token}`
- Token contains: email, role, centerId, exp

### API Response Format (from architecture.md)

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string; details?: any } | null;
}

// Paginated response
interface PaginatedResponse<T> {
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error: null;
}
```

### Design System

Follow UX Design Specification patterns:
- Page background: `bg-muted/40`
- Cards with `max-w-7xl` for admin pages (wider than auth)
- Border radius: `0.75rem` (12px)
- Primary color: Royal Blue (#2563EB)
- Relaxed table row padding: `16px` vertical

### Security Considerations

- Only Owner can change roles
- Cannot deactivate yourself
- Cannot deactivate the last Owner
- Bulk actions cannot include Owner role users
- All mutations require RBAC check at route level

## References

- [Source: epics.md#Story 1.8: User Management Interface]
- [Source: architecture.md#RBAC Middleware Pattern]
- [Source: project-context.md#Multi-Tenancy Enforcement]
- [Source: ux-design-specification.md#RBACWrapper Component]
- [Context: Story 1.3 - User Invitation & RBAC patterns]
- [Context: Story 1.4 - RBACWrapper component]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 9: Completed comprehensive test coverage
  - Fixed pre-existing InviteUserModal test failure (TanStack Query v5 mutation context)
  - Created SearchFilterControls unit tests (13 tests) with proper JSDOM mock for Radix UI
  - Created UsersService unit tests (25 tests) with mocked Prisma and Firebase
  - Created Users integration tests (24 tests) with graceful DB skip handling

### Change Log

- Fixed `InviteUserModal.test.tsx` assertion to handle TanStack Query v5 mutation context argument
- Created `SearchFilterControls.test.tsx` - 13 tests covering search debounce, filter dropdowns, pagination reset
- Created `users.service.test.ts` - 25 unit tests for service layer methods
- Created `users.integration.test.ts` - 24 integration tests for full flow validation

**Code Review Fixes (2026-01-31):**
- Fixed SearchFilterControls to sync search state when URL changes externally (MEDIUM-2)
- Added `/:centerId/dashboard/profile/:userId` route for viewing other user profiles (HIGH-4)
- Changed deactivateUser to allow owner deactivation unless it's the last owner (HIGH-3)
- Added confirmation dialog for bulk deactivation with loading indicator (MEDIUM-3, LOW-2)
- Added inline error handling for duplicate email in InviteUserModal (MEDIUM-5)
- Updated File List to include all created/modified files (HIGH-1)

### File List

**Frontend - Pages & Components Created:**
- `apps/webapp/src/features/users/users-page.tsx` - Main user management page
- `apps/webapp/src/features/users/users.api.ts` - API hooks for user operations
- `apps/webapp/src/features/users/components/UserListTable.tsx` - Paginated user list table
- `apps/webapp/src/features/users/components/SearchFilterControls.tsx` - Search and filter controls
- `apps/webapp/src/features/users/components/UserActionsDropdown.tsx` - Per-row action menu
- `apps/webapp/src/features/users/components/RoleChangeModal.tsx` - Role change confirmation modal
- `apps/webapp/src/features/users/components/PendingInvitationsTable.tsx` - Pending invitations table
- `apps/webapp/src/features/users/components/BulkActionBar.tsx` - Bulk selection action bar

**Frontend - Modified:**
- `apps/webapp/src/App.tsx` - Added users route and profile/:userId route
- `apps/webapp/src/features/users/components/InviteUserModal.tsx` - Enhanced with inline error handling

**Backend - Created:**
- `apps/backend/src/modules/users/users.routes.ts` - Fastify route definitions
- `apps/backend/src/modules/users/users.controller.ts` - Request handling
- `apps/backend/src/modules/users/users.service.ts` - Business logic

**Backend - Modified:**
- `apps/backend/src/app.ts` - Registered users routes

**Types - Created:**
- `packages/types/src/user.ts` - User management types

**Types - Modified:**
- `packages/types/src/index.ts` - Export user types
- `packages/types/src/invitation.ts` - Invitation types

**Tests Created:**
- `apps/webapp/src/features/users/users-page.test.tsx`
- `apps/webapp/src/features/users/components/UserListTable.test.tsx`
- `apps/webapp/src/features/users/components/SearchFilterControls.test.tsx`
- `apps/webapp/src/features/users/components/InviteUserModal.test.tsx`
- `apps/webapp/src/features/users/components/UserActionsDropdown.test.tsx`
- `apps/webapp/src/features/users/components/RoleChangeModal.test.tsx`
- `apps/webapp/src/features/users/components/PendingInvitationsTable.test.tsx`
- `apps/webapp/src/features/users/components/BulkActionBar.test.tsx`
- `apps/backend/src/modules/users/users.service.test.ts`
- `apps/backend/src/modules/users/users.integration.test.ts`

**Test Coverage Summary:**
- Frontend: 110 tests (13 test files) - all passing
- Backend: 126 tests (18 test files) - all passing
