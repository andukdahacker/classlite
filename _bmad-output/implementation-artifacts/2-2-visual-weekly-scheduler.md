# Story 2.2: Visual Weekly Scheduler

Status: done

<!-- Note: Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a Teacher or Student,
I want to see a visual calendar of my upcoming classes,
so that I can plan my week without checking spreadsheets.

## Acceptance Criteria

1. **Weekly Grid View:** Implement a 7-column grid (Monday-Sunday) representing the current week. Each column represents a day, and the Y-axis represents time (8:00 AM to 10:00 PM). [Epic 2, Story 2.2, AC1]
2. **Session Rendering:** Display class sessions as blocks within the grid. Blocks must use the `Brand Color` defined in the Course (from Story 2.1). [UX Spec 2.1, 2.2]
3. **Drag-and-Drop (Scheduling):** Users with `Owner` or `Admin` roles can drag sessions to different time slots or days. Dropping a session updates its `startTime` and `endTime` in the database. [UX Spec 2.2]
4. **Session Quick-View:** Clicking a session block opens a Popover or Small Drawer displaying:
   - Course Name & Class Name
   - Location (Room Name or Meeting Link)
   - Teacher Name
   - Roster Size (e.g., "12 Students") [Epic 2, Story 2.2, AC2]
5. **Navigation & Controls:**
   - "Next/Previous" week navigation.
   - "Today" button to return to the current week.
   - Filter by Teacher or Room (Optional but encouraged). [UX Spec 4.1]
6. **In-App Notifications:** If an Admin moves a session, a notification record is created for all enrolled students and the assigned teacher. [Epic 2, Story 2.2, AC3]
7. **Mobile Responsiveness:** On screens < 768px, the grid collapses to a single-day view with a horizontal date picker at the top. [UX Spec 2.2]
8. **Multi-Tenancy:** All session data must be strictly isolated by `centerId`. [Project Context #1]

## Tasks / Subtasks

- [x] **Database Schema Enhancements**
  - [x] Add `ClassSchedule` model: `id`, `classId`, `dayOfWeek` (0-6), `startTime` (string, HH:mm), `endTime` (string, HH:mm), `roomName`, `centerId`.
  - [x] Add `ClassSession` model: `id`, `classId`, `scheduleId`, `startTime` (DateTime), `endTime` (DateTime), `roomName`, `status` (Enum: SCHEDULED, CANCELLED, COMPLETED), `centerId`.
  - [x] Add `Notification` model: `id`, `userId`, `centerId`, `title`, `message`, `read` (Boolean), `createdAt`.
  - [x] Run `pnpm db:generate` and `pnpm db:migrate`.
- [x] **Backend API Development**
  - [x] Define Zod schemas for `ClassSchedule` and `ClassSession` in `packages/types/src/logistics.ts`.
  - [x] Implement `schedules` module: CRUD for class recurring times.
  - [x] Implement `sessions` module: CRUD for specific occurrences.
  - [x] **Session Generator Service:** Logic to project `ClassSchedule` into `ClassSession` records for a given date range (e.g., next 30 days).
  - [x] Implement `notifications` module for basic in-app alerts.
  - [x] Add `onUpdate` hook in `SessionsService` to trigger notifications to students/teachers.
- [x] **Frontend Development**
  - [x] Build `WeeklyCalendar` component using CSS Grid and `date-fns`.
  - [x] Integrate `@hello-pangea/dnd` for drag-and-drop scheduling (Admins only).
  - [x] Create `SessionBlock` component with brand color support.
  - [x] Implement `SessionDetailsPopover` using `shadcn/ui` Popover.
  - [x] Implement "Next/Prev/Today" week navigation logic.
  - [x] Add `NotificationBell` to the Dashboard Shell (Top Bar).
- [x] **Testing**
  - [x] Unit tests for `SessionsService` verifying tenanted isolation.
  - [x] Integration test for the "Move Session -> Notify" flow.

## Dev Notes

- **Calendar Logic:** Use `date-fns` to calculate the start and end of the week.
- **Drag-and-Drop:** Use `@hello-pangea/dnd` or `dnd-kit`. Given `@hello-pangea/dnd` is already in `package.json`, prefer it.
- **Grid Layout:** Use `grid-template-columns: repeat(7, 1fr)` for the weekly view. Use `calc()` or absolute positioning for session blocks based on their time.
- **Multi-Tenancy:** Ensure `centerId` is passed to `getTenantedClient`.
- **RBAC:** Use `RBACWrapper` to enable/disable drag handles.
- **Real-time:** Use `optimisticUpdate` in TanStack Query for a snappy drag-and-drop experience.

### Project Structure Notes

- Backend: `apps/backend/src/modules/logistics/sessions.*`
- Frontend: `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx`
- Types: `@workspace/types/src/logistics.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification-epic-2.md#2.2 Visual Weekly Scheduler]
- [Source: _bmad-output/implementation-artifacts/2-1-course-class-management.md] (For Course/Class models)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Backend tests: 62 passed, 2 failed (pre-existing failures in tenant.service.test.ts unrelated to this story)
- Frontend tests: 18 passed

### Completion Notes List

1. **Database Schema**: Added ClassSchedule, ClassSession, and Notification models with proper multi-tenant isolation (centerId) and relations. Added teacher relation to Class model for popover display.
2. **Backend API**: Implemented schedules, sessions, and notifications modules following Route-Controller-Service pattern
3. **Session Generator**: Created generateSessions method that projects recurring ClassSchedule patterns into specific ClassSession records
4. **Notification Triggering**: SessionsController.updateSession detects time changes and triggers bulk notifications to enrolled students and teachers
5. **Frontend Calendar**: Built WeeklyCalendar with 7-column grid (Mon-Sun), 8AM-10PM time range, drag-and-drop via @hello-pangea/dnd
6. **Mobile Responsiveness**: Single-day view with horizontal date picker for screens < 768px per AC7
7. **Session Quick-View**: Full AC4 implementation with Course Name, Class Name, Location, Teacher Name, and Roster Size
8. **RBAC Integration**: Drag-and-drop restricted to OWNER/ADMIN roles via RBACWrapper; read-only view for TEACHER/STUDENT
9. **NotificationBell**: Added to DashboardShell header with unread count badge and popover for viewing/marking notifications
10. **Unit Tests**: 15 unit tests for SessionsService covering CRUD, participants lookup, session generation, and multi-tenancy
11. **Integration Tests**: Move-session-notify flow integration tests
12. **Optimistic Updates**: TanStack Query optimistic updates for snappy drag-and-drop UX
13. **Manual Session Creation**: Added "Add Session" dialog for creating individual sessions with class selection, date picker, time pickers, and room name

### File List

- `packages/db/prisma/schema.prisma` (Modified - added 3 models, added teacher relation)
- `packages/types/src/logistics.ts` (Modified - added Zod schemas, added teacher/count types)
- `apps/backend/package.json` (Modified - added dependencies)
- `apps/backend/src/modules/logistics/schedules.service.ts` (New)
- `apps/backend/src/modules/logistics/schedules.controller.ts` (New)
- `apps/backend/src/modules/logistics/schedules.routes.ts` (New)
- `apps/backend/src/modules/logistics/sessions.service.ts` (New)
- `apps/backend/src/modules/logistics/sessions.service.test.ts` (New - 15 tests)
- `apps/backend/src/modules/logistics/sessions.integration.test.ts` (New - integration tests for move-notify flow)
- `apps/backend/src/modules/logistics/sessions.controller.ts` (New)
- `apps/backend/src/modules/logistics/sessions.routes.ts` (New)
- `apps/backend/src/modules/notifications/notifications.service.ts` (New)
- `apps/backend/src/modules/notifications/notifications.controller.ts` (New)
- `apps/backend/src/modules/notifications/notifications.routes.ts` (New)
- `apps/backend/src/app.ts` (Modified - added route registrations)
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx` (New - with mobile responsive single-day view)
- `apps/webapp/src/features/logistics/components/SessionBlock.tsx` (New)
- `apps/webapp/src/features/logistics/components/SessionDetailsPopover.tsx` (New - with teacher/roster display)
- `apps/webapp/src/features/logistics/components/CreateSessionDialog.tsx` (New - manual session creation UI)
- `apps/webapp/src/features/logistics/hooks/use-sessions.ts` (New - with optimistic updates, createSession)
- `apps/webapp/src/features/logistics/scheduler-page.tsx` (New - with Add Session button)
- `apps/webapp/src/features/dashboard/components/NotificationBell.tsx` (New)
- `apps/webapp/src/core/components/layout/DashboardShell.tsx` (Modified - added NotificationBell)
- `apps/webapp/src/core/config/navigation.ts` (Modified - added Schedule nav item)
- `apps/webapp/src/App.tsx` (Modified - added scheduler route)
- `apps/webapp/src/features/dashboard/DashboardPage.test.tsx` (Modified - updated mocks)
- `pnpm-lock.yaml` (Modified - lockfile updates)
