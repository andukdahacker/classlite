# Story 6.2: Student Profile Overlay

Status: done

## Story

As a Teaching Owner,
I want to see a student's history without leaving the dashboard,
so that I maintain my workflow context.

## Acceptance Criteria

1. **AC1: Slide-Over Overlay with Detailed Data** — Clicking a student card on the Traffic Light Dashboard opens a slide-over/overlay showing the student's detailed attendance records, assignment completion history with scores, and weekly trend indicators. The overlay clearly shows the root cause of any at-risk or warning status.
2. **AC2: No Page Reload, Scroll Preservation** — The overlay does not trigger a full page reload. The background dashboard preserves its scroll position and filter state while the overlay is open. Closing the overlay returns to the exact same view.

## Tasks / Subtasks

- [x] **Task 1: Shared types — Student profile schemas** (AC: 1)
  - [x] 1.1 Add new schemas to `packages/types/src/student-health.ts`. DO NOT modify existing schemas — append after the existing exports:
    - `StudentAttendanceRecordSchema = z.object({ sessionId: z.string(), className: z.string(), date: z.string(), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]) })`
    - `StudentAssignmentRecordSchema = z.object({ assignmentId: z.string(), exerciseTitle: z.string(), className: z.string(), skill: z.string().nullable(), dueDate: z.string(), submissionStatus: z.enum(["not-submitted", "in-progress", "submitted", "graded"]), score: z.number().nullable(), submittedAt: z.string().nullable() })`
    - `WeeklyTrendPointSchema = z.object({ weekStart: z.string(), weekLabel: z.string(), attendanceRate: z.number(), completionRate: z.number() })`
    - `StudentProfileResponseSchema = z.object({ student: z.object({ id: z.string(), name: z.string().nullable(), email: z.string().nullable(), avatarUrl: z.string().nullable(), healthStatus: HealthStatusSchema, metrics: StudentHealthMetricsSchema, classes: z.array(z.object({ id: z.string(), name: z.string() })) }), attendanceHistory: z.array(StudentAttendanceRecordSchema), assignmentHistory: z.array(StudentAssignmentRecordSchema), weeklyTrends: z.array(WeeklyTrendPointSchema) })`
    - **API response wrapper** (CRITICAL — follows existing pattern): `StudentProfileApiResponseSchema = createResponseSchema(StudentProfileResponseSchema)` — uses the same `createResponseSchema` utility already imported in this file for `StudentHealthDashboardApiResponseSchema`. This wraps the response in the `{ data: T, message: string }` envelope that routes require for ZodTypeProvider validation.
    - Export all new schemas and their inferred types
  - [x] 1.2 Verify existing exports in `packages/types/src/index.ts` — the `student-health.ts` export is already present from Story 6-1. No changes needed unless new named exports require it.
  - [x] 1.3 Build types package: `pnpm --filter=types build`

- [x] **Task 2: Backend service — getStudentProfile method** (AC: 1)
  - [x] 2.1 Add method `getStudentProfile(centerId: string, studentId: string)` to the existing `StudentHealthService` in `apps/backend/src/modules/student-health/student-health.service.ts`. Implementation:

    **Step A — Validate student exists and belongs to center:**
    ```
    Query CenterMembership where userId = studentId AND centerId = centerId AND role = 'STUDENT' AND status = 'ACTIVE'.
    Include user (id, name, email, avatarUrl).
    If not found: throw AppError.notFound("Student not found")
    NOTE: AppError requires 3 constructor args (statusCode, errorCode, message) OR use static factory methods: AppError.notFound(msg), AppError.badRequest(msg), AppError.forbidden(msg). Always use the static factories for clarity.
    ```

    **Step B — Get enrollment data:**
    ```
    Query ClassStudent where studentId = studentId (scoped by centerId via tenanted client).
    Include class (id, name).
    Build classIds array and classes array.
    ```

    **Step C — Compute health metrics (reuse existing logic):**
    ```
    Compute attendance and assignment metrics for this single student
    using the SAME threshold logic as getDashboard:
    - Attendance: sessions attended / expected sessions for enrolled classes
    - Assignments: submissions / total assignments for enrolled classes
    - Overall: worst(attendanceStatus, assignmentStatus)

    NOTE: getDashboard currently has ALL computation logic INLINE (no private helpers).
    For getStudentProfile, you have two options:
    (a) PREFERRED: Extract shared threshold logic into private helper methods
        (e.g., `private computeAttendanceStatus(rate)`, `private computeOverallStatus(...)`)
        that both getDashboard and getStudentProfile call. This avoids duplication.
    (b) ACCEPTABLE: Inline the same threshold constants and comparison logic
        (ATTENDANCE_THRESHOLDS, COMPLETION_THRESHOLDS, STATUS_PRIORITY) since
        they're already defined at module scope and accessible to both methods.
    ```

    **Step D — Fetch attendance history (last 30 sessions):**
    ```
    Query ClassSession where classId in enrolled classIds
      AND startTime <= now
      AND status != 'CANCELLED'
      Order by startTime DESC, limit 30.
      Select: id, classId, startTime.

    Query Attendance where studentId = studentId AND sessionId in fetched session IDs.
      Select: sessionId, status.

    Build attendance history array:
      For each session:
        - sessionId: session.id
        - className: look up from class enrollment data
        - date: session.startTime as ISO date string
        - status: matching attendance record's status, or 'ABSENT' if no record exists

      Sort by date descending (most recent first).
    ```

    **Step E — Fetch assignment history:**
    ```
    Query Assignment where centerId = centerId AND status in ['OPEN', 'CLOSED', 'ARCHIVED']:
      Include exercise (title, skill) and class (name).
      Filter to only assignments where classId is in student's enrolled classes
      OR student has an AssignmentStudent record.
      Select: id, exerciseId, classId, dueDate, status.

    Query Submission where studentId = studentId AND centerId = centerId:
      Include feedback (overallScore, teacherFinalScore).
      Select: assignmentId, status, submittedAt, feedback.

    Build assignment history array:
      For each relevant assignment:
        - assignmentId: assignment.id
        - exerciseTitle: assignment.exercise.title
        - className: assignment.class?.name ?? "Individual"
        - skill: assignment.exercise.skill (nullable)
        - dueDate: assignment.dueDate as ISO string
        - submissionStatus: derive from Submission status:
            No submission → "not-submitted"
            IN_PROGRESS → "in-progress"
            SUBMITTED | AI_PROCESSING → "submitted"
            GRADED → "graded"
        - score: submission?.feedback?.teacherFinalScore ?? submission?.feedback?.overallScore ?? null
        - submittedAt: submission?.submittedAt as ISO string or null

      Sort by dueDate descending (most recent first).
    ```

    **Step F — Compute weekly trends (last 8 weeks):**
    ```
    For each of the last 8 calendar weeks (Monday to Sunday):
      - weekStart: ISO date of that Monday
      - weekLabel: format as "MMM D" (e.g., "Feb 3")
      - attendanceRate: (sessions attended in that week / sessions expected in that week) * 100
        If 0 expected → 100
      - completionRate: (assignments due in that week that have submissions / assignments due in that week) * 100
        If 0 due → 100

    Use the attendance and assignment data already fetched in Steps D and E.
    Sort chronologically (oldest week first).
    ```

    **Step G — Build response:**
    ```
    Return {
      student: { id, name, email, avatarUrl, healthStatus, metrics, classes },
      attendanceHistory,
      assignmentHistory,
      weeklyTrends,
    }
    ```

    **CRITICAL:** Use `getTenantedClient(this.prisma, centerId)` for ALL queries. Call it ONCE and reuse. Do NOT use `$transaction` (read-only). For Submission queries, note that Submission is NOT in TENANTED_MODELS — use explicit `where: { centerId }` filter on `this.prisma.submission.findMany` (same pattern as Story 6-1).

- [x] **Task 3: Backend controller + route** (AC: 1)
  - [x] 3.1 Add method `getStudentProfile(centerId: string, studentId: string)` to `StudentHealthController`. Delegates to service, returns `{ data: result, message: "Student profile loaded" }`.
  - [x] 3.2 Add route to `student-health.routes.ts`. Follow the EXACT pattern of the existing `/dashboard` route:
    - Use `api.get()` (where `api = fastify.withTypeProvider<ZodTypeProvider>()` — already defined in the file)
    - Route path: `"/profile/:studentId"`
    - Schema definition (MUST match existing route pattern):
      ```typescript
      api.get("/profile/:studentId", {
        schema: {
          params: z.object({ studentId: z.string() }),
          response: {
            200: StudentProfileApiResponseSchema,  // <-- Uses the API wrapper, NOT raw schema
            400: ErrorResponseSchema,
            401: ErrorResponseSchema,
            403: ErrorResponseSchema,
            404: ErrorResponseSchema,  // <-- Added for this endpoint (student not found)
            500: ErrorResponseSchema,
          },
        },
        preHandler: [requireRole(["OWNER", "ADMIN"])],
        handler: async (request, reply) => {
          try {
            const payload = request.jwtPayload!;
            if (!payload.centerId) {
              return reply.status(400).send({ message: "Center ID required" });
            }
            const { studentId } = request.params;
            const result = await controller.getStudentProfile(payload.centerId, studentId);
            return reply.send(result);
          } catch (error: unknown) {
            return handleRouteError(error, request, reply);
          }
        },
      });
      ```
    - **IMPORTANT:** Add this route AFTER the existing `/dashboard` route in the same `studentHealthRoutes` plugin function. Do NOT create a new route file or module — extend the existing one.
    - **IMPORT:** Add `StudentProfileApiResponseSchema` to the existing imports from `@workspace/types` at the top of the file.

- [x] **Task 4: Schema sync — Regenerate frontend types** (AC: 1)
  - [x] 4.1 Start the backend: `pnpm --filter=backend dev`
  - [x] 4.2 Generate frontend schema: `pnpm --filter=webapp sync-schema-dev`
  - [x] 4.3 Verify `apps/webapp/src/schema/schema.d.ts` includes the new `/api/v1/student-health/profile/{studentId}` endpoint

- [x] **Task 5: Frontend hook — useStudentProfile** (AC: 1)
  - [x] 5.1 Add query key to `apps/webapp/src/features/student-health/hooks/student-health-keys.ts`:
    ```typescript
    export const studentHealthKeys = {
      all: ["student-health"] as const,
      dashboard: (filters?: { classId?: string; search?: string }) =>
        [...studentHealthKeys.all, "dashboard", filters] as const,
      profile: (studentId: string) =>
        [...studentHealthKeys.all, "profile", studentId] as const,
    };
    ```
  - [x] 5.2 Create `apps/webapp/src/features/student-health/hooks/use-student-profile.ts`. Export `useStudentProfile(studentId: string | null)`. Implementation:
    - Use `useQuery` with `studentHealthKeys.profile(studentId!)`
    - `enabled: !!studentId` (only fetch when a student is selected)
    - queryFn: `client.GET("/api/v1/student-health/profile/{studentId}", { params: { path: { studentId: studentId! } } })`
    - `staleTime: 60_000` (1 minute — profile data changes less frequently than dashboard)
    - Return `{ profile, isLoading, isError, error }` where `profile = data?.data ?? null`

- [x] **Task 6: Frontend component — StudentProfileOverlay** (AC: 1, 2)
  - [x] 6.1 Create `apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx`. Props: `studentId: string | null`, `open: boolean`, `onOpenChange: (open: boolean) => void`. Implementation:

    **Structure (uses Sheet component — side drawer from right):**
    ```tsx
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          {/* Student name + health badge */}
        </SheetHeader>
        <ScrollArea className="flex-1">
          {/* Content sections */}
        </ScrollArea>
      </SheetContent>
    </Sheet>
    ```

    **Header section:**
    - Avatar (large, `h-12 w-12`) + student name (bold, `text-lg`) + email (`text-sm text-muted-foreground`)
    - `TrafficLightBadge` with `size="md"` showing overall health status
    - Class badges (same style as StudentHealthCard)

    **Metrics summary (always visible):**
    - Two side-by-side metric cards inside a `grid grid-cols-2 gap-4`:
      - Attendance: rate + `attendedSessions/totalSessions` + colored status dot
      - Assignments: rate + `completedAssignments/totalAssignments` + colored dot
      - Overdue count if > 0: show `"{overdueAssignments} overdue"` in `text-red-600 text-sm`

    **Root Cause Alert (conditional):**
    - If `healthStatus` is `"at-risk"` or `"warning"`, display a prominent alert box:
      - `at-risk`: Red-tinted background (`bg-red-50 border-red-200 text-red-800`)
      - `warning`: Amber-tinted background (`bg-amber-50 border-amber-200 text-amber-800`)
      - Content: explain WHY — e.g., "Attendance below 80% (72.5%)" and/or "Assignment completion below 50% (40%)"
      - Derive from `metrics.attendanceStatus` and `metrics.assignmentStatus` — show the specific metric(s) that triggered the status
    - If `on-track`: no alert box

    **Tabs section (using Shadcn Tabs):**
    - Tab 1: **Trends** — Weekly trend visualization (last 8 weeks)
      - For each week, render a row:
        - Week label (e.g., "Feb 3") — `text-sm text-muted-foreground w-16`
        - Attendance bar: div with `bg-blue-500` and width as percentage, with rate label
        - Completion bar: div with `bg-emerald-500` and width as percentage, with rate label
      - Bars use `h-4 rounded-sm` with the percentage as width (`style={{ width: \`${rate}%\` }}`)
      - Color bars based on threshold: green/amber/red matching health status
      - Legend at top: blue = Attendance, green = Assignments
      - If no trend data: "Not enough data for trends"

    - Tab 2: **Attendance** — Recent attendance history
      - Table/list of recent sessions (up to 30):
        - Date (`text-sm`), Class Name, Status badge:
          - PRESENT → `bg-emerald-100 text-emerald-800`
          - LATE → `bg-amber-100 text-amber-800`
          - EXCUSED → `bg-blue-100 text-blue-800`
          - ABSENT → `bg-red-100 text-red-800`
      - If no records: "No attendance records yet"

    - Tab 3: **Assignments** — Assignment history with scores
      - Table/list of assignments sorted by due date (newest first):
        - Exercise title (bold), Class Name, Skill badge
        - Due date (`text-sm text-muted-foreground`)
        - Status badge:
          - `not-submitted` → `bg-gray-100 text-gray-800` "Not Submitted"
          - `in-progress` → `bg-blue-100 text-blue-800` "In Progress"
          - `submitted` → `bg-amber-100 text-amber-800` "Submitted"
          - `graded` → `bg-emerald-100 text-emerald-800` "Graded"
        - Score (if graded): display as bold number (e.g., "7.5")
        - Overdue indicator: if `dueDate < now && submissionStatus === "not-submitted"`, show `text-red-600 text-xs` "Overdue"
      - If no assignments: "No assignments yet"

    **Loading state:** Show `Skeleton` components matching the layout structure.
    **Error state:** "Failed to load student profile." with Retry button.

  - [x] 6.2 **Imports required:**
    ```typescript
    import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@workspace/ui/components/sheet";
    import { ScrollArea } from "@workspace/ui/components/scroll-area";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
    import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
    import { Badge } from "@workspace/ui/components/badge";
    import { Skeleton } from "@workspace/ui/components/skeleton";
    import { Button } from "@workspace/ui/components/button";
    import { TrafficLightBadge } from "./TrafficLightBadge";
    import { useStudentProfile } from "../hooks/use-student-profile";
    ```

- [x] **Task 7: Integrate overlay into StudentHealthDashboard** (AC: 1, 2)
  - [x] 7.1 Modify `StudentHealthCardComponent` in `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx`:
    - Add `onClick?: () => void` to `StudentHealthCardProps` interface
    - Add `onClick` to the `<Card>` element: `onClick={onClick}`
    - Add `role="button"` and `tabIndex={0}` to `<Card>` for accessibility
    - Add `onKeyDown` handler: Enter/Space triggers `onClick`
    - The card already has `cursor-pointer` and `hover:shadow-md` — no style changes needed

  - [x] 7.2 Modify `StudentHealthDashboard` in `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx`:
    - Add state: `const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)`
    - Pass `onClick` to each `StudentHealthCardComponent`:
      ```tsx
      <StudentHealthCardComponent
        key={student.id}
        student={student}
        onClick={() => setSelectedStudentId(student.id)}
      />
      ```
    - Add `StudentProfileOverlay` at the bottom of the JSX (inside the outer div but after the grid):
      ```tsx
      <StudentProfileOverlay
        studentId={selectedStudentId}
        open={selectedStudentId !== null}
        onOpenChange={(open) => { if (!open) setSelectedStudentId(null); }}
      />
      ```
    - Import `StudentProfileOverlay` from `./StudentProfileOverlay`

- [x] **Task 8: Write tests** (AC: 1, 2)
  - [x] 8.1 Backend: Add tests to existing `student-health.service.test.ts`:
    - `getStudentProfile` returns correct student data (1 test)
    - `getStudentProfile` returns attendance history sorted by date desc (1 test)
    - `getStudentProfile` returns assignment history with scores from feedback (1 test)
    - `getStudentProfile` computes weekly trends for last 8 weeks (1 test)
    - `getStudentProfile` throws 404 for non-existent student (1 test)
    - `getStudentProfile` throws 404 for student in different center (1 test)
    - `getStudentProfile` marks sessions with no attendance record as ABSENT (1 test)
    - `getStudentProfile` returns "not-submitted" for assignments without submissions (1 test)
    - Total: 8 new tests

  - [x] 8.2 Backend: Add integration tests to `student-health.routes.integration.test.ts`:
    - `GET /profile/:studentId` returns 200 with correct shape (1 test)
    - `GET /profile/:studentId` returns 404 for unknown student (1 test)
    - `GET /profile/:studentId` requires OWNER or ADMIN role — Teacher gets 403 (1 test)
    - `GET /profile/:studentId` requires auth — unauthenticated gets 401 (1 test)
    - Total: 4 new tests

  - [x] 8.3 Frontend: Create `apps/webapp/src/features/student-health/__tests__/StudentProfileOverlay.test.tsx`:
    - Renders student name and email when open (1 test)
    - Renders attendance tab with session records (1 test)
    - Renders assignments tab with scores (1 test)
    - Shows root cause alert for at-risk students (1 test)
    - Does not render when closed (1 test)
    - Calls onOpenChange(false) when Sheet is closed (1 test)
    - Total: 6 tests

  - [x] 8.4 Frontend: Create `apps/webapp/src/features/student-health/__tests__/use-student-profile.test.ts`:
    - Returns profile data on success (1 test)
    - Does not fetch when studentId is null (1 test)
    - Returns error state on API failure (1 test)
    - Total: 3 tests

  - [x] 8.5 Frontend: Update `StudentHealthCard.test.tsx` — add test:
    - Calls onClick when card is clicked (1 test)
    - Card is keyboard accessible (Enter triggers onClick) (1 test)
    - Total: 2 new tests

## Dev Notes

### Architecture Compliance

**This story extends the existing student-health module — NO new modules or directories needed.**

**Layered architecture (Route -> Controller -> Service):**
- **Service:** Add `getStudentProfile` method to existing `StudentHealthService`. Handles DB queries and data assembly.
- **Controller:** Add `getStudentProfile` method to existing `StudentHealthController`. Delegates to service, formats `{ data, message }`.
- **Route:** Add `GET /profile/:studentId` to existing `student-health.routes.ts`. Same auth middleware, same error handling.

**Multi-tenancy:** All queries go through `getTenantedClient`. Validate student belongs to the requesting user's center before returning data. Submission queries use explicit `where: { centerId }` (Submission is NOT in TENANTED_MODELS).

**CRITICAL: Do NOT use `getTenantedClient` inside `$transaction`.** This story has no writes, so no transactions needed.

### Data Model Reference

**Submission model** (`packages/db/prisma/schema.prisma`):
```
id, centerId, assignmentId, studentId, status (IN_PROGRESS/SUBMITTED/AI_PROCESSING/GRADED),
startedAt, submittedAt, timeSpentSec, isPriority
Relations: assignment, student, answers, feedback (SubmissionFeedback?), teacherComments
Unique: [assignmentId, studentId]
```

**SubmissionFeedback model:**
```
id, centerId, submissionId (unique), overallScore (Float?),
criteriaScores (Json?), generalFeedback, teacherFinalScore (Float?),
teacherCriteriaScores (Json?), teacherGeneralFeedback
Relation: submission (1:1 via submissionId)
```

**Score display logic:** `teacherFinalScore ?? overallScore` — teacher's final score takes precedence over AI score. Both may be null (ungraded or no feedback yet).

**Assignment model:**
```
id, centerId, exerciseId, classId, dueDate, status (OPEN/CLOSED/ARCHIVED), createdById
Relations: exercise (includes title, skill), class (includes name), submissions
```

**Attendance model:**
```
id, sessionId, studentId, status (PRESENT/ABSENT/LATE/EXCUSED), markedBy, centerId
```

**ClassSession model:**
```
id, classId, startTime, endTime, status (SCHEDULED/CANCELLED/COMPLETED), centerId
```

### Frontend Overlay Pattern (Sheet Component)

Follow the exact pattern used by `ClassDrawer.tsx` and `ConflictDrawer.tsx`:

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
    <SheetHeader>
      <SheetTitle>Student Name</SheetTitle>
      <SheetDescription>student@email.com</SheetDescription>
    </SheetHeader>
    <ScrollArea className="flex-1">
      {/* Content */}
    </ScrollArea>
  </SheetContent>
</Sheet>
```

**Sheet component is already installed** at `packages/ui/src/components/sheet.tsx`. Uses Radix UI Dialog primitive with slide-in animation. Exports: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`.

**ScrollArea** is available at `packages/ui/src/components/scroll-area.tsx`.
**Tabs** is available at `packages/ui/src/components/tabs.tsx`.

### Trend Visualization (No Charting Library)

Use simple CSS bars — NO new dependencies needed:

```tsx
{/* Each week row */}
<div className="flex items-center gap-2">
  <span className="text-xs text-muted-foreground w-14 shrink-0">{weekLabel}</span>
  <div className="flex-1 space-y-1">
    <div className="h-3 bg-muted rounded-sm overflow-hidden">
      <div
        className={`h-full rounded-sm ${getBarColor(attendanceRate, 'attendance')}`}
        style={{ width: `${attendanceRate}%` }}
      />
    </div>
    <div className="h-3 bg-muted rounded-sm overflow-hidden">
      <div
        className={`h-full rounded-sm ${getBarColor(completionRate, 'completion')}`}
        style={{ width: `${completionRate}%` }}
      />
    </div>
  </div>
  <span className="text-xs w-10 text-right">{attendanceRate}%</span>
</div>
```

Color mapping for bars (reuse same thresholds as health status):
- Attendance: `< 80` → `bg-red-500`, `80-90` → `bg-amber-500`, `≥ 90` → `bg-emerald-500`
- Completion: `< 50` → `bg-red-500`, `50-75` → `bg-amber-500`, `≥ 75` → `bg-emerald-500`

### UX Design Alignment

**"3 Clicks to Rescue" Flow** (from UX specification):
1. Owner sees dashboard (Traffic Light) — Story 6.1 (done)
2. Red flag detected → Owner clicks student card → **THIS STORY**
3. Overlay opens showing root cause (attendance %, completion %, overdue assignments)
4. Owner can take action — Story 6.3 (email intervention, future)

**Root Cause Alert** is the critical UX element. When a student is at-risk or warning, the overlay must immediately and prominently explain WHY:
- Which metric triggered the status
- The specific rate vs. the threshold
- How many sessions missed / assignments overdue

**Overlay Width:** `sm:max-w-xl` (wider than ClassDrawer's `max-w-lg` because profile has more data: tabs, tables, trends).

**Mobile:** Sheet defaults to full-width on mobile (`w-full`). Content naturally stacks.

### RBAC Access Control

| Role | Access | Story |
|------|--------|-------|
| **Owner** | All student profiles in center | 6.2 (this story) |
| **Admin** | All student profiles in center | 6.2 (this story) |
| **Teacher** | Only students in their classes | 6.4 (future) |
| **Student** | No access | — |

The backend route enforces `requireRole(["OWNER", "ADMIN"])`. Same as the dashboard endpoint.

### Existing Code to REUSE (DO NOT RECREATE)

| Component/Service | File | Reuse |
|---|---|---|
| `StudentHealthService` | `apps/backend/src/modules/student-health/student-health.service.ts` | EXTEND — add `getStudentProfile` method |
| `StudentHealthController` | `apps/backend/src/modules/student-health/student-health.controller.ts` | EXTEND — add `getStudentProfile` method |
| `student-health.routes.ts` | `apps/backend/src/modules/student-health/student-health.routes.ts` | EXTEND — add `GET /profile/:studentId` route |
| `TrafficLightBadge` | `apps/webapp/src/features/student-health/components/TrafficLightBadge.tsx` | Use in overlay header |
| `StudentHealthCardComponent` | `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx` | MODIFY — add onClick prop |
| `StudentHealthDashboard` | `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx` | MODIFY — add overlay state + render |
| `studentHealthKeys` | `apps/webapp/src/features/student-health/hooks/student-health-keys.ts` | MODIFY — add `profile` key |
| `Sheet` | `@workspace/ui/components/sheet` | For overlay container |
| `ScrollArea` | `@workspace/ui/components/scroll-area` | For scrollable content |
| `Tabs` | `@workspace/ui/components/tabs` | For Trends/Attendance/Assignments tabs |
| `Avatar` | `@workspace/ui/components/avatar` | For student header |
| `Badge` | `@workspace/ui/components/badge` | For status badges |
| `Skeleton` | `@workspace/ui/components/skeleton` | For loading states |
| `Button` | `@workspace/ui/components/button` | For retry on error |
| `client` | `apps/webapp/src/core/client.ts` | OpenAPI fetch client |
| `AppError` | `apps/backend/src/utils/app-error.ts` | For 404 throws |

### Component Import Paths

```typescript
// Shadcn
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@workspace/ui/components/sheet";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";

// Icons
import { Calendar, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";

// Internal
import { TrafficLightBadge } from "./TrafficLightBadge";
import { useStudentProfile } from "../hooks/use-student-profile";
import { client } from "@/core/client";
```

### Backend Import Paths

**Routes file** — existing imports already in `student-health.routes.ts` (add `StudentProfileApiResponseSchema` to the types import):
```typescript
// Already imported — DO NOT duplicate:
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { AppError } from "../../utils/app-error";
import { mapPrismaError } from "../../utils/prisma-error";
import {
  StudentHealthDashboardQuerySchema,
  StudentHealthDashboardApiResponseSchema,
  StudentProfileApiResponseSchema,  // <-- ADD THIS to existing import
} from "@workspace/types";
import { ErrorResponseSchema } from "../../schemas/error.schema"; // verify exact path in file
```

**Service file** — existing imports already in `student-health.service.ts`:
```typescript
// Already imported — DO NOT duplicate:
import { getTenantedClient } from "@workspace/db";
import type { PrismaClient } from "@prisma/client";

// ADD for 404 error:
import { AppError } from "../../utils/app-error";
```

**AppError API** (constructor requires 3 args, prefer static factories):
```typescript
// CORRECT usage:
throw AppError.notFound("Student not found");    // 404
throw AppError.badRequest("Center ID required");  // 400
throw AppError.forbidden("Access denied");         // 403

// Also valid but verbose:
throw new AppError(404, "NOT_FOUND", "Student not found");
```

### Existing Dependencies (NO NEW PACKAGES NEEDED)

All UI components (Sheet, ScrollArea, Tabs, Badge, Avatar, Skeleton, Button) and icons (lucide-react) are already installed. No new npm packages required.

### Performance Considerations

**Backend:**
- Single student profile: ~5-6 Prisma queries (student, enrollments, sessions, attendance, assignments, submissions+feedback)
- Attendance history limited to last 30 sessions — prevents unbounded growth
- Weekly trends computed from already-fetched data — no extra queries
- Target: < 300ms response time

**Frontend:**
- `useStudentProfile` with `enabled: !!studentId` — only fetches when overlay opens
- `staleTime: 60_000` — 1 minute cache for profile data (user unlikely to open same profile rapidly)
- Sheet component renders lazily (only when `open=true`)
- No re-renders of background dashboard while overlay is open (scroll position preserved per AC2)

### Scope Boundaries — What This Story Does NOT Implement

| Feature | Story | Status |
|---------|-------|--------|
| Email intervention (contact parent button) | 6.3 | Backlog |
| Teacher scoped health view | 6.4 | Backlog |
| Edit student profile from overlay | — | Not planned |
| Historical trend charts (recharts/visx) | Future | — |
| Export student data | Future | — |
| Real-time updates | Future | — |

### Previous Story Intelligence

**From Story 6-1 (Traffic Light Dashboard — most recent in this epic):**
- Backend: `StudentHealthService` has ONE public method `getDashboard()` with ALL computation inline (no private helpers). Uses `private readonly prisma: PrismaClient` constructor pattern. `getTenantedClient(this.prisma, centerId)` called ONCE per request. Submission queries use explicit `where: { centerId }` on `this.prisma.submission.findMany` (NOT tenanted client).
- Controller: `StudentHealthController` has ONE method `getDashboard()`. Thin delegation pattern: `{ data: result, message: "..." }`. Constructor takes `StudentHealthService`.
- Routes: `studentHealthRoutes` function creates `api = fastify.withTypeProvider<ZodTypeProvider>()`. Uses `api.get()` with `{ schema, preHandler, handler }` object. `handleRouteError` defined locally. `ErrorResponseSchema` used for all error status codes. Response uses `StudentHealthDashboardApiResponseSchema` (wrapper via `createResponseSchema`).
- Frontend: `StudentHealthCardComponent` exported via `memo()`. Already has `cursor-pointer` and `hover:shadow-md` — ready for onClick addition. Dashboard uses debounced search and client-side status filtering.
- Tests: 14 service tests, 5 route integration tests, 6+3+3 frontend tests. Backend total: 775. Frontend total: 838.
- The StudentHealthCard was explicitly designed with "Story 6.2 will add onClick" in mind — see 6-1 Task 6.3 notes.

**From Git history (last 5 commits):**
```
41ab486 fix: Story 6-1 code review — class filter caching, orchestrator tests, hook error return
34630cc feat: Story 6-1 — Traffic Light Student Health Dashboard with lint/test fixes
6644667 feat: Story 5-6 — Student Feedback View with code review fixes
3ccc920 feat: Story 5-5 — Grading Queue Management with code review fixes
9496d82 feat: Story 5-4 — One-Click Approval Loop with code review fixes
```

Commit convention: `feat: Story X-Y — Description with code review fixes`

### Project Structure Notes

```
apps/backend/src/modules/student-health/
├── student-health.service.ts               # MODIFIED — add getStudentProfile method
├── student-health.controller.ts            # MODIFIED — add getStudentProfile method
├── student-health.routes.ts                # MODIFIED — add GET /profile/:studentId
├── student-health.service.test.ts          # MODIFIED — add 8 new tests
├── student-health.routes.integration.test.ts # MODIFIED — add 4 new tests
└── index.ts                                # No change

apps/webapp/src/features/student-health/
├── components/
│   ├── StudentHealthDashboard.tsx           # MODIFIED — add overlay state + render
│   ├── StudentHealthCard.tsx                # MODIFIED — add onClick prop
│   ├── StudentProfileOverlay.tsx            # NEW — Sheet overlay component
│   ├── HealthSummaryBar.tsx                 # No change
│   └── TrafficLightBadge.tsx                # No change
├── hooks/
│   ├── student-health-keys.ts              # MODIFIED — add profile key
│   ├── use-student-health-dashboard.ts     # No change
│   └── use-student-profile.ts              # NEW — TanStack Query hook
└── __tests__/
    ├── StudentProfileOverlay.test.tsx       # NEW — 6 tests
    ├── use-student-profile.test.ts          # NEW — 3 tests
    ├── StudentHealthCard.test.tsx           # MODIFIED — add 2 tests
    ├── HealthSummaryBar.test.tsx            # No change
    └── use-student-health-dashboard.test.ts # No change

packages/types/src/
├── student-health.ts                       # MODIFIED — add profile schemas
└── index.ts                                # No change (already exports student-health)

apps/webapp/src/schema/
└── schema.d.ts                             # REGENERATED (auto-generated)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Story 6.2 (FR28)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — "3 Clicks to Rescue" Insight Flow, Student Profile Overlay, Sheet/Overlay patterns]
- [Source: _bmad-output/planning-artifacts/information-architecture.md — Owner route /students/:id, drill-down navigation]
- [Source: _bmad-output/planning-artifacts/architecture.md — REST API patterns, multi-tenancy, module structure]
- [Source: project-context.md — Route-Controller-Service, getTenantedClient, Prisma conventions, no $transaction with getTenantedClient]
- [Source: apps/backend/src/modules/student-health/student-health.service.ts — Existing service to extend]
- [Source: apps/backend/src/modules/student-health/student-health.routes.ts — Existing routes to extend]
- [Source: apps/webapp/src/features/student-health/components/StudentHealthCard.tsx — Card with cursor-pointer, no onClick yet]
- [Source: apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx — Dashboard orchestrator to extend]
- [Source: apps/webapp/src/features/logistics/components/ClassDrawer.tsx — Sheet usage pattern reference]
- [Source: apps/webapp/src/features/logistics/components/ConflictDrawer.tsx — Sheet usage pattern reference]
- [Source: packages/db/prisma/schema.prisma — Submission, SubmissionFeedback, Attendance, ClassSession, Assignment models]
- [Source: _bmad-output/implementation-artifacts/6-1-traffic-light-dashboard.md — Previous story learnings and patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No issues encountered during implementation.

### Completion Notes List

- Task 1: Added 5 new Zod schemas (StudentAttendanceRecord, StudentAssignmentRecord, WeeklyTrendPoint, StudentProfileResponse, StudentProfileApiResponse) to `packages/types/src/student-health.ts`. Types package builds clean.
- Task 2: Added `getStudentProfile` method to `StudentHealthService`. Reuses existing module-scope threshold functions. Follows tenanted client pattern. Submission queries use explicit centerId. Computes attendance history (last 30 sessions), assignment history with scores (teacherFinalScore precedence), and 8-week trends.
- Task 3: Added `getStudentProfile` to controller (thin delegation). Added `GET /profile/:studentId` route with ZodTypeProvider, requireRole(OWNER/ADMIN), 404 response schema.
- Task 4: Schema synced — `schema.d.ts` includes new endpoint.
- Task 5: Added `profile` query key to `studentHealthKeys`. Created `useStudentProfile` hook with `enabled: !!studentId` and `staleTime: 60_000`.
- Task 6: Created `StudentProfileOverlay` component — Sheet/slide-over with header (avatar, name, health badge, classes), metrics summary, root cause alert (conditional), and three tabs (Trends with CSS bars, Attendance with status badges, Assignments with scores/overdue). Loading skeleton and error state included.
- Task 7: Added `onClick` prop to `StudentHealthCardComponent` with keyboard accessibility (Enter/Space). Added overlay state to dashboard with `selectedStudentId`.
- Task 8: 23 new tests total — 8 service unit tests, 4 route integration tests, 6 overlay component tests, 3 hook tests, 2 card interaction tests. All 787 backend + 860 frontend tests pass. Lint clean.

### Change Log

- 2026-02-18: Story 6.2 — Student Profile Overlay implemented (all 8 tasks complete)
- 2026-02-18: Code review fixes applied (9 issues: 2 HIGH, 6 MEDIUM, 1 LOW)
  - H1: Fixed weekly trends completion logic — IN_PROGRESS no longer counted as completed
  - H2: Fixed error retry button (was no-op) — now calls refetch()
  - M1: Noted assignment query performance optimization (deferred to future)
  - M2: Fixed overdue count inconsistency — aligned with dashboard submission status filtering
  - M3: Added completion rate labels to trend bars
  - M4: Fixed trend legend/bar color mismatch — bars now use fixed colors matching legend
  - M5: Exposed refetch from useStudentProfile hook
  - M6: Added dashboard→overlay click interaction test
  - L1: Service 404 tests now assert statusCode + message via toMatchObject

### File List

**Modified:**
- `packages/types/src/student-health.ts` — Added profile schemas
- `apps/backend/src/modules/student-health/student-health.service.ts` — Added getStudentProfile method
- `apps/backend/src/modules/student-health/student-health.controller.ts` — Added getStudentProfile method
- `apps/backend/src/modules/student-health/student-health.routes.ts` — Added GET /profile/:studentId route
- `apps/backend/src/modules/student-health/student-health.service.test.ts` — Added 8 tests
- `apps/backend/src/modules/student-health/student-health.routes.integration.test.ts` — Added 4 tests
- `apps/webapp/src/features/student-health/hooks/student-health-keys.ts` — Added profile key
- `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx` — Added onClick prop + keyboard a11y
- `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx` — Added overlay state + render
- `apps/webapp/src/features/student-health/__tests__/StudentHealthCard.test.tsx` — Added 2 tests
- `apps/webapp/src/features/student-health/__tests__/StudentHealthDashboard.test.tsx` — Added useStudentProfile mock
- `apps/webapp/src/schema/schema.d.ts` — Regenerated (auto-generated)

**New:**
- `apps/webapp/src/features/student-health/hooks/use-student-profile.ts` — TanStack Query hook
- `apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx` — Sheet overlay component
- `apps/webapp/src/features/student-health/__tests__/StudentProfileOverlay.test.tsx` — 6 tests
- `apps/webapp/src/features/student-health/__tests__/use-student-profile.test.ts` — 3 tests
