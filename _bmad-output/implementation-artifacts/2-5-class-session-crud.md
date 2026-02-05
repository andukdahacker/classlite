# Story 2.5: Class Session CRUD

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Center Admin,
I want to create, edit, and delete class sessions with recurrence support and room management,
so that I can build and maintain the weekly schedule efficiently.

## Acceptance Criteria

1. **Create Session from Scheduler (AC1):** From the weekly scheduler (Story 2.2), Admin can click an empty time slot OR use the existing "Add Session" button to open the session creation form. Clicking an empty slot pre-fills the date and start time from the clicked position. [Epic 2, Story 2.5, AC1]
2. **Session Form Fields (AC2):** Session form includes: Class (dropdown from existing classes), Date (calendar picker), Start Time, End Time, Room (dropdown of saved rooms OR free-text input), Teacher (read-only, derived from selected class), Recurrence (None, Weekly, Bi-weekly). [Epic 2, Story 2.5, AC2]
3. **Drag-to-Create (AC3):** Admin can click-and-drag on the calendar grid to create a session with pre-filled date, start time, and end time based on the drag range. On mouse-up, open the CreateSessionDialog with pre-populated time fields. [Epic 2, Story 2.5, AC3]
4. **Edit Session (AC4):** Clicking an existing session opens a popover with session details. An "Edit" button opens an edit modal/dialog with the same fields as creation, pre-populated with current values. Changes trigger conflict detection (Story 2.3). Saves via `PATCH /api/v1/logistics/sessions/:id`. [Epic 2, Story 2.5, AC4]
5. **Delete Session with Recurring Prompt (AC5):** Delete action requires confirmation dialog. If the session belongs to a recurring schedule (`scheduleId` is not null), prompt: "Delete this session only" or "Delete all future sessions in this series". Single deletion uses existing `DELETE` endpoint. Bulk future deletion requires a new backend endpoint. When deleting all future sessions, notify all class participants (teacher + students) via `NotificationsService.createBulkNotifications()`. If all sessions linked to a `scheduleId` are deleted, also delete the orphaned `ClassSchedule` record. [Epic 2, Story 2.5, AC5]
6. **Recurring Session Generation (AC6):** When creating a session with Recurrence set to "Weekly" or "Bi-weekly", the system generates session instances for 12 weeks from the start date. Each generated instance can be individually modified or deleted afterward. Uses the existing `POST /api/v1/logistics/sessions/generate` infrastructure with enhancements for recurrence type. [Epic 2, Story 2.5, AC6]
7. **Room Management (AC7):** Settings page includes a "Rooms" sub-section (`/:centerId/settings/rooms`) where Admin can define room names (CRUD). These rooms populate the room dropdown in session creation/edit forms. Room names are stored as a `Room` model (or simple key-value) scoped by `centerId`. [Epic 2, Story 2.5, AC7]
8. **Participant Schedule Sync (AC8):** Creating/editing sessions automatically updates participant schedules. Teachers and Students assigned to the Class see the session on their weekly scheduler. This is already handled by the existing data model (sessions are linked to classes which have rosters). No additional work needed. [Epic 2, Story 2.5, AC8]
9. **Multi-Tenancy:** All session and room records are scoped to `centerId`. [Project Context #1]
10. **RBAC Enforcement:** Only OWNER and ADMIN roles can create, edit, and delete sessions. TEACHER and STUDENT roles have read-only calendar access. Session CRUD routes already enforce `requireRole(["OWNER", "ADMIN"])`. [Project Context - RBAC]
11. **Conflict Detection Integration:** All create and edit operations trigger real-time conflict detection (Story 2.3) before saving. Conflict warnings are non-blocking for OWNER/ADMIN (can "Force Save"). [Epic 2, Story 2.3]

## Tasks / Subtasks

### Backend Tasks

- [x] **Database: Create Room Model** (AC: #7)
  - [x] Add `Room` model to Prisma schema: `id`, `name`, `centerId`, `createdAt`, `updatedAt`
  - [x] Add unique constraint on `(name, centerId)` - no duplicate room names per center
  - [x] Run `pnpm --filter=@workspace/db db:migrate:dev`

- [x] **Types: Add Room Schemas** (AC: #7)
  - [x] Add to `packages/types/src/logistics.ts`:
    - `RoomSchema` with all fields
    - `CreateRoomInputSchema`: `{ name: string }`
    - `UpdateRoomInputSchema`: `{ name: string }`
    - `RoomListResponseSchema`
  - [x] Export all new types

- [x] **Backend: Create Room Service** (AC: #7)
  - [x] Create `apps/backend/src/modules/logistics/rooms.service.ts`
  - [x] Implement `listRooms(centerId)`: Returns all rooms sorted by name
  - [x] Implement `createRoom(centerId, input)`: Creates room with duplicate check
  - [x] Implement `updateRoom(centerId, id, input)`: Updates room name
  - [x] Implement `deleteRoom(centerId, id)`: Deletes room (soft check if used in sessions)
  - [x] Use `getTenantedClient(centerId)` for all queries

- [x] **Backend: Create Room Controller & Routes** (AC: #7)
  - [x] Create `apps/backend/src/modules/logistics/rooms.controller.ts`
  - [x] Create `apps/backend/src/modules/logistics/rooms.routes.ts`
  - [x] `GET /api/v1/logistics/rooms` - (OWNER, ADMIN, TEACHER) - list rooms for dropdown
  - [x] `POST /api/v1/logistics/rooms` - (OWNER, ADMIN) - create room
  - [x] `PATCH /api/v1/logistics/rooms/:id` - (OWNER, ADMIN) - update room
  - [x] `DELETE /api/v1/logistics/rooms/:id` - (OWNER, ADMIN) - delete room
  - [x] Register routes in logistics module (`app.ts`)

- [x] **Backend: Add Delete Future Sessions Endpoint** (AC: #5)
  - [x] Add to `sessions.service.ts`: `deleteFutureSessions(centerId, sessionId)` - deletes all sessions with the same `scheduleId` that have `startTime >= session.startTime`
  - [x] After deleting sessions, check if any sessions remain for that `scheduleId`. If zero remain, also delete the parent `ClassSchedule` record to prevent orphan data
  - [x] Send bulk notification to all class participants (teacher + students) using existing `NotificationsService.createBulkNotifications()` with message "X sessions cancelled for [ClassName]"
  - [x] Add route: `DELETE /api/v1/logistics/sessions/:id/future` - (OWNER, ADMIN)
  - [x] Validate that session has a `scheduleId` (error if not recurring)

- [x] **Backend: Enhance Session Create for Recurrence** (AC: #6)
  - [x] Extend `CreateClassSessionSchema` with optional `recurrence: z.enum(['none', 'weekly', 'biweekly']).optional()`
  - [x] Update `sessions.service.ts createSession()`: When recurrence is 'weekly' or 'biweekly', generate 12 weeks of sessions (reuse `generateSessions` logic with interval support)
  - [x] Return all created sessions (primary + generated)

- [x] **Backend: Update Room Field to Support Dropdown** (AC: #2, #7)
  - [x] Update `CreateClassSessionSchema` and `UpdateClassSessionSchema`: `roomName` field remains string (backward compatible); frontend will populate from Room dropdown or free text

- [x] **Frontend: Sync Schema** (AC: all)
  - [x] Run `pnpm --filter=webapp sync-schema-dev` after all backend routes are created
  - [x] Verify generated types in `apps/webapp/src/schema/schema.d.ts`

### Frontend Tasks

- [x] **Frontend: Create useRooms Hook** (AC: #7)
  - [x] Create `apps/webapp/src/features/logistics/hooks/use-rooms.ts`
  - [x] `useRooms()`: Query all rooms for dropdown population
  - [x] `useCreateRoom()`: Mutation for adding new room
  - [x] `useUpdateRoom()`: Mutation for editing room name
  - [x] `useDeleteRoom()`: Mutation for removing room

- [x] **Frontend: Create RoomsPage in Settings** (AC: #7)
  - [x] Create `apps/webapp/src/features/settings/pages/RoomsPage.tsx` (follows existing settings page pattern from `UsersPage`)
  - [x] Display list of rooms with Add, Edit (inline), Delete actions
  - [x] "Add Room" input at top with Enter to save
  - [x] Confirm before delete if room is used in existing sessions
  - [x] Add tab entry to `apps/webapp/src/features/settings/config/settings-nav.ts`: `{ id: "rooms", label: "Rooms", path: "rooms", order: 2.5 }`
  - [x] Add route in `apps/webapp/src/App.tsx` inside the settings `<Route>` block: `<Route path="rooms" element={<RoomsPage />} />`

- [x] **Frontend: Enhance CreateSessionDialog** (AC: #1, #2, #3, #6)
  - [x] Accept optional `defaultDate`, `defaultStartTime`, `defaultEndTime` props (for slot-click and drag-to-create)
  - [x] Add Recurrence field: Select dropdown with options "None", "Weekly", "Bi-weekly"
  - [x] Replace Room text input with Combobox: dropdown from useRooms + free-text fallback
  - [x] Show Teacher name (read-only) derived from selected class
  - [x] When Recurrence is set, show info text: "This will create sessions for 12 weeks"

- [x] **Frontend: Create EditSessionDialog Component** (AC: #4)
  - [x] Create `apps/webapp/src/features/logistics/components/EditSessionDialog.tsx`
  - [x] Same form fields as CreateSessionDialog but pre-populated with session data
  - [x] Reuse existing `updateSession` mutation from `use-sessions.ts` (already has optimistic UI updates for drag-and-drop — same mutation works for form-based edits)
  - [x] Integrates conflict detection on field changes (reuse `useConflictCheck` — do NOT create a separate hook)
  - [x] Reuse `ConflictWarningBanner` component for conflict display
  - [x] On save, closes dialog and refetches sessions
  - [x] Note: Participant notifications on time change are handled automatically by `sessions.controller.ts` (lines 109-140) — no extra frontend work needed

- [x] **Frontend: Implement Drag-to-Create on WeeklyCalendar** (AC: #3)
  - [x] **CRITICAL — Event system separation:** Existing drag-to-MOVE uses **HTML5 Drag API** (`onDragStart/onDragOver/onDrop` on `<div draggable>` session blocks). Drag-to-CREATE must use **mouse events** (`onMouseDown/onMouseMove/onMouseUp`) on **empty grid cells only**. These two systems do not conflict because they operate on different DOM elements — session blocks vs empty slots.
  - [x] Add `mousedown` + `mousemove` + `mouseup` handlers on empty calendar grid cells (not on session blocks)
  - [x] During drag, render a ghost preview block. Use conflict-aware coloring: check `computeConflictSlots()` (already exists in WeeklyCalendar) and show **green** border if no conflicts, **red** border if conflicts detected — matching existing drag-to-move visual language
  - [x] On `mouseup`, calculate date + start/end time from grid position and open CreateSessionDialog with pre-filled values
  - [x] Only enable for OWNER/ADMIN roles (via `useAuth` check)

- [x] **Frontend: Implement Empty Slot Click** (AC: #1)
  - [x] Add click handler on empty calendar time slots
  - [x] On click, open CreateSessionDialog with pre-filled date and clicked time
  - [x] Only enabled for OWNER/ADMIN roles

- [x] **Frontend: Enhance SessionDetailsPopover with Edit** (AC: #4)
  - [x] Add "Edit" button to SessionDetailsPopover (OWNER/ADMIN only via RBACWrapper)
  - [x] Clicking "Edit" closes popover and opens EditSessionDialog
  - [x] Pass session data to EditSessionDialog

- [x] **Frontend: Enhance Delete with Recurring Prompt** (AC: #5)
  - [x] Update delete flow in SessionDetailsPopover
  - [x] If session has `scheduleId`, show AlertDialog with two options: "Delete This Session Only" and "Delete All Future Sessions"
  - [x] "This only" calls existing `DELETE /api/v1/logistics/sessions/:id`
  - [x] "All future" calls new `DELETE /api/v1/logistics/sessions/:id/future`
  - [x] If no `scheduleId`, use simple confirmation (existing behavior)

- [x] **Frontend: Integrate Room Dropdown** (AC: #2, #7)
  - [x] In CreateSessionDialog and EditSessionDialog, replace room text input with a Combobox component
  - [x] Combobox shows rooms from `useRooms()` as dropdown options
  - [x] Allow free-text entry for rooms not yet saved
  - [x] Optionally show "Save as room" action for new free-text entries
  - [x] **Prerequisite:** Verify `@workspace/ui/components/command` exists (Shadcn Command component). If missing, run `npx shadcn@latest add command` in `packages/ui/` first

- [x] **Frontend: Update SchedulerPage for New Callbacks** (AC: #1, #3, #4)
  - [x] Pass `onSlotClick` and `onDragCreate` callbacks from SchedulerPage to WeeklyCalendar
  - [x] Manage EditSessionDialog open state and selected session
  - [x] Wire up all new handlers (edit, delete-future)

### Testing Tasks

- [x] **Testing: Backend Room Service Tests** (AC: #7)
  - [x] Create `apps/backend/src/modules/logistics/rooms.service.test.ts`
  - [x] Test: CRUD operations for rooms
  - [x] Test: Duplicate room name in same center (409)
  - [x] Test: Tenant isolation - cannot access other center's rooms

- [x] **Testing: Backend Delete Future Sessions Tests** (AC: #5)
  - [x] Add tests to `sessions.service.test.ts`
  - [x] Test: Deletes only sessions with same scheduleId and future startTime
  - [x] Test: Errors when session has no scheduleId
  - [x] Test: Does not delete sessions from other centers
  - [x] Test: Deletes orphaned ClassSchedule when all sessions are removed
  - [x] Test: Keeps ClassSchedule when earlier sessions still exist
  - [x] Test: Controller sends bulk notification to class participants on delete-future

- [x] **Testing: Backend Recurrence Generation Tests** (AC: #6)
  - [x] Add tests to `sessions.service.test.ts`
  - [x] Test: Weekly recurrence generates 12 sessions
  - [x] Test: Bi-weekly recurrence generates 6 sessions
  - [x] Test: No duplicates with existing sessions
  - [x] Test: All generated sessions linked to correct scheduleId

## Dev Notes

### Existing Infrastructure Audit

**What ALREADY EXISTS (DO NOT rebuild):**
- `sessions.service.ts`: Full CRUD (`createSession`, `updateSession`, `deleteSession`, `generateSessions`, `checkConflicts`, `suggestNextAvailable`, `checkBatchConflicts`)
- `sessions.controller.ts`: Controller wrapping all service methods
- `sessions.routes.ts`: All REST routes with RBAC (`POST /`, `PATCH /:id`, `DELETE /:id`, `POST /generate`, `POST /check-conflicts`)
- `CreateSessionDialog.tsx`: Dialog with class dropdown, date picker, time selects, room text input, conflict checking
- `WeeklyCalendar.tsx`: 7-column grid with drag-to-move, conflict visualization, session blocks, 15-min slots
- `SessionDetailsPopover.tsx`: Shows session details with Delete button and Mark Attendance button
- `SchedulerPage.tsx`: Orchestrates calendar + create dialog + generate sessions button
- `use-sessions.ts`: React Query hooks for all session CRUD + generate
- `use-conflict-check.ts`: Debounced conflict checking hook
- `ConflictWarningBanner.tsx`, `ConflictDrawer.tsx`: Conflict UI components

**What NEEDS to be ADDED/ENHANCED:**
1. **Room model + CRUD** (new): Backend model, service, routes; Frontend hook + settings component
2. **EditSessionDialog** (new): Edit modal for existing sessions, reusing form pattern from CreateSessionDialog
3. **Drag-to-create** (enhance WeeklyCalendar): mousedown/move/up on empty slots to create time range
4. **Empty slot click** (enhance WeeklyCalendar): click on empty slot opens create dialog with pre-filled time
5. **Recurrence on create** (enhance sessions.service + CreateSessionDialog): 12-week generation with weekly/biweekly interval
6. **Delete future sessions** (new endpoint + enhance SessionDetailsPopover): Bulk delete recurring series
7. **Room dropdown** (enhance CreateSessionDialog + EditSessionDialog): Combobox with saved rooms

### Database Schema - Room Model

```prisma
model Room {
  id        String   @id @default(cuid())
  name      String
  centerId  String   @map("center_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([name, centerId])
  @@index([centerId])
  @@map("room")
}
```

**Note:** `ClassSession.roomName` remains a String field (not a foreign key to Room). This maintains backward compatibility and allows free-text rooms. The Room model is used to *suggest* rooms via dropdown but does not enforce referential integrity.

### Recurrence Implementation Pattern

```typescript
// In sessions.service.ts - enhanced createSession
async createSession(centerId: string, input: CreateClassSessionInput): Promise<ClassSession[]> {
  const db = getTenantedClient(this.prisma, centerId);

  // Create the primary session
  const primarySession = await db.classSession.create({ ... });

  // If recurrence is set, generate additional sessions
  if (input.recurrence && input.recurrence !== 'none') {
    const intervalWeeks = input.recurrence === 'biweekly' ? 2 : 1;
    const totalInstances = input.recurrence === 'biweekly' ? 6 : 12; // 12 weeks total

    // Create a temporary ClassSchedule record to link recurring sessions
    const schedule = await db.classSchedule.create({
      data: {
        classId: input.classId,
        dayOfWeek: new Date(input.startTime).getDay(),
        startTime: format(new Date(input.startTime), 'HH:mm'),
        endTime: format(new Date(input.endTime), 'HH:mm'),
        roomName: input.roomName ?? null,
        centerId,
      },
    });

    // Update primary session to link to schedule
    await db.classSession.update({
      where: { id: primarySession.id },
      data: { scheduleId: schedule.id },
    });

    // Generate future sessions
    const sessionsToCreate = [];
    for (let i = 1; i < totalInstances; i++) {
      const weekOffset = i * intervalWeeks;
      const start = addWeeks(new Date(input.startTime), weekOffset);
      const end = addWeeks(new Date(input.endTime), weekOffset);

      sessionsToCreate.push({
        classId: input.classId,
        scheduleId: schedule.id,
        startTime: start,
        endTime: end,
        roomName: input.roomName ?? null,
        status: 'SCHEDULED',
        centerId,
      });
    }

    await db.classSession.createMany({ data: sessionsToCreate });
  }

  return primarySession; // Return primary; frontend can refetch week
}
```

### Delete Future Sessions Pattern

```typescript
// In sessions.service.ts - new method
async deleteFutureSessions(centerId: string, sessionId: string): Promise<{ deletedCount: number; classId: string }> {
  const db = getTenantedClient(this.prisma, centerId);

  // Get the session to find its scheduleId, classId, and startTime
  const session = await db.classSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  if (!session.scheduleId) {
    throw new Error('Session is not part of a recurring series');
  }

  // Delete all sessions in the same series with startTime >= this session's startTime
  const result = await db.classSession.deleteMany({
    where: {
      scheduleId: session.scheduleId,
      startTime: { gte: session.startTime },
      centerId,
    },
  });

  // Clean up orphaned ClassSchedule if no sessions remain
  const remainingCount = await db.classSession.count({
    where: { scheduleId: session.scheduleId },
  });
  if (remainingCount === 0) {
    await db.classSchedule.delete({ where: { id: session.scheduleId } });
  }

  return { deletedCount: result.count, classId: session.classId };
}

// In sessions.controller.ts - handler for delete-future
// MUST notify participants using existing NotificationsService:
async deleteFutureSessions(sessionId: string, jwtPayload: JwtPayload) {
  const { centerId } = jwtPayload;
  const { deletedCount, classId } = await this.sessionsService.deleteFutureSessions(centerId, sessionId);

  // Notify all class participants
  const participants = await this.sessionsService.getClassParticipants(centerId, classId);
  const userIds = [...participants.studentIds, ...(participants.teacherId ? [participants.teacherId] : [])];
  if (userIds.length > 0) {
    await this.notificationsService.createBulkNotifications(
      centerId, userIds,
      "Sessions Cancelled",
      `${deletedCount} future session(s) have been cancelled`,
    );
  }

  return { data: { deletedCount } };
}
```

### Drag-to-Create UI Pattern

**CRITICAL — Event System Separation:**
- Existing drag-to-MOVE uses **HTML5 Drag API** (`onDragStart/onDragOver/onDrop`) on `<div draggable>` session blocks
- Drag-to-CREATE uses **mouse events** (`onMouseDown/onMouseMove/onMouseUp`) on **empty grid cells**
- These do NOT conflict because they target different DOM elements

```tsx
// In WeeklyCalendar.tsx - new state and handlers (MOUSE events on empty cells)
// Existing drag-to-move on session blocks (HTML5 drag) is UNTOUCHED
const [createDragState, setCreateDragState] = useState<{
  isDragging: boolean;
  dayIndex: number;
  startSlot: number;
  endSlot: number;
} | null>(null);

// Attach to EMPTY grid cells only (not session blocks)
const handleGridMouseDown = (dayIndex: number, slotIndex: number) => {
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') return;
  setCreateDragState({ isDragging: true, dayIndex, startSlot: slotIndex, endSlot: slotIndex });
};

const handleGridMouseMove = (slotIndex: number) => {
  if (!createDragState?.isDragging) return;
  setCreateDragState(prev => prev ? { ...prev, endSlot: Math.max(slotIndex, prev.startSlot) } : null);
};

const handleGridMouseUp = () => {
  if (!createDragState?.isDragging) return;
  const date = addDays(weekStart, createDragState.dayIndex);
  const startTime = slotToTime(createDragState.startSlot);
  const endTime = slotToTime(createDragState.endSlot + 1);
  onDragCreate?.({ date, startTime, endTime });
  setCreateDragState(null);
};

// Ghost preview with conflict-aware coloring (matches existing drag-to-move visual language)
// Reuse existing computeConflictSlots() to check for conflicts in the dragged range
{createDragState?.isDragging && (() => {
  const hasConflict = /* check conflictSlots set for overlap with dragged range */;
  return (
    <div
      className={cn(
        "absolute border border-dashed rounded pointer-events-none z-10",
        hasConflict
          ? "border-red-500 bg-red-100/50"   // Red = conflicts (matches drag-to-move)
          : "border-green-500 bg-green-100/50" // Green = safe (matches drag-to-move)
      )}
      style={{
        top: createDragState.startSlot * SLOT_HEIGHT,
        height: (createDragState.endSlot - createDragState.startSlot + 1) * SLOT_HEIGHT,
        left: '2px',
        right: '2px',
      }}
    />
  );
})()}
```

### Room Combobox Pattern

```tsx
// Use existing Shadcn Combobox pattern
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";

// In CreateSessionDialog - replace room Input with:
<FormField
  control={form.control}
  name="roomName"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Room (Optional)</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" className="w-full justify-between">
              {field.value || "Select or type room..."}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search rooms..." onValueChange={field.onChange} />
            <CommandEmpty>No rooms found. Press Enter to use "{field.value}".</CommandEmpty>
            <CommandGroup>
              {rooms.map((room) => (
                <CommandItem key={room.id} onSelect={() => field.onChange(room.name)}>
                  {room.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

### API Endpoints - New Routes

**Room CRUD:**
```
GET    /api/v1/logistics/rooms           → { data: Room[] }
POST   /api/v1/logistics/rooms           → { data: Room }         Body: { name: string }
PATCH  /api/v1/logistics/rooms/:id       → { data: Room }         Body: { name: string }
DELETE /api/v1/logistics/rooms/:id       → { message: string }
```

**Delete Future Sessions:**
```
DELETE /api/v1/logistics/sessions/:id/future → { data: { deletedCount: number } }
```

**Enhanced Create Session (updated body):**
```
POST   /api/v1/logistics/sessions/       → { data: ClassSession }
Body: { classId, startTime, endTime, roomName?, recurrence?: 'none' | 'weekly' | 'biweekly' }
```

### File Locations

**Backend - New Files:**
- `apps/backend/src/modules/logistics/rooms.service.ts`
- `apps/backend/src/modules/logistics/rooms.controller.ts`
- `apps/backend/src/modules/logistics/rooms.routes.ts`
- `apps/backend/src/modules/logistics/rooms.service.test.ts`

**Backend - Modified Files:**
- `packages/db/prisma/schema.prisma` - Add Room model
- `packages/types/src/logistics.ts` - Add Room schemas, extend CreateClassSession with recurrence
- `apps/backend/src/modules/logistics/sessions.service.ts` - Add `deleteFutureSessions()`, enhance `createSession()` with recurrence
- `apps/backend/src/modules/logistics/sessions.controller.ts` - Add handler for delete-future
- `apps/backend/src/modules/logistics/sessions.routes.ts` - Add `DELETE /:id/future` route
- `apps/backend/src/app.ts` - Register rooms routes

**Frontend - New Files:**
- `apps/webapp/src/features/logistics/hooks/use-rooms.ts`
- `apps/webapp/src/features/logistics/components/EditSessionDialog.tsx`
- `apps/webapp/src/features/settings/pages/RoomsPage.tsx` (follows settings page pattern, NOT in logistics/)

**Frontend - Modified Files:**
- `apps/webapp/src/features/logistics/components/CreateSessionDialog.tsx` - Add recurrence field, room combobox, default props
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx` - Add drag-to-create (mouse events), slot click
- `apps/webapp/src/features/logistics/components/SessionDetailsPopover.tsx` - Add Edit button, enhance delete for recurring
- `apps/webapp/src/features/logistics/scheduler-page.tsx` - Wire up new callbacks (edit, slot click, drag create)
- `apps/webapp/src/features/logistics/hooks/use-sessions.ts` - Add `deleteFutureSessions` mutation
- `apps/webapp/src/features/settings/config/settings-nav.ts` - Add "Rooms" tab entry
- `apps/webapp/src/App.tsx` - Add `<Route path="rooms">` in settings routes (line ~108)
- `apps/webapp/src/schema/schema.d.ts` - Auto-generated after sync

### Project Structure Notes

- Follows feature-first organization: backend files in `apps/backend/src/modules/logistics/`, frontend logistics in `apps/webapp/src/features/logistics/`
- **Exception:** RoomsPage lives in `apps/webapp/src/features/settings/pages/` (follows existing settings page pattern — not in logistics)
- Room model is intentionally decoupled from ClassSession (no FK) for flexibility
- Reuses existing patterns: service-controller-routes (backend), React Query hooks (frontend), Shadcn UI components
- Tests co-located with source files
- Recurrence creates a ClassSchedule record to group recurring sessions, enabling "delete all future" functionality
- **Router:** This project uses **React Router v6** (import from `react-router`), NOT TanStack Router. Routes defined in `apps/webapp/src/App.tsx`

### Key Implementation Warnings

1. **DO NOT rebuild session CRUD** - It already exists in `sessions.service.ts`. Only enhance it.
2. **DO NOT change the `roomName` field type** in ClassSession - Keep it as String. The Room model is a suggestion source, not a constraint.
3. **Reuse `useConflictCheck` hook** in EditSessionDialog - don't create a duplicate conflict checker.
4. **Reuse `ConflictWarningBanner`** in EditSessionDialog - same conflict UI as CreateSessionDialog.
5. **Drag event system separation is CRITICAL:**
   - Drag-to-MOVE (existing): **HTML5 Drag API** on `<div draggable>` session blocks (`onDragStart/onDragOver/onDrop`)
   - Drag-to-CREATE (new): **Mouse events** on empty grid cells (`onMouseDown/onMouseMove/onMouseUp`)
   - These target **different DOM elements** and do NOT conflict. Do NOT change the existing drag-to-move implementation.
6. **Reuse `updateSession` mutation** from `use-sessions.ts` for EditSessionDialog — it already has optimistic UI updates (lines 67-112). Do NOT create a separate update mutation.
7. **Participant notifications are AUTOMATIC** — `sessions.controller.ts` (lines 109-140) already sends notifications via `NotificationsService.createBulkNotifications()` when session time changes. No extra frontend work needed for edit notifications. But `deleteFutureSessions` controller MUST explicitly send notifications since it's a new operation.
8. **Schema sync is REQUIRED** after adding backend routes - Run `pnpm --filter=webapp sync-schema-dev` with backend running.
9. **Recurrence generates 12 weeks, NOT 4** — The existing `ClassDrawer.tsx` uses `addWeeks(weekStart, 4)` for session generation via ScheduleManager. Story 2.5 recurrence MUST use **12-week** generation per Epic AC6. Do NOT copy the existing 4-week pattern.
10. **Existing `generateSessions` method** generates from ClassSchedule patterns for a date range. For recurrence, create the ClassSchedule first, then generate sessions from it.
11. **Verify Shadcn Command component exists** — Room Combobox requires `@workspace/ui/components/command`. If missing, run `npx shadcn@latest add command` in `packages/ui/` before implementing.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification-epic-2.md#2.2 Visual Weekly Scheduler]
- [Source: _bmad-output/planning-artifacts/ux-design-specification-epic-2.md#2.3 Conflict Detection]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- [Source: _bmad-output/implementation-artifacts/2-4-attendance-tracking.md] (previous story patterns)
- [Source: _bmad-output/implementation-artifacts/2-3-conflict-detection.md] (conflict detection patterns)
- [Source: _bmad-output/implementation-artifacts/2-2-visual-weekly-scheduler.md] (calendar patterns)
- [Source: project-context.md#Multi-Tenancy Enforcement]
- [Source: project-context.md#Layered Architecture]
- [Source: project-context.md#Development Workflow - Schema Sync]
- [Source: apps/backend/src/modules/logistics/sessions.service.ts] (existing session CRUD)
- [Source: apps/backend/src/modules/logistics/sessions.routes.ts] (existing routes)
- [Source: apps/webapp/src/features/logistics/components/CreateSessionDialog.tsx] (existing create dialog)
- [Source: apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx] (existing calendar)
- [Source: apps/webapp/src/features/logistics/components/SessionDetailsPopover.tsx] (existing popover)
- [Source: apps/webapp/src/features/settings/config/settings-nav.ts] (settings tab config)
- [Source: apps/webapp/src/App.tsx] (route definitions — React Router v6)
- [Source: apps/backend/src/modules/notifications/notifications.service.ts] (bulk notification pattern)
- [Source: apps/webapp/src/features/logistics/components/ScheduleManager.tsx] (existing schedule creation — 4-week generation)
- [Source: apps/webapp/src/features/logistics/hooks/use-sessions.ts] (existing mutations with optimistic updates)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- All backend tests pass (230 passed, 10 skipped), including 8 room service tests, 4 delete-future-sessions tests, 4 recurrence tests
- Frontend build clean (`pnpm --filter=webapp build` succeeds)
- Room model uses `db:push` (not migrations) per project convention
- Schema sync completed (`pnpm --filter=webapp sync-schema-dev`)
- Command component was manually added by user to `packages/ui`
- Frontend component tests deferred per existing story patterns (backend service tests written via TDD)
- Code review fixes applied: added date picker to EditSessionDialog (H1), added error-to-HTTP-status mapping in room/session routes (H2), fixed updateSession mutation crash on undefined time (M1), removed dead code in rooms.service deleteRoom (M2), fixed CreateSessionDialog incomplete form reset (M4), replaced browser confirm() with AlertDialog for non-recurring delete (L1)

### File List

**New Files:**
- `apps/backend/src/modules/logistics/rooms.service.ts`
- `apps/backend/src/modules/logistics/rooms.service.test.ts`
- `apps/backend/src/modules/logistics/rooms.controller.ts`
- `apps/backend/src/modules/logistics/rooms.routes.ts`
- `apps/webapp/src/features/logistics/hooks/use-rooms.ts`
- `apps/webapp/src/features/logistics/components/EditSessionDialog.tsx`
- `apps/webapp/src/features/settings/pages/RoomsPage.tsx`
- `packages/ui/src/components/command.tsx` — Shadcn Command component (added by user for room combobox)

**Modified Files:**
- `packages/db/prisma/schema.prisma` — Added Room model
- `packages/types/src/logistics.ts` — Added Room schemas, RecurrenceEnum, DeleteFutureSessionsResponseSchema
- `packages/ui/package.json` — Added cmdk dependency for Command component
- `pnpm-lock.yaml` — Lockfile updated for new dependencies
- `apps/backend/src/modules/logistics/sessions.service.ts` — Added deleteFutureSessions(), enhanced createSession() with recurrence
- `apps/backend/src/modules/logistics/sessions.service.test.ts` — Added tests for deleteFutureSessions and recurrence
- `apps/backend/src/modules/logistics/sessions.controller.ts` — Added deleteFutureSessions handler with notifications
- `apps/backend/src/modules/logistics/sessions.routes.ts` — Added DELETE /:id/future route, added error-to-status mapping
- `apps/backend/src/modules/logistics/rooms.routes.ts` — Added error-to-status mapping (409/404)
- `apps/backend/src/app.ts` — Registered rooms routes
- `apps/webapp/src/features/logistics/components/CreateSessionDialog.tsx` — Added recurrence, room combobox, default props, controlled open state, fixed form reset
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx` — Added drag-to-create (mouse events), slot click, onEdit/onDeleteFuture props
- `apps/webapp/src/features/logistics/components/SessionDetailsPopover.tsx` — Added Edit button, unified AlertDialog for recurring/non-recurring delete
- `apps/webapp/src/features/logistics/components/EditSessionDialog.tsx` — Added date picker field (code review fix)
- `apps/webapp/src/features/logistics/scheduler-page.tsx` — Wired up edit dialog, slot click, drag-to-create, delete future
- `apps/webapp/src/features/logistics/hooks/use-sessions.ts` — Added deleteFutureSessions mutation, fixed updateSession body builder
- `apps/webapp/src/features/settings/config/settings-nav.ts` — Added "Rooms" tab
- `apps/webapp/src/App.tsx` — Added RoomsPage route
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated after schema sync
