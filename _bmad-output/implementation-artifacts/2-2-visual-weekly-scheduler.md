# Story 2.2: Visual Weekly Scheduler

Status: ready-for-dev

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

- [ ] **Database Schema Enhancements**
  - [ ] Add `ClassSchedule` model: `id`, `classId`, `dayOfWeek` (0-6), `startTime` (string, HH:mm), `endTime` (string, HH:mm), `roomName`, `centerId`.
  - [ ] Add `ClassSession` model: `id`, `classId`, `scheduleId`, `startTime` (DateTime), `endTime` (DateTime), `roomName`, `status` (Enum: SCHEDULED, CANCELLED, COMPLETED), `centerId`.
  - [ ] Add `Notification` model: `id`, `userId`, `centerId`, `title`, `message`, `read` (Boolean), `createdAt`.
  - [ ] Run `pnpm db:generate` and `pnpm db:migrate`.
- [ ] **Backend API Development**
  - [ ] Define Zod schemas for `ClassSchedule` and `ClassSession` in `packages/types/src/logistics.ts`.
  - [ ] Implement `schedules` module: CRUD for class recurring times.
  - [ ] Implement `sessions` module: CRUD for specific occurrences.
  - [ ] **Session Generator Service:** Logic to project `ClassSchedule` into `ClassSession` records for a given date range (e.g., next 30 days).
  - [ ] Implement `notifications` module for basic in-app alerts.
  - [ ] Add `onUpdate` hook in `SessionsService` to trigger notifications to students/teachers.
- [ ] **Frontend Development**
  - [ ] Build `WeeklyCalendar` component using CSS Grid and `date-fns`.
  - [ ] Integrate `@hello-pangea/dnd` for drag-and-drop scheduling (Admins only).
  - [ ] Create `SessionBlock` component with brand color support.
  - [ ] Implement `SessionDetailsPopover` using `shadcn/ui` Popover.
  - [ ] Implement "Next/Prev/Today" week navigation logic.
  - [ ] Add `NotificationBell` to the Dashboard Shell (Top Bar).
- [ ] **Testing**
  - [ ] Unit tests for `SessionsService` verifying tenanted isolation.
  - [ ] Integration test for the "Move Session -> Notify" flow.

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- `packages/db/prisma/schema.prisma`
- `packages/types/src/logistics.ts`
- `apps/backend/src/modules/logistics/schedules.service.ts`
- `apps/backend/src/modules/logistics/schedules.controller.ts`
- `apps/backend/src/modules/logistics/schedules.routes.ts`
- `apps/backend/src/modules/logistics/sessions.service.ts`
- `apps/backend/src/modules/logistics/sessions.controller.ts`
- `apps/backend/src/modules/logistics/sessions.routes.ts`
- `apps/backend/src/modules/notifications/notifications.service.ts`
- `apps/backend/src/modules/notifications/notifications.routes.ts`
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx`
- `apps/webapp/src/features/logistics/components/SessionBlock.tsx`
- `apps/webapp/src/features/logistics/components/SessionDetailsPopover.tsx`
- `apps/webapp/src/features/logistics/hooks/use-sessions.ts`
- `apps/webapp/src/features/dashboard/components/NotificationBell.tsx`
- `apps/webapp/src/features/dashboard/components/DashboardShell.tsx` (Modified to include Bell)
