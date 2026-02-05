# Story 2.3: Conflict Detection

Status: done

## Story

As a Center Admin,
I want to be warned if I double-book a teacher or room,
so that I avoid logistical failures during class hours.

## Acceptance Criteria

1. **Conflict Detection on Create/Edit:** During session creation or edit (via CreateSessionDialog or drag-and-drop), system checks for overlapping sessions in the same room OR for the same teacher. [Epic 2, Story 2.3, AC1]
2. **Non-Blocking Warning Banner:** If a conflict is detected, display a non-blocking visual warning banner in the dialog/UI. User CAN still save (force save) but is informed of the conflict. [Epic 2, Story 2.3, AC2]
3. **Conflict Icon on Calendar:** Sessions with existing conflicts display a small warning icon (AlertTriangle) on the top-right corner of the session block in the WeeklyCalendar. Conflicts must be computed for all displayed sessions. [UX Spec 2.3]
4. **Conflict Drawer:** Clicking the warning icon opens a side drawer/sheet detailing the specific conflicts (room double-booking, teacher double-booking). [UX Spec 2.3]
5. **Suggestion System:** System suggests the next available time slot (same day, closest time) or an alternative room when conflicts are detected. [Epic 2, Story 2.3, AC3]
6. **Drag-and-Drop Visual Feedback:** When dragging a session in the calendar, potential conflict time slots glow subtle red; safe slots glow subtle green. [UX Spec 2.3]
7. **Force Save with Admin Role:** "Force Save" (override conflict) requires OWNER or ADMIN role. Teachers cannot force-save conflicts. [UX Spec 2.3]
8. **Multi-Tenancy:** All conflict checks must be scoped to `centerId`. [Project Context #1]

## Tasks / Subtasks

- [x] **Backend: Conflict Detection Service**
  - [x] Add `checkConflicts(centerId, input: ConflictCheckInput): ConflictResult` method to `SessionsService`
  - [x] Query overlapping sessions by room (same `roomName`, overlapping time window)
  - [x] Query overlapping sessions by teacher (same `teacherId` via Class relation, overlapping time window)
  - [x] Exclude the session being edited from conflict results (if `excludeSessionId` provided)
  - [x] Return structured `ConflictResult` with `hasConflicts`, `roomConflicts[]`, `teacherConflicts[]`
- [x] **Backend: Suggestion Service**
  - [x] Add `suggestNextAvailable(centerId, input: SuggestionInput): Suggestion[]` method
  - [x] Find next available 30-minute slots on the same day for the same duration
  - [x] Find alternative rooms that are free during the requested time
  - [x] Return array of `Suggestion` objects with `type` ("time" | "room"), `value`, `startTime`, `endTime`
- [x] **Backend: Conflict Check Controller**
  - [x] Add `checkConflicts` method to `sessions.controller.ts`
  - [x] Format response using standard `{ data: ConflictResult }` wrapper
  - [x] Handle errors and return appropriate status codes
- [x] **Backend: Conflict Check API Endpoint**
  - [x] Add `POST /api/v1/logistics/sessions/check-conflicts` route in `sessions.routes.ts`
  - [x] Accept `{ classId, startTime, endTime, roomName?, excludeSessionId? }`
  - [x] Return `{ data: { hasConflicts, roomConflicts, teacherConflicts, suggestions } }`
- [x] **Backend: Batch Conflict Check for Calendar**
  - [x] Add `checkBatchConflicts(centerId, sessions[]): Map<string, boolean>` method
  - [x] Efficiently compute conflicts for multiple sessions in single query
  - [x] Used by frontend to mark existing sessions with conflict icons
- [x] **Backend: Update List Sessions Response**
  - [x] Add `listSessionsWithConflicts` method that includes conflict status
  - [x] Modify routes to support `?includeConflicts=true` query param
  - [x] Return sessions with `hasConflicts` flag when requested
- [x] **Frontend: Zod Schemas & Types** (Types were already added in packages/types/src/logistics.ts)
  - [x] Add schemas to `packages/types/src/logistics.ts`:
    - `ConflictCheckInputSchema`: `{ classId, startTime, endTime, roomName?, excludeSessionId? }`
    - `ConflictResultSchema`: `{ hasConflicts, roomConflicts[], teacherConflicts[] }`
    - `SuggestionSchema`: `{ type: "time" | "room", value, startTime?, endTime? }`
  - [x] Extend `ClassSessionSchema` to include optional `hasConflicts?: boolean`
  - [x] Run `pnpm --filter=webapp sync-schema-dev` after backend changes
- [x] **Frontend: useConflictCheck Hook**
  - [x] Create `use-conflict-check.ts` in `features/logistics/hooks/`
  - [x] Expose `checkConflicts(input)` mutation
  - [x] Use `useDebouncedCallback` from `use-debounce` package for real-time form validation (300ms delay)
- [x] **Frontend: ConflictWarningBanner Component**
  - [x] Create `ConflictWarningBanner.tsx` in `features/logistics/components/`
  - [x] Display `AlertTriangle` icon + message: "This session conflicts with [Session Name]"
  - [x] List each conflict type (room/teacher) with details
  - [x] Show suggestion buttons: "Use suggested time" / "Use alternative room"
  - [x] Display "Force Save" button (visible only to OWNER/ADMIN via RBACWrapper)
- [x] **Frontend: Update CreateSessionDialog**
  - [x] Call `checkConflicts` on form value changes (debounced 300ms)
  - [x] Display `ConflictWarningBanner` when conflicts detected
  - [x] Allow form submission even with conflicts (non-blocking)
- [x] **Frontend: ConflictDrawer Component**
  - [x] Create `ConflictDrawer.tsx` using shadcn Sheet component
  - [x] Display detailed conflict info: conflicting session name, time, teacher, room
  - [x] Show suggestions with "Apply" buttons
  - [x] Include "Force Save" action (RBAC protected)
- [x] **Frontend: Update SessionBlock Component**
  - [x] Accept `hasConflicts?: boolean` prop
  - [x] Add conflict icon overlay using `AlertTriangle` from lucide-react
  - [x] Position icon absolute top-right with `className="absolute -top-1 -right-1"`
  - [x] Make icon clickable to trigger `onConflictClick` callback
- [x] **Frontend: Update use-sessions Hook**
  - [x] Add `includeConflicts` parameter (defaults to true)
  - [x] Query param passed to sessions fetch
  - [x] Sessions returned include `hasConflicts` flag for calendar rendering
- [x] **Frontend: WeeklyCalendar Drag Conflict Highlighting**
  - [x] Add `conflictSlots: Set<string>` state alongside existing `dragPreview` state
  - [x] In `handleDragStart`: compute conflict zones based on teacher and room of dragged session
  - [x] In drag preview: show red styling for conflict slots, green for safe slots
  - [x] Clear `conflictSlots` in `handleDragEnd` function
- [x] **Testing**
  - [x] Extend `apps/backend/src/modules/logistics/sessions.service.test.ts` with conflict tests:
    - Room conflict detection (same room, overlapping time)
    - Teacher conflict detection (same teacher via class, overlapping time)
    - No conflict case (different room, different time)
    - Exclude self from conflict check
  - [x] Unit tests for `suggestNextAvailable` method
  - [x] Unit tests for `checkBatchConflicts` method (4 tests)
  - [ ] Integration test: Create session with conflict, verify warning returned (E2E test scope)
  - [ ] Integration test: Update session to conflicting time, verify warning returned (E2E test scope)

## Dev Notes

### Conflict Detection Logic

**Time Overlap Formula:**
Two sessions overlap if: `(session1.startTime < session2.endTime) AND (session1.endTime > session2.startTime)`

**Room Conflict Query (Prisma):**
```typescript
const roomConflicts = await db.classSession.findMany({
  where: {
    roomName: { equals: input.roomName, not: null },
    id: input.excludeSessionId ? { not: input.excludeSessionId } : undefined,
    status: { not: 'CANCELLED' },
    startTime: { lt: input.endTime },
    endTime: { gt: input.startTime },
  },
  include: { class: { include: { course: true } } },
});
```

**Teacher Conflict Query:**
```typescript
// Get teacherId from the class being scheduled
const classData = await db.class.findUnique({ where: { id: input.classId } });
const teacherId = classData?.teacherId;

if (teacherId) {
  const teacherConflicts = await db.classSession.findMany({
    where: {
      class: { teacherId },
      id: input.excludeSessionId ? { not: input.excludeSessionId } : undefined,
      status: { not: 'CANCELLED' },
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
    include: { class: { include: { course: true, teacher: true } } },
  });
}
```

### Suggestion Algorithm

**Next Available Time (same day):**
1. Get all sessions for the teacher AND room on the target date
2. Sort by startTime ascending
3. Walk through the day finding gaps >= requested duration
4. Return first 3 available slots after the requested time

**Alternative Room:**
1. Query distinct `roomName` values from sessions in this center
2. For each room, check if requested time slot is free
3. Return first 3 free rooms

### RBAC for Force Save

Use existing RBACWrapper (see `apps/webapp/src/features/auth/components/RBACWrapper.tsx`):
```tsx
<RBACWrapper requiredRoles={['OWNER', 'ADMIN']}>
  <Button variant="destructive" onClick={handleForceSave}>
    Force Save (Override Conflict)
  </Button>
</RBACWrapper>
```

### Conflict Icon Implementation

In SessionBlock.tsx, add conditional icon:
```tsx
import { AlertTriangle } from "lucide-react";

// Inside component, after the main div:
{hasConflicts && (
  <button
    onClick={(e) => { e.stopPropagation(); onConflictClick?.(); }}
    className="absolute -top-1 -right-1 p-0.5 bg-amber-100 rounded-full"
    aria-label="View scheduling conflicts"
  >
    <AlertTriangle className="size-3 text-amber-600" />
  </button>
)}
```

### Debounce Implementation

Use `useDebouncedCallback` from the `use-debounce` package (already installed):
```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedCheckConflicts = useDebouncedCallback(
  (values: FormValues) => checkConflicts(values),
  300
);
```

### File Locations

**Backend:**
- Service: `apps/backend/src/modules/logistics/sessions.service.ts` (extend)
- Controller: `apps/backend/src/modules/logistics/sessions.controller.ts` (extend)
- Routes: `apps/backend/src/modules/logistics/sessions.routes.ts` (add endpoint)
- Tests: `apps/backend/src/modules/logistics/sessions.service.test.ts` (extend)

**Types:**
- Schemas: `packages/types/src/logistics.ts` (add conflict schemas)

**Frontend:**
- Hook: `apps/webapp/src/features/logistics/hooks/use-conflict-check.ts` (new)
- Components:
  - `apps/webapp/src/features/logistics/components/ConflictWarningBanner.tsx` (new)
  - `apps/webapp/src/features/logistics/components/ConflictDrawer.tsx` (new)
  - `apps/webapp/src/features/logistics/components/SessionBlock.tsx` (modify - add conflict icon)
  - `apps/webapp/src/features/logistics/components/CreateSessionDialog.tsx` (modify - add conflict check)
  - `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx` (modify - add drag highlighting)
  - `apps/webapp/src/features/logistics/hooks/use-sessions.ts` (modify - add includeConflicts param)

### Previous Story Context (Story 2.2)

Key implementation details from Story 2.2 to build upon:
- `SessionsService` has `createSession`, `updateSession`, `getClassParticipants` methods
- `ClassSession` includes relations to Class (which has `teacherId` and `teacher` relation)
- `use-sessions.ts` has optimistic updates pattern - follow same pattern for conflict mutations
- `CreateSessionDialog` uses react-hook-form with Zod resolver - add conflict check in `onSubmit` and on field changes
- `WeeklyCalendar` drag state is at lines 60-70 (`isDragging`, `draggedSession`, `dragPreview`) - extend, don't duplicate

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification-epic-2.md#2.3 Conflict Detection]
- [Source: _bmad-output/implementation-artifacts/2-2-visual-weekly-scheduler.md]
- [Source: project-context.md#Multi-Tenancy Enforcement]
- [Source: apps/webapp/src/features/auth/components/RBACWrapper.tsx]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

1. Implemented core conflict detection backend with `checkConflicts` and `suggestNextAvailable` methods in SessionsService
2. Added conflict check API endpoint `POST /api/v1/logistics/sessions/check-conflicts`
3. Added `checkBatchConflicts` method for efficient multi-session conflict detection
4. Added `listSessionsWithConflicts` method and `?includeConflicts=true` query param
5. Created frontend components: ConflictWarningBanner, ConflictDrawer
6. Integrated conflict checking into CreateSessionDialog with debounced validation
7. Updated SessionBlock to show conflict icon with click handler
8. Updated WeeklyCalendar with conflict drawer and drag-and-drop conflict highlighting
9. Updated use-sessions hook to fetch conflicts by default
10. All 189 backend tests pass including 13 conflict detection tests
11. TypeScript compilation successful for both backend and frontend

**Code Review Fixes (2026-02-03):**
- Added RBAC to `/check-conflicts` endpoint (OWNER, ADMIN, TEACHER only)
- Removed debug `console.log` from sessions.controller.ts
- Added test for concurrent room AND teacher conflicts
- Fixed race condition in CreateSessionDialog conflict clearing
- Added conflict-aware submission gating (non-admins blocked, admins warned)
- Optimized `computeConflictSlots` using interval-based approach (O(sessions) vs O(slots×sessions))
- Implemented ConflictDrawer suggestion handlers (`onApplySuggestion`, `onForceSave`)

**Code Review Fixes (2026-02-05):**
- [H1] Removed stale `useCallback` wrapper on `checkConflictsImmediate` (recreated every render due to unstable dependency)
- [H2] Rewrote `checkBatchConflicts` to query DB for all overlapping sessions — now catches conflicts with sessions outside the current batch/view
- [H2] Added test for DB-only conflict detection (214 tests total)
- [H3] Scoped room discovery query in `suggestNextAvailable` to last 90 days + non-cancelled sessions
- [M1] Wired up `onSessionUpdate` prop through WeeklyCalendar → scheduler-page so room suggestions actually update the session
- [M2] Added conflict check error display in CreateSessionDialog
- [M3] Added runtime guard for empty conflict check responses; improved type safety in use-sessions hook

**Remaining E2E scope items:**
- Integration test: Create session with conflict, verify warning returned
- Integration test: Update session to conflicting time, verify warning returned

### File List

**Backend (Modified):**
- `apps/backend/src/modules/logistics/sessions.service.ts` - Added checkConflicts, suggestNextAvailable, checkBatchConflicts, listSessionsWithConflicts methods
- `apps/backend/src/modules/logistics/sessions.controller.ts` - Added checkConflicts method, updated listSessions with includeConflicts param
- `apps/backend/src/modules/logistics/sessions.routes.ts` - Added /check-conflicts endpoint, added includeConflicts query param
- `apps/backend/src/modules/logistics/sessions.service.test.ts` - Added 12 conflict detection tests

**Types (Modified):**
- `packages/types/src/logistics.ts` - Types already existed (ConflictCheckInput, ConflictResult, Suggestion, ClassSessionWithConflicts, etc.)

**Frontend (New):**
- `apps/webapp/src/features/logistics/hooks/use-conflict-check.ts` - Conflict checking hook with debounce
- `apps/webapp/src/features/logistics/components/ConflictWarningBanner.tsx` - Warning banner for dialogs
- `apps/webapp/src/features/logistics/components/ConflictDrawer.tsx` - Conflict details drawer

**Frontend (Modified):**
- `apps/webapp/src/features/logistics/components/SessionBlock.tsx` - Added hasConflicts and onConflictClick props
- `apps/webapp/src/features/logistics/components/CreateSessionDialog.tsx` - Integrated conflict checking
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx` - Added conflict drawer integration, drag conflict highlighting
- `apps/webapp/src/features/logistics/hooks/use-sessions.ts` - Added includeConflicts parameter
- `apps/webapp/src/features/logistics/scheduler-page.tsx` - Added onSessionUpdate handler for room suggestions
