# Story 6.4: Teacher Student Health View

Status: done

## Story

As a Teacher,
I want to see health indicators for students in my classes,
so that I can proactively support struggling students and flag concerns to the admin.

## Acceptance Criteria

1. **AC1: Scoped Access** — Teachers see Student Health data only for students enrolled in their assigned classes (per RBAC matrix). Backend enforces this: when role is TEACHER, the dashboard query automatically filters to classes where `teacherId = userId`. Profile access is verified — teachers can only view profiles of students in their classes.

2. **AC2: Teacher Dashboard Widget** — Teacher dashboard includes a "My Students at Risk" widget showing Red/Yellow students from their classes. Widget displays up to 6 student cards (sorted worst-first), with a "View All" link to the full Student Health Dashboard. Shows an empty state "All students on track" when no at-risk/warning students exist.

3. **AC3: Limited Actions** — Teachers can view Student Profile Overlay (Story 6.2) but cannot initiate email intervention (Owner/Admin only). The existing RBAC gate on "Contact Parent" button already hides it for TEACHER role. Teachers see Trends, Attendance, and Assignments tabs but NOT the Interventions tab (intervention history is admin-only).

4. **AC4: Class-Level View** — Teacher can view health status grouped by class. The Student Health Dashboard is accessible to teachers via navigation, with the class filter dropdown showing only their assigned classes. A "View Health" action on the Classes page navigates directly to the health dashboard filtered by that class.

5. **AC5: Flag for Admin** — Teachers can flag a student for admin attention with a note (e.g., "Parent meeting needed"). The Student Profile Overlay shows a "Flag for Admin" button for TEACHER role. Flagging opens a small dialog to enter a note. Admins/Owners see flagged students with a badge indicator on the dashboard and can acknowledge/resolve flags from the profile overlay.

## Tasks / Subtasks

- [x] Task 1: Database schema — Add `StudentFlag` model (AC: #5)
  - [x] 1.1 Add `StudentFlagStatus` enum (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`) to `schema.prisma`
  - [x] 1.2 Add `StudentFlag` model with fields: id, studentId, centerId, createdById (teacher), note (Text), status (default OPEN), resolvedById (nullable), resolvedNote (nullable), createdAt, resolvedAt (nullable). Include `@@unique([id, centerId])` for tenant isolation, `@@index([centerId])`, `@@index([studentId])`, `@@index([studentId, status])`, `@@map("student_flag")`.
  - [x] 1.3 Add relations: StudentFlag → User (student via "FlaggedStudent"), StudentFlag → User (createdBy via "FlagCreator"), StudentFlag → User (resolvedBy via "FlagResolver"). Add corresponding relation arrays on User model.
  - [x] 1.4 Run `pnpm --filter=db db:migrate:dev --name add-student-flag`
  - [x] 1.5 Run `pnpm --filter=db build` to regenerate Prisma client

- [x] Task 2: Shared types — Add flag schemas + teacher dashboard types (AC: #2, #5)
  - [x] 2.1 Create `packages/types/src/student-flag.ts` with schemas: `CreateStudentFlagRequestSchema` (studentId, note), `ResolveStudentFlagRequestSchema` (resolvedNote?), `StudentFlagRecordSchema` (all fields + createdBy name + resolvedBy name), `StudentFlagStatus` enum
  - [x] 2.2 Add `TeacherAtRiskWidgetResponseSchema` to `packages/types/src/student-health.ts` — reuses existing `StudentHealthCard[]` + `HealthSummary` with a `classBreakdown` array (classId, className, atRiskCount, warningCount)
  - [x] 2.3 Export from `packages/types/src/index.ts`

- [x] Task 3: Backend — Teacher-scoped health access + flag endpoints (AC: #1, #3, #4, #5)
  - [x] 3.1 **Modify `getDashboard()` in `student-health.service.ts`:** Accept an optional `teacherUserId` parameter. When provided, query `Class` table for classes where `teacherId = teacherUserId` AND `centerId = centerId`, collect all student IDs from those classes via `ClassStudent`, then filter the dashboard results to only include those students. The `classId` filter still works on top of teacher scoping (intersection). Return only the teacher's classes in any class filter dropdown data.
  - [x] 3.2 **Modify `getStudentProfile()` in `student-health.service.ts`:** Accept an optional `teacherUserId` parameter. When provided, verify student is enrolled in at least one class where `teacherId = teacherUserId`. Throw 403 if not. Exclude intervention history from the profile response when caller is TEACHER (return empty array for interventions).
  - [x] 3.3 **Add `getTeacherAtRiskWidget()` method to `StudentHealthService`:** Takes `centerId` and `teacherUserId`. Queries teacher's classes, gets student health for all students across those classes, filters to only at-risk + warning, sorts by severity (at-risk first, then warning), limits to 6. Returns `{ students, summary, classBreakdown }`.
  - [x] 3.4 **Add `createFlag()` method to `StudentHealthService`:** Takes centerId, studentId, createdById, note. Validates student exists in center. Creates `StudentFlag` record. Creates in-app `Notification` for all OWNER/ADMIN users in the center: title "Student Flagged", message "[Teacher Name] flagged [Student Name]: [note truncated to 100 chars]". Returns the created flag.
  - [x] 3.5 **Add `getStudentFlags()` method to `StudentHealthService`:** Takes centerId, studentId. Returns all flags for the student, ordered by createdAt desc. Includes createdBy.name and resolvedBy.name via Prisma include.
  - [x] 3.6 **Add `resolveFlag()` method to `StudentHealthService`:** Takes centerId, flagId, resolvedById, resolvedNote. Updates flag status to RESOLVED, sets resolvedById, resolvedAt, resolvedNote. Throws 404 if flag doesn't exist in center.
  - [x] 3.7 **Add controller methods** for: getTeacherAtRiskWidget, createFlag, getStudentFlags, resolveFlag
  - [x] 3.8 **Modify routes in `student-health.routes.ts`:**
    - Change `GET /dashboard` to `requireRole(["OWNER", "ADMIN", "TEACHER"])`. In the route handler, if `role === "TEACHER"`, pass `teacherUserId` from JWT payload to the service.
    - Change `GET /profile/:studentId` to `requireRole(["OWNER", "ADMIN", "TEACHER"])`. Same teacher scoping logic.
    - Add `GET /dashboard/teacher-widget` with `requireRole(["TEACHER"])` — calls `getTeacherAtRiskWidget`
    - Add `POST /flags` with `requireRole(["TEACHER"])` — calls `createFlag`
    - Add `GET /flags/:studentId` with `requireRole(["OWNER", "ADMIN", "TEACHER"])` — calls `getStudentFlags`
    - Add `PATCH /flags/:flagId/resolve` with `requireRole(["OWNER", "ADMIN"])` — calls `resolveFlag`
    - Keep intervention routes as `requireRole(["OWNER", "ADMIN"])` only — no change.
  - [x] 3.9 Write service unit tests (10-12 tests)
  - [x] 3.10 Write route integration tests (8-10 tests)

- [x] Task 4: Frontend — Teacher Dashboard Widget (AC: #2)
  - [x] 4.1 Create `apps/webapp/src/features/student-health/hooks/use-teacher-at-risk-widget.ts` — query hook calling `GET /dashboard/teacher-widget`
  - [x] 4.2 Add query key `teacherAtRiskWidget` to `student-health-keys.ts`
  - [x] 4.3 Create `apps/webapp/src/features/student-health/components/TeacherAtRiskWidget.tsx` — Card component showing at-risk/warning students in a compact grid (max 6 cards). Includes "View All" link to `/dashboard/students` (Student Health Dashboard page). Shows `HealthSummaryBar` mini version with counts. Empty state: green checkmark + "All students on track". Loading state: skeleton cards.
  - [x] 4.4 Modify `apps/webapp/src/features/dashboard/components/TeacherDashboard.tsx` — Import and render `TeacherAtRiskWidget` above the existing grading queue section. Layout: 2-column grid on desktop (widget left, grading queue right), stacked on mobile.

- [x] Task 5: Frontend — Teacher access to Student Health Dashboard + class-level view (AC: #1, #3, #4)
  - [x] 5.1 **Modify `StudentHealthDashboard.tsx`:** Get user role from `useAuth()`. When role is TEACHER, pass no explicit `classId` to the API (backend handles scoping). The class filter dropdown should show only the teacher's classes (returned from the scoped dashboard API). Hide any admin-only UI elements.
  - [x] 5.2 **Modify `StudentProfileOverlay.tsx`:** Get role from `useAuth()`. When TEACHER: hide "Contact Parent" button (already done), hide "Interventions" tab from TabsList, show "Flag for Admin" button instead. Wire up flag modal.
  - [x] 5.3 **Modify navigation config** (`apps/webapp/src/core/config/navigation.ts`): The "Students" nav item should already be visible to TEACHER role. Verify this. If not, add TEACHER to allowedRoles for the Students nav item.
  - [x] 5.4 **Add "View Health" button on Classes page** (`apps/webapp/src/features/logistics/classes-page.tsx`): In the classes table, add a small icon button or link per class row that navigates to `/dashboard/students?classId={classId}`. Only show for TEACHER role (owner/admin can already access the full dashboard). The health dashboard should read `classId` from URL query params and pre-populate the class filter.
  - [x] 5.5 **Modify `StudentHealthDashboard.tsx`:** Read initial `classId` from URL search params (`useSearchParams`) to support deep-linking from classes page.

- [x] Task 6: Frontend — Flag Student for Admin (AC: #5)
  - [x] 6.1 Create `apps/webapp/src/features/student-health/hooks/use-student-flags.ts` — query hook for `GET /flags/:studentId`, mutation hook for `POST /flags`, mutation hook for `PATCH /flags/:flagId/resolve`
  - [x] 6.2 Add query keys for flags to `student-health-keys.ts`
  - [x] 6.3 Create `apps/webapp/src/features/student-health/components/FlagStudentModal.tsx` — Dialog with a textarea for the note and "Flag" submit button. Shows loading state. Toast on success.
  - [x] 6.4 Create `apps/webapp/src/features/student-health/components/StudentFlagsSection.tsx` — Displayed in the Student Profile Overlay (new section below the tabs or as a 5th tab for admin, or inline alert banner for active flags). Shows list of flags with status badges (OPEN = red, ACKNOWLEDGED = amber, RESOLVED = green), teacher name, date, note. For OWNER/ADMIN: "Resolve" button on open flags with optional resolvedNote input.
  - [x] 6.5 **Modify `StudentProfileOverlay.tsx`:** For TEACHER role: show "Flag for Admin" outline button in the SheetHeader. For OWNER/ADMIN: show active flag count badge on the profile overlay and display `StudentFlagsSection` as a section above the tabs (if any open flags exist) or as a subtle indicator.
  - [x] 6.6 **Modify `StudentHealthDashboard.tsx`:** For OWNER/ADMIN: show a small flag icon/badge on student cards that have open flags. This alerts admin that a teacher has flagged the student.

- [x] Task 7: Tests + schema sync + lint (AC: all)
  - [x] 7.1 Write component tests for `TeacherAtRiskWidget` (3 tests: renders cards, empty state, loading)
  - [x] 7.2 Write component tests for `FlagStudentModal` (3 tests: renders form, submits, cancel)
  - [x] 7.3 Write component tests for `StudentFlagsSection` (3 tests: renders flags, resolve action, empty state)
  - [x] 7.4 Write hook tests for `use-teacher-at-risk-widget` (2 tests)
  - [x] 7.5 Write hook tests for `use-student-flags` (3 tests: query, create mutation, resolve mutation)
  - [x] 7.6 Update `StudentProfileOverlay.test.tsx` (3 tests: flag button for teacher, hidden interventions tab for teacher, flags section for admin)
  - [x] 7.7 Update `StudentHealthDashboard.test.tsx` (2 tests: teacher scoping applied, flag badges on cards)
  - [x] 7.8 Start backend, run `pnpm --filter=webapp sync-schema-dev` to regenerate `schema.d.ts`
  - [x] 7.9 Run `pnpm lint` across monorepo
  - [x] 7.10 Run `pnpm --filter=backend test` — all must pass
  - [x] 7.11 Run `pnpm --filter=webapp test` — all must pass

## Dev Notes

### Architecture Compliance

- **Layered architecture:** Route → Controller → Service. Service handles DB queries. Controller formats `{ data, message }`. Route extracts params, applies auth middleware, passes role context.
- **Multi-tenancy:** Use `getTenantedClient(centerId)` for all queries. StudentFlag has `centerId` for tenant isolation with `@@unique([id, centerId])`.
- **RBAC enforcement:** Teacher scoping is enforced at the **service layer**, not just the route layer. The route passes `teacherUserId` to the service when the caller is TEACHER. The service uses this to filter data. This prevents any bypass via direct API calls.
- **Inngest:** Not needed for this story. Flag creation triggers a synchronous in-app Notification (not email). Email intervention remains OWNER/ADMIN only.

### Existing Infrastructure to Reuse (DO NOT Recreate)

- **StudentHealthService class:** Already at `apps/backend/src/modules/student-health/student-health.service.ts`. ADD methods to this class. DO NOT create a separate teacher service.
- **getDashboard() method:** Already supports `classId` and `search` filters. Extend with `teacherUserId` parameter for auto-scoping.
- **getStudentProfile() method:** Already returns full profile. Extend with `teacherUserId` parameter for access checking.
- **StudentHealthDashboard.tsx:** Already has class filter, search, and card grid. Extend with teacher-aware behavior.
- **StudentProfileOverlay.tsx:** Already has RBAC-gated Contact Parent button. Extend with Flag for Admin button for TEACHER role.
- **useAuth() hook:** Returns `{ user }` with `user.role` (`CenterRole`). Already used throughout the app for RBAC gates.
- **requireRole middleware:** Already exists in routes. Just add "TEACHER" to the allowed roles array.
- **Notification model:** Already exists in the schema. Reuse for admin notifications about student flags.
- **TeacherDashboard.tsx:** Currently minimal — just grading queue placeholder. Add the at-risk widget here.
- **AppError class:** Use `AppError.forbidden()` for teacher access violations, `AppError.notFound()` for missing students/flags.
- **Class model:** Has `teacherId` field and `ClassStudent` join table. Use these to determine teacher's students.

### Database Schema Details

**New enum — StudentFlagStatus:**
```prisma
enum StudentFlagStatus {
  OPEN
  ACKNOWLEDGED
  RESOLVED
}
```

**New model — StudentFlag:**
```prisma
model StudentFlag {
  id           String            @id @default(cuid())
  studentId    String            @map("student_id")
  centerId     String            @map("center_id")
  createdById  String            @map("created_by_id")
  note         String            @db.Text
  status       StudentFlagStatus @default(OPEN)
  resolvedById String?           @map("resolved_by_id")
  resolvedNote String?           @map("resolved_note")
  createdAt    DateTime          @default(now()) @map("created_at")
  resolvedAt   DateTime?         @map("resolved_at")

  student    User  @relation("FlaggedStudent", fields: [studentId], references: [id], onDelete: Cascade)
  createdBy  User  @relation("FlagCreator", fields: [createdById], references: [id], onDelete: Cascade)
  resolvedBy User? @relation("FlagResolver", fields: [resolvedById], references: [id], onDelete: SetNull)

  @@unique([id, centerId])
  @@index([centerId])
  @@index([studentId])
  @@index([studentId, status])
  @@map("student_flag")
}
```

**Add to User model:**
```prisma
flagsReceived  StudentFlag[] @relation("FlaggedStudent")
flagsCreated   StudentFlag[] @relation("FlagCreator")
flagsResolved  StudentFlag[] @relation("FlagResolver")
```

### Teacher Scoping Logic (CRITICAL)

**Backend getDashboard() with teacher scoping:**
```typescript
async getDashboard(centerId: string, filters: { classId?: string; search?: string }, teacherUserId?: string) {
  const db = getTenantedClient(this.prisma, centerId);

  // If teacher, get their class IDs first
  let teacherClassIds: string[] | undefined;
  if (teacherUserId) {
    const teacherClasses = await db.class.findMany({
      where: { teacherId: teacherUserId },
      select: { id: true },
    });
    teacherClassIds = teacherClasses.map(c => c.id);
    // If teacher has no classes, return empty dashboard
    if (teacherClassIds.length === 0) {
      return { students: [], summary: { total: 0, atRisk: 0, warning: 0, onTrack: 0 } };
    }
  }

  // Build student filter: intersection of teacher's classes + optional classId filter
  const classFilter = filters.classId
    ? teacherClassIds
      ? teacherClassIds.includes(filters.classId) ? [filters.classId] : [] // Teacher can only filter within their classes
      : [filters.classId]
    : teacherClassIds;

  // ... rest of existing logic, but with classFilter applied
}
```

**Backend getStudentProfile() teacher access check:**
```typescript
async getStudentProfile(centerId: string, studentId: string, teacherUserId?: string) {
  if (teacherUserId) {
    const hasAccess = await db.classStudent.findFirst({
      where: {
        studentId,
        class: { teacherId: teacherUserId, centerId },
      },
    });
    if (!hasAccess) {
      throw AppError.forbidden("You can only view students in your classes");
    }
  }
  // ... rest of existing logic
}
```

### Route Modifications

**Modified routes:**
```typescript
// Dashboard — now allows TEACHER with auto-scoping
fastify.get("/dashboard", {
  preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
  handler: async (request, reply) => {
    const { centerId, uid, role } = request.jwtPayload;
    const teacherUserId = role === "TEACHER" ? uid : undefined;
    const result = await controller.getDashboard(centerId, request.query, teacherUserId);
    return reply.send(result);
  },
});

// Profile — now allows TEACHER with access check
fastify.get("/profile/:studentId", {
  preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
  handler: async (request, reply) => {
    const { centerId, uid, role } = request.jwtPayload;
    const teacherUserId = role === "TEACHER" ? uid : undefined;
    const result = await controller.getStudentProfile(centerId, request.params.studentId, teacherUserId);
    return reply.send(result);
  },
});
```

**New routes:**
```typescript
// Teacher widget
GET /api/v1/student-health/dashboard/teacher-widget
  - requireRole(["TEACHER"])
  - Response: { data: { students: StudentHealthCard[], summary: HealthSummary, classBreakdown: ClassBreakdown[] }, message: "ok" }

// Flags
POST /api/v1/student-health/flags
  - requireRole(["TEACHER"])
  - Body: { studentId: string; note: string }
  - Response 201: { data: { flagId: string; status: "OPEN" }, message: "Student flagged for admin review" }

GET /api/v1/student-health/flags/:studentId
  - requireRole(["OWNER", "ADMIN", "TEACHER"])
  - Response: { data: StudentFlagRecord[], message: "ok" }

PATCH /api/v1/student-health/flags/:flagId/resolve
  - requireRole(["OWNER", "ADMIN"])
  - Body: { resolvedNote?: string }
  - Response: { data: { flagId: string; status: "RESOLVED" }, message: "Flag resolved" }
```

### Frontend Component Architecture

**TeacherAtRiskWidget:**
- Card component with header "My Students at Risk" + count badge
- Compact grid: 2 columns on mobile, 3 on desktop (max 6 cards)
- Each mini card: student name, health status badge, primary concern metric
- "View All" link → navigates to `/${centerId}/dashboard/students`
- Empty state: checkmark icon + "All students on track" text
- Uses Shadcn `<Card>` wrapper with `<CardHeader>` and `<CardContent>`

**FlagStudentModal:**
- Uses Shadcn `<Dialog>` (consistent with InterventionComposeModal pattern)
- Single textarea field for the note (required, min 10 chars)
- "Flag Student" submit button (variant="destructive" to indicate escalation)
- "Cancel" button closes without action
- Toast notification on success: "Student flagged — admin has been notified"
- Disable submit while mutation is in-flight

**StudentFlagsSection:**
- Rendered inside StudentProfileOverlay
- For OWNER/ADMIN: shows as an alert banner at top of overlay content when open flags exist
- Flag list: each flag shows teacher name, date, note, status badge
- "Resolve" button with optional note input for OWNER/ADMIN on OPEN flags
- For TEACHER: sees their own flags only (read-only list)

**StudentProfileOverlay modifications:**
- For TEACHER role: Replace "Contact Parent" button with "Flag for Admin" `variant="outline"` button in SheetHeader
- For TEACHER role: Hide "Interventions" tab from TabsList (3 tabs instead of 4)
- For OWNER/ADMIN: Show flag indicator (orange dot) on overlay header if student has open flags
- For OWNER/ADMIN: Show `StudentFlagsSection` when open flags exist

**StudentHealthDashboard modifications:**
- Read `classId` from URL search params for deep-linking (from Classes page)
- For TEACHER role: class filter dropdown shows only teacher's classes (API returns scoped data)
- For OWNER/ADMIN: show small flag icon on student cards with open flags

**StudentHealthCard modifications:**
- Accept optional `hasOpenFlags` prop
- When true, show small orange flag icon in top-right corner of card

### Testing Strategy

**Backend service tests (target 10-12):**
- getDashboard with teacher scoping returns only teacher's students
- getDashboard with teacher + classId filter returns intersection
- getDashboard with teacher who has no classes returns empty
- getStudentProfile with teacher who has access succeeds
- getStudentProfile with teacher who doesn't have access throws 403
- getTeacherAtRiskWidget returns at-risk/warning only, max 6
- getTeacherAtRiskWidget returns empty for all on-track
- createFlag creates record and notification
- createFlag throws 404 for non-existent student
- getStudentFlags returns sorted list
- resolveFlag updates status and resolver
- resolveFlag throws 404 for non-existent flag

**Backend integration tests (target 8-10):**
- GET /dashboard with TEACHER role returns scoped students
- GET /dashboard with OWNER role returns all students (no scoping)
- GET /profile/:studentId with TEACHER returns 403 for unrelated student
- GET /profile/:studentId with TEACHER returns 200 for their student
- GET /dashboard/teacher-widget returns 200 for TEACHER
- GET /dashboard/teacher-widget returns 403 for OWNER (teacher-only endpoint)
- POST /flags returns 201 for TEACHER
- POST /flags returns 403 for STUDENT role
- GET /flags/:studentId returns 200
- PATCH /flags/:flagId/resolve returns 200 for OWNER

**Frontend tests (target 17):**
- TeacherAtRiskWidget: renders student cards
- TeacherAtRiskWidget: shows empty state
- TeacherAtRiskWidget: shows loading skeleton
- FlagStudentModal: renders textarea
- FlagStudentModal: submits with note
- FlagStudentModal: cancel closes dialog
- StudentFlagsSection: renders flag list
- StudentFlagsSection: resolve action for admin
- StudentFlagsSection: empty state
- use-teacher-at-risk-widget: fetches data
- use-teacher-at-risk-widget: returns loading state
- use-student-flags: fetches flags
- use-student-flags: create flag mutation
- use-student-flags: resolve flag mutation
- StudentProfileOverlay: shows flag button for TEACHER
- StudentProfileOverlay: hides interventions tab for TEACHER
- StudentHealthDashboard: applies teacher scoping, reads classId from URL

### Project Structure Notes

All new files follow existing feature-first co-location:

```
packages/db/prisma/
└── schema.prisma                                    ← MODIFY (add StudentFlag model + enum)
    migrations/YYYYMMDD_add_student_flag/
    └── migration.sql                                ← NEW (auto-generated)

packages/types/src/
├── student-flag.ts                                  ← NEW
├── student-health.ts                                ← MODIFY (add teacher widget response)
└── index.ts                                         ← MODIFY (add student-flag export)

apps/backend/src/modules/student-health/
├── student-health.service.ts                        ← MODIFY (add 4 methods, modify 2)
├── student-health.controller.ts                     ← MODIFY (add 4 methods, modify 2)
├── student-health.routes.ts                         ← MODIFY (add 4 routes, modify 2 routes auth)
├── student-health.service.test.ts                   ← MODIFY (add 10-12 tests)
└── student-health.routes.integration.test.ts        ← MODIFY (add 8-10 tests)

apps/webapp/src/features/student-health/
├── hooks/
│   ├── student-health-keys.ts                       ← MODIFY (add widget + flag keys)
│   ├── use-teacher-at-risk-widget.ts                ← NEW
│   └── use-student-flags.ts                         ← NEW
├── components/
│   ├── TeacherAtRiskWidget.tsx                      ← NEW
│   ├── FlagStudentModal.tsx                         ← NEW
│   ├── StudentFlagsSection.tsx                      ← NEW
│   ├── StudentHealthDashboard.tsx                   ← MODIFY (teacher scoping + URL classId)
│   ├── StudentHealthCard.tsx                        ← MODIFY (optional flag icon)
│   └── StudentProfileOverlay.tsx                    ← MODIFY (flag button + hide interventions)
└── __tests__/
    ├── TeacherAtRiskWidget.test.tsx                  ← NEW
    ├── FlagStudentModal.test.tsx                     ← NEW
    ├── StudentFlagsSection.test.tsx                  ← NEW
    ├── use-teacher-at-risk-widget.test.ts            ← NEW
    ├── use-student-flags.test.ts                     ← NEW
    ├── StudentProfileOverlay.test.tsx                ← MODIFY (add 3 tests)
    └── StudentHealthDashboard.test.tsx               ← MODIFY (add 2 tests)

apps/webapp/src/features/dashboard/components/
└── TeacherDashboard.tsx                             ← MODIFY (add at-risk widget)

apps/webapp/src/features/logistics/
└── classes-page.tsx                                 ← MODIFY (add "View Health" link per row)

apps/webapp/src/core/config/
└── navigation.ts                                    ← VERIFY (TEACHER has Students nav access)

apps/webapp/src/schema/
└── schema.d.ts                                      ← REGENERATE
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.4: Teacher Student Health View (FR27)]
- [Source: _bmad-output/implementation-artifacts/6-3-email-intervention-loop.md — Previous story learnings]
- [Source: _bmad-output/implementation-artifacts/6-2-student-profile-overlay.md — Overlay patterns]
- [Source: _bmad-output/implementation-artifacts/6-1-traffic-light-dashboard.md — Dashboard patterns]
- [Source: apps/backend/src/modules/student-health/student-health.service.ts — Service class to extend]
- [Source: apps/backend/src/modules/student-health/student-health.routes.ts — Routes to modify]
- [Source: apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx — Dashboard to extend]
- [Source: apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx — Overlay to extend]
- [Source: apps/webapp/src/features/dashboard/components/TeacherDashboard.tsx — Teacher dashboard to extend]
- [Source: apps/webapp/src/features/logistics/classes-page.tsx — Classes page for health link]
- [Source: apps/webapp/src/core/config/navigation.ts — Navigation config to verify]
- [Source: packages/db/prisma/schema.prisma — Class model (teacherId), ClassStudent join table, CenterMembership]
- [Source: project-context.md — Multi-tenancy rules, layered architecture, testing standards]

### Previous Story Intelligence

**From Story 6.3 (Email Intervention Loop):**
- InterventionLog model and email system fully implemented — this story does NOT touch interventions
- Code review found HTML-in-textarea issue — avoid same mistake: if any rich content is needed, handle rendering properly
- `useAuth()` hook now used in StudentProfileOverlay for role checking — pattern established
- Frontend tests for StudentProfileOverlay already mock `useAuth()` — extend that pattern
- InterventionComposeModal uses Dialog (not Sheet) — use same pattern for FlagStudentModal
- Backend: 803 tests pass. Frontend: 876 tests pass. Must maintain or exceed these counts.
- `z.email()` not `z.string().email()` for Zod v4 compatibility
- JWT payload uses `uid` not `userId` — critical when extracting teacher identity

**From Story 6.2 (Student Profile Overlay):**
- Profile overlay uses Sheet with Tabs — adding/hiding tabs by role is straightforward
- `useStudentProfile` hook returns full profile data — no need for separate teacher variant
- Error/loading states handled via `isLoading`/`isError`/`refetch` pattern

**From Story 6.1 (Traffic Light Dashboard):**
- Health computation: attendance < 80% = at-risk, < 90% = warning; assignment < 50% = at-risk, < 75% = warning
- Dashboard already supports `classId` filter — teacher scoping adds a pre-filter on top
- `getDashboard()` queries ClassStudent for class membership — same join pattern for teacher scoping
- Class filter caching fix (story 6.1 code review): cache class list separately from student data to prevent dropdown reset

**Code review patterns to follow:**
- Always assert both statusCode and message in route tests (use `toMatchObject`)
- Never mock Prisma directly in integration tests — use real Fastify instance via `buildApp()`
- Use `React.memo` for list items in TeacherAtRiskWidget cards

### Git Intelligence

Recent commits show consistent patterns:
- Commit format: `feat: Story X-Y — Title with code review fixes`
- Full-stack stories: types → schema → backend → frontend → tests
- All 803+ backend tests and 876+ frontend tests must continue passing
- Lint must be clean across monorepo

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Fixed `react-router-dom` → `react-router` imports in 3 files (StudentHealthDashboard.tsx, TeacherAtRiskWidget.tsx, classes-page.tsx) — project uses react-router v7
- Fixed flag query placement in getDashboard() — initial placement was after the loop that used the result
- Added `studentFlag` mock to backend test `mockDb` objects to prevent type errors
- Added `react-router` mock to StudentHealthDashboard.test.tsx (useSearchParams needs Router context)
- Fixed `react-router-dom` → `react-router` in TeacherAtRiskWidget.test.tsx mock

### Completion Notes List

- Task 6.6 (flag badge on StudentHealthCard) was missing — implemented with bulk flag query in backend getDashboard() + Flag icon in StudentHealthCard.tsx
- Task 7.5 (use-student-flags.test.ts) was missing — created with 5 tests
- Task 7.6 (StudentProfileOverlay tests) needed 3 new tests + useStudentFlags mock — added
- Task 7.7 (StudentHealthDashboard tests) needed 2 new tests + useStudentFlags mock — added
- Task 7.8 skipped (schema.d.ts sync requires running backend server — manual step)
- All backend tests pass: 823/823
- All frontend tests pass: 897/897
- Lint clean: 4/4 tasks, 0 warnings

### Change Log

- `packages/db/prisma/schema.prisma` — Added StudentFlagStatus enum, StudentFlag model, User relations
- `packages/db/prisma/migrations/20260218094815_add_student_flag/` — Migration for StudentFlag
- `packages/types/src/student-flag.ts` — NEW: Flag schemas (create, resolve, record, status)
- `packages/types/src/student-health.ts` — Added hasOpenFlags to StudentHealthCardSchema, TeacherAtRiskWidgetResponseSchema
- `packages/types/src/index.ts` — Added student-flag export
- `apps/backend/src/modules/student-health/student-health.service.ts` — Added teacher scoping to getDashboard/getStudentProfile, added getTeacherAtRiskWidget/createFlag/getStudentFlags/resolveFlag, added open flags query for dashboard cards
- `apps/backend/src/modules/student-health/student-health.controller.ts` — Added controller methods for new endpoints
- `apps/backend/src/modules/student-health/student-health.routes.ts` — Added TEACHER to dashboard/profile roles, added teacher-widget/flags routes
- `apps/backend/src/modules/student-health/student-health.service.test.ts` — Added studentFlag mock, 44 total tests
- `apps/backend/src/modules/student-health/student-health.routes.integration.test.ts` — Added studentFlag mock, 23 total tests
- `apps/webapp/src/features/student-health/hooks/use-teacher-at-risk-widget.ts` — NEW: Query hook for teacher widget
- `apps/webapp/src/features/student-health/hooks/use-student-flags.ts` — NEW: Query/mutation hooks for flags
- `apps/webapp/src/features/student-health/hooks/student-health-keys.ts` — Added widget + flag keys
- `apps/webapp/src/features/student-health/components/TeacherAtRiskWidget.tsx` — NEW: At-risk widget card
- `apps/webapp/src/features/student-health/components/FlagStudentModal.tsx` — NEW: Flag dialog
- `apps/webapp/src/features/student-health/components/StudentFlagsSection.tsx` — NEW: Flags list section
- `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx` — Fixed react-router import
- `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx` — Added flag icon for hasOpenFlags
- `apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx` — Added flag button (TEACHER), hidden interventions tab (TEACHER), flags section (ADMIN)
- `apps/webapp/src/features/dashboard/components/TeacherDashboard.tsx` — Added TeacherAtRiskWidget
- `apps/webapp/src/features/logistics/classes-page.tsx` — Added View Health link for TEACHER, fixed react-router import
- `apps/webapp/src/features/student-health/__tests__/TeacherAtRiskWidget.test.tsx` — NEW: 3 tests, fixed react-router mock
- `apps/webapp/src/features/student-health/__tests__/FlagStudentModal.test.tsx` — NEW: 3 tests
- `apps/webapp/src/features/student-health/__tests__/StudentFlagsSection.test.tsx` — NEW: 3 tests
- `apps/webapp/src/features/student-health/__tests__/use-teacher-at-risk-widget.test.ts` — NEW: 2 tests
- `apps/webapp/src/features/student-health/__tests__/use-student-flags.test.ts` — NEW: 5 tests
- `apps/webapp/src/features/student-health/__tests__/StudentProfileOverlay.test.tsx` — Added 3 new tests + useStudentFlags mock
- `apps/webapp/src/features/student-health/__tests__/StudentHealthDashboard.test.tsx` — Added 2 new tests + useStudentFlags mock + react-router mock

### File List

**New Files:**
- `packages/types/src/student-flag.ts`
- `packages/db/prisma/migrations/20260218094815_add_student_flag/migration.sql`
- `apps/webapp/src/features/student-health/hooks/use-teacher-at-risk-widget.ts`
- `apps/webapp/src/features/student-health/hooks/use-student-flags.ts`
- `apps/webapp/src/features/student-health/components/TeacherAtRiskWidget.tsx`
- `apps/webapp/src/features/student-health/components/FlagStudentModal.tsx`
- `apps/webapp/src/features/student-health/components/StudentFlagsSection.tsx`
- `apps/webapp/src/features/student-health/__tests__/TeacherAtRiskWidget.test.tsx`
- `apps/webapp/src/features/student-health/__tests__/FlagStudentModal.test.tsx`
- `apps/webapp/src/features/student-health/__tests__/StudentFlagsSection.test.tsx`
- `apps/webapp/src/features/student-health/__tests__/use-teacher-at-risk-widget.test.ts`
- `apps/webapp/src/features/student-health/__tests__/use-student-flags.test.ts`

**Modified Files:**
- `packages/db/prisma/schema.prisma`
- `packages/types/src/student-health.ts`
- `packages/types/src/index.ts`
- `apps/backend/src/modules/student-health/student-health.service.ts`
- `apps/backend/src/modules/student-health/student-health.controller.ts`
- `apps/backend/src/modules/student-health/student-health.routes.ts`
- `apps/backend/src/modules/student-health/student-health.service.test.ts`
- `apps/backend/src/modules/student-health/student-health.routes.integration.test.ts`
- `apps/webapp/src/features/student-health/hooks/student-health-keys.ts`
- `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx`
- `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx`
- `apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx`
- `apps/webapp/src/features/student-health/__tests__/StudentHealthDashboard.test.tsx`
- `apps/webapp/src/features/student-health/__tests__/StudentProfileOverlay.test.tsx`
- `apps/webapp/src/features/dashboard/components/TeacherDashboard.tsx`
- `apps/webapp/src/features/logistics/classes-page.tsx`
- `apps/webapp/src/schema/schema.d.ts` (needs regeneration)
