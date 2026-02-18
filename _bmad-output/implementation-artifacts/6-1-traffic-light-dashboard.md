# Story 6.1: Traffic Light Dashboard

Status: done

## Story

As a Teaching Owner,
I want to see a high-level summary of student performance,
so that I can identify at-risk students in seconds.

## Acceptance Criteria

1. **AC1: Student Cards with Color-Coded Status** — Dashboard displays student cards with color-coded status: Red (At-Risk), Yellow (Warning), Green (On Track). Each card shows student name, avatar, health status indicator, attendance percentage, and assignment completion rate.
2. **AC2: Status Calculation** — Status is calculated from attendance and assignment completion. Attendance: < 80% = Red, 80-90% = Yellow, > 90% = Green. Assignment completion: < 50% = Red, 50-75% = Yellow, > 75% = Green. Overall status = worst of both metrics. Students with no data default to Green.
3. **AC3: Performance** — Widget data updates in < 1 second on page load. Single API call fetches all data. Frontend renders immediately from cache on subsequent visits (TanStack Query staleTime).

## Tasks / Subtasks

- [x] **Task 1: Shared types — Student health schemas** (AC: 1, 2)
  - [x] 1.1 Create `packages/types/src/student-health.ts`. Define schemas:
    - `HealthStatusSchema = z.enum(["at-risk", "warning", "on-track"])`
    - `StudentHealthMetricsSchema = z.object({ attendanceRate: z.number(), attendanceStatus: HealthStatusSchema, totalSessions: z.number(), attendedSessions: z.number(), assignmentCompletionRate: z.number(), assignmentStatus: HealthStatusSchema, totalAssignments: z.number(), completedAssignments: z.number(), overdueAssignments: z.number() })`
    - `StudentHealthCardSchema = z.object({ id: z.string(), name: z.string().nullable(), email: z.string().nullable(), avatarUrl: z.string().nullable(), healthStatus: HealthStatusSchema, metrics: StudentHealthMetricsSchema, classes: z.array(z.object({ id: z.string(), name: z.string() })) })`
    - `HealthSummarySchema = z.object({ total: z.number(), atRisk: z.number(), warning: z.number(), onTrack: z.number() })`
    - `StudentHealthDashboardResponseSchema = z.object({ students: z.array(StudentHealthCardSchema), summary: HealthSummarySchema })`
    - `StudentHealthDashboardQuerySchema = z.object({ classId: z.string().optional(), search: z.string().optional() })`
    - Export all schemas and inferred types
  - [x] 1.2 Add export to `packages/types/src/index.ts`: `export * from "./student-health.js";` (NOTE: must use `.js` extension to match existing pattern — all exports use `.js` suffix)
  - [x] 1.3 Build types package: `pnpm --filter=types build`

- [x] **Task 2: Backend service — Student health computation** (AC: 1, 2, 3)
  - [x] 2.1 Create directory: `apps/backend/src/modules/student-health/`
  - [x] 2.2 Create `apps/backend/src/modules/student-health/student-health.service.ts`. Class `StudentHealthService` with constructor accepting `prisma: PrismaClient`. Single public method `getDashboard(centerId: string, filters: { classId?: string, search?: string })`. Implementation:

    **Step A — Get all students in center:**
    ```
    Query CenterMembership where role = 'STUDENT' AND status = 'ACTIVE',
    include user (id, name, email, avatarUrl).
    If search filter: add where user.name contains search (case-insensitive mode: 'insensitive').
    CRITICAL: Filter by status = 'ACTIVE' to exclude deactivated students.
    ```

    **Step B — Get enrollment data:**
    ```
    Query ClassStudent for all studentIds found in Step A.
    Include class (id, name) for display.
    If classId filter: only return enrollments for that class, and only include students enrolled in that class.
    Build Map<studentId, Array<{ classId, className }>>.
    ```

    **Step C — Compute attendance metrics (batched):**
    ```
    Query all past, non-cancelled ClassSessions in center:
      where: { startTime: { lte: now }, status: { not: 'CANCELLED' } }
      select: { id, classId }

    Query all Attendance records for our students:
      where: { studentId: { in: studentIds } }
      select: { studentId, sessionId, status }

    For each student:
      - expectedSessions = sessions where classId is in student's enrolled classes
      - attendedSessions = attendance records where status in [PRESENT, LATE, EXCUSED]
      - attendanceRate = Math.round((attended / expected) * 1000) / 10 (round to 1 decimal, same formula as attendance.service.ts)
      - If expected = 0, attendanceRate = 100 (no data = healthy)

    Apply thresholds:
      - < 80 → "at-risk"
      - 80-90 → "warning"
      - > 90 → "on-track"
    ```

    **Step D — Compute assignment completion metrics (batched):**
    ```
    Query Assignments in center where status in [OPEN, CLOSED, ARCHIVED]:
      select: { id, classId, dueDate }

    Query AssignmentStudent records for our students:
      select: { assignmentId, studentId }

    For each student:
      - totalAssignments = assignments where:
        (a) classId in student's enrolled classes, OR
        (b) student has an AssignmentStudent record
      - Query Submissions for this center where studentId in studentIds
        and status in [SUBMITTED, AI_PROCESSING, GRADED]:
        select: { studentId, assignmentId }
      - completedAssignments = submissions matching an assignment (note: Submission has @@unique([assignmentId, studentId]) so max one submission per student per assignment — just check existence)
      - overdueAssignments = totalAssignments where dueDate < now AND no submission
      - completionRate = Math.round((completed / total) * 1000) / 10 (same rounding pattern)
      - If total = 0, completionRate = 100 (no assignments = healthy)

    Apply thresholds:
      - < 50 → "at-risk"
      - 50-75 → "warning"
      - > 75 → "on-track"
    ```

    **Step E — Compute overall health status:**
    ```
    For each student:
      overallStatus = worst(attendanceStatus, assignmentStatus)
      Priority: at-risk > warning > on-track
    ```

    **Step F — Build response:**
    ```
    Sort students: at-risk first, then warning, then on-track.
    Within each group, sort alphabetically by name.
    Compute summary: { total, atRisk, warning, onTrack } counts.
    Return { students, summary }.
    ```

    **CRITICAL:** Use `getTenantedClient(this.prisma, centerId)` for ALL queries. Do NOT use `$transaction` (no writes, so unnecessary). Do NOT call `getTenantedClient` inside loops — call it ONCE and reuse the client.

    **PERFORMANCE:** All data is fetched in 5-6 parallel Prisma queries (members, enrollments, sessions, attendance, assignments, submissions). JS-side computation is O(students * classes). For a center with 150 students and 20 classes, this completes in < 200ms.

  - [x] 2.3 **Health threshold constants** — define at top of service file:
    ```
    const ATTENDANCE_THRESHOLDS = { AT_RISK: 80, WARNING: 90 };
    const COMPLETION_THRESHOLDS = { AT_RISK: 50, WARNING: 75 };
    ```
    Comparison: `rate < AT_RISK` → at-risk, `rate >= AT_RISK && rate < WARNING` → warning, `rate >= WARNING` → on-track. So 80% attendance = warning, 90% attendance = on-track. Same logic for completion thresholds.
    These are used for status calculation. Hardcoded for now, configurable per-center in future.

- [x] **Task 3: Backend controller + routes** (AC: 1, 3)
  - [x] 3.1 Create `apps/backend/src/modules/student-health/student-health.controller.ts`. Class `StudentHealthController` with constructor accepting `StudentHealthService`. Method `getDashboard(centerId, filters)` — delegates to service, returns `{ data: result, message: "Student health dashboard loaded" }`. Serialize any dates to ISO strings.
  - [x] 3.2 Create `apps/backend/src/modules/student-health/student-health.routes.ts`. Register one route:
    - `GET /api/v1/student-health/dashboard` — query: `StudentHealthDashboardQuerySchema`, response: wrapped `StudentHealthDashboardResponseSchema`, auth: requires `OWNER` or `ADMIN` role (NOT Teacher — that's Story 6.4).
    - **Auth pattern:** Import `authMiddleware` from `../../middlewares/auth.middleware` and `requireRole` from `../../middlewares/role.middleware`. Apply `authMiddleware` as a module-level hook: `fastify.addHook("preHandler", authMiddleware)`. Apply `requireRole` per-route: `preHandler: [requireRole(["OWNER", "ADMIN"])]`.
    - **JWT centerId:** Extract via `request.jwtPayload!.centerId`. MUST check for null: if `!centerId`, return 400 "Center ID required".
    - **Error handling:** Use `handleRouteError(error, request, reply)` pattern (see existing routes). Import `AppError` from `../../utils/app-error` and `mapPrismaError` from `../../utils/prisma-error`. Define local `handleRouteError` function or import from shared utils.
  - [x] 3.3 Create `apps/backend/src/modules/student-health/index.ts` — export the route registration function.
  - [x] 3.4 Register the module in `apps/backend/src/app.ts` — import and register the student-health routes plugin with prefix `/api/v1/student-health`. Follow the same registration pattern as other modules (e.g., logistics, grading). The module plugin should instantiate `StudentHealthService` and `StudentHealthController` in its register function, same as other modules.

- [x] **Task 4: Schema sync — Regenerate frontend types** (AC: 3)
  - [x] 4.1 Start the backend: `pnpm --filter=backend dev`
  - [x] 4.2 Generate frontend schema: `pnpm --filter=webapp sync-schema-dev`
  - [x] 4.3 Verify `apps/webapp/src/schema/schema.d.ts` includes the student-health endpoint and response types

- [x] **Task 5: Frontend hook — useStudentHealthDashboard** (AC: 1, 3)
  - [x] 5.1 Create directory: `apps/webapp/src/features/student-health/`
  - [x] 5.2 Create `apps/webapp/src/features/student-health/hooks/student-health-keys.ts`. Define query keys:
    ```
    export const studentHealthKeys = {
      all: ["student-health"] as const,
      dashboard: (filters?: { classId?: string; search?: string }) =>
        [...studentHealthKeys.all, "dashboard", filters] as const,
    };
    ```
  - [x] 5.3 Create `apps/webapp/src/features/student-health/hooks/use-student-health-dashboard.ts`. Export `useStudentHealthDashboard(filters?: { classId?: string; search?: string })`. Implementation:
    - Use `useQuery` with `studentHealthKeys.dashboard(filters)`
    - queryFn: `client.GET("/api/v1/student-health/dashboard", { params: { query: filters } })`
    - `staleTime: 30_000` (30 seconds — fresh enough for dashboard, prevents unnecessary refetches)
    - `refetchOnWindowFocus: true` (refresh when owner returns to tab)
    - Return `{ students, summary, isLoading, isError, error }`
    - Derive `students` and `summary` from `data?.data` with defaults (`[]` and `{ total: 0, atRisk: 0, warning: 0, onTrack: 0 }`)

- [x] **Task 6: Frontend components — Dashboard UI** (AC: 1, 2)
  - [x] 6.1 Create `apps/webapp/src/features/student-health/components/TrafficLightBadge.tsx`. Props: `status: HealthStatus`, `size?: "sm" | "md"`. Renders a colored dot + label:
    - `at-risk` → `bg-red-500` dot + "At Risk" text in `text-red-700`
    - `warning` → `bg-amber-500` dot + "Warning" text in `text-amber-700`
    - `on-track` → `bg-emerald-500` dot + "On Track" text in `text-emerald-700`
    - Dot: `w-2.5 h-2.5 rounded-full` (sm) or `w-3 h-3 rounded-full` (md)
    - Use `aria-label` for accessibility: "Student status: at risk"

  - [x] 6.2 Create `apps/webapp/src/features/student-health/components/HealthSummaryBar.tsx`. Props: `summary: HealthSummary`, `isLoading: boolean`. Renders a horizontal bar with 4 metric cards:
    - **Total Students**: `summary.total` with `Users` icon from lucide-react
    - **At Risk**: `summary.atRisk` with red badge styling, `AlertTriangle` icon
    - **Warning**: `summary.warning` with amber badge styling, `AlertCircle` icon
    - **On Track**: `summary.onTrack` with emerald badge styling, `CheckCircle` icon
    - Layout: `grid grid-cols-2 md:grid-cols-4 gap-4`
    - Each card: shadcn `Card` with `CardContent`, number prominently displayed (`text-2xl font-bold`), label below (`text-sm text-muted-foreground`)
    - Loading state: show `Skeleton` (from `@workspace/ui/components/skeleton`) for each card
    - Each metric card is clickable — clicking filters the student list below to that status. Implement via `onFilterClick?: (status: HealthStatus | null) => void` prop. Clicking "Total" clears filter (passes null)

  - [x] 6.3 Create `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx`. Props: `student: StudentHealthCard` (from types). Renders:
    - shadcn `Card` with subtle left border color matching health status:
      - `at-risk` → `border-l-4 border-l-red-500`
      - `warning` → `border-l-4 border-l-amber-500`
      - `on-track` → `border-l-4 border-l-emerald-500`
    - Header row: `Avatar` (from `@workspace/ui/components/avatar`) with initials fallback + student name (bold) + `TrafficLightBadge`
    - Metrics row (two columns):
      - Left: "Attendance" label + `student.metrics.attendanceRate`% + small colored dot for status
      - Right: "Assignments" label + `student.metrics.completedAssignments`/`student.metrics.totalAssignments` completed + small colored dot for status
    - Bottom: class names as `Badge` chips (max 3, "+N more" overflow)
    - **Cursor pointer** with `hover:shadow-md transition-shadow` — the card itself will be clickable in Story 6.2 (Student Profile Overlay). For now, clicking does nothing. DO NOT add an onClick handler — Story 6.2 will add it
    - `React.memo` for performance

  - [x] 6.4 Create `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx`. The main dashboard component that orchestrates everything. Props: `none` (fetches its own data). Implementation:
    - State: `const [filters, setFilters] = useState<{ classId?: string; search?: string; statusFilter?: HealthStatus }>({})` for class filter and search
    - Use `useStudentHealthDashboard(filters)` hook
    - **Layout:**
      1. Page heading: "Student Health" with subtitle "At-a-glance view of student engagement"
      2. `HealthSummaryBar` with summary data
      3. Filter row: Search input (`Input` from `@workspace/ui/components/input`, placeholder "Search by name...", with `Search` icon from lucide-react) + Class filter (`Select` from `@workspace/ui/components/select`, populated from distinct classes in the response data, "All Classes" default)
      4. Student cards grid: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
    - **Filtering logic:** Client-side filter by `statusFilter` (from summary bar clicks). Server-side filter by `classId` and `search` (passed to API).
    - **Empty states:**
      - No students: "No students enrolled yet. Invite students to your center to see their health status."
      - No results (with filters): "No students match your filters."
    - **Loading state:** `HealthSummaryBar` with skeletons + grid of 6 `Skeleton` cards
    - **Error state:** "Failed to load student health data. Please try again." with `Button` to `refetch()`
    - Use `useDebouncedValue` (or simple `useEffect` with 300ms debounce) for search input to prevent excessive API calls

- [x] **Task 7: Refactor OwnerDashboard** (AC: 1)
  - [x] 7.1 Replace the entire contents of `apps/webapp/src/features/dashboard/components/OwnerDashboard.tsx`. Remove the hardcoded metric cards. Import and render `StudentHealthDashboard` from `@/features/student-health/components/StudentHealthDashboard`. The OwnerDashboard becomes a thin wrapper:
    ```tsx
    import { StudentHealthDashboard } from "@/features/student-health/components/StudentHealthDashboard";

    export default function OwnerDashboard() {
      return <StudentHealthDashboard />;
    }
    ```
    **CRITICAL:** Must use `export default` (not named export) to match the existing `lazy(() => import("./components/OwnerDashboard"))` in DashboardPage.tsx.
    This keeps the dashboard shell routing intact while delegating to the feature module.
  - [x] 7.2 In `apps/webapp/src/features/dashboard/DashboardPage.tsx`, the dashboard uses **separate** `RBACWrapper` blocks for each role (OWNER, TEACHER, STUDENT). ADMIN is NOT handled — ADMIN users currently see "Unknown Role". Fix by adding a new `RBACWrapper` block for ADMIN that also renders OwnerDashboard:
    ```tsx
    <RBACWrapper requiredRoles={["OWNER"]}>
      <Suspense fallback={<DashboardSkeleton />}><OwnerDashboard /></Suspense>
    </RBACWrapper>
    <RBACWrapper requiredRoles={["ADMIN"]}>
      <Suspense fallback={<DashboardSkeleton />}><OwnerDashboard /></Suspense>
    </RBACWrapper>
    ```
    Also update the unknown role check at the bottom to include "ADMIN" in the known roles array.

- [x] **Task 8: Write tests** (AC: 1, 2, 3)
  - [x] 8.1 Backend: `student-health.service.test.ts` — test health status computation:
    - Test attendance thresholds: < 80% → at-risk, 80-90% → warning, > 90% → on-track (3 tests)
    - Test assignment completion thresholds: < 50% → at-risk, 50-75% → warning, > 75% → on-track (3 tests)
    - Test overall status = worst of both metrics (3 tests: red+green=red, yellow+green=yellow, green+green=green)
    - Test empty data defaults to on-track (1 test)
    - Test classId filter scopes students to that class (1 test)
    - Test search filter by name (1 test)
    - Test summary counts are correct (1 test)
    - Test deactivated students are excluded from results (1 test)
    - Total: 14 tests
  - [x] 8.2 Backend: `student-health.routes.integration.test.ts` — test endpoint:
    - GET /dashboard returns 200 with correct shape (1 test)
    - GET /dashboard with classId filter (1 test)
    - GET /dashboard requires OWNER or ADMIN role — Teacher gets 403 (1 test)
    - GET /dashboard requires auth — unauthenticated gets 401 (1 test)
    - GET /dashboard with null centerId returns 400 (1 test)
    - Total: 5 tests
  - [x] 8.3 Frontend: `StudentHealthCard.test.tsx` — test component rendering:
    - Renders student name and avatar (1 test)
    - Renders correct border color for each health status (3 tests)
    - Renders attendance and assignment metrics (1 test)
    - Renders class badges with overflow (1 test)
    - Total: 6 tests
  - [x] 8.4 Frontend: `HealthSummaryBar.test.tsx` — test summary rendering:
    - Renders all 4 metric counts (1 test)
    - Renders loading skeletons (1 test)
    - Click triggers filter callback (1 test)
    - Total: 3 tests
  - [x] 8.5 Frontend: `use-student-health-dashboard.test.ts` — test hook:
    - Returns students and summary on success (1 test)
    - Returns loading state (1 test)
    - Returns error state on API failure (1 test)
    - Total: 3 tests

## Dev Notes

### Architecture Compliance

**This is a FULL-STACK story.** New backend module, shared type definitions, and frontend feature.

**Layered architecture pattern (Route -> Controller -> Service):**
- **Service:** Handles DB operations via `getTenantedClient(this.prisma, centerId)`. Contains health computation logic.
- **Controller:** Orchestrates service calls, formats standard `{ data, message }` response.
- **Route:** Handles Fastify request/reply, extracts centerId from JWT, calls controller, maps errors to HTTP status codes.

**Multi-tenancy:** All queries go through `getTenantedClient`. The `centerId` column ensures tenant isolation. Call `getTenantedClient` ONCE per request and reuse.

**CRITICAL: Do NOT use `getTenantedClient` inside `$transaction`.** This story has no writes, so no transactions needed. But be aware of this rule from project-context.md.

### Health Status Calculation Algorithm

```
ATTENDANCE THRESHOLDS (AT_RISK=80, WARNING=90):
  rate < 80   → "at-risk"  (Red)
  rate >= 80 && rate < 90 → "warning"  (Yellow)
  rate >= 90  → "on-track" (Green)
  0 sessions  → "on-track" (no data = healthy)

ASSIGNMENT COMPLETION THRESHOLDS (AT_RISK=50, WARNING=75):
  rate < 50   → "at-risk"  (Red)
  rate >= 50 && rate < 75 → "warning"  (Yellow)
  rate >= 75  → "on-track" (Green)
  0 assignments → "on-track" (no data = healthy)

OVERALL STATUS:
  worst(attendanceStatus, assignmentStatus)
  Priority: at-risk > warning > on-track

ATTENDANCE FORMULA (same as existing attendance.service.ts):
  attended = records where status in [PRESENT, LATE, EXCUSED]
  expected = past non-cancelled sessions for enrolled classes
  rate = (attended / expected) * 100

ASSIGNMENT COMPLETION FORMULA:
  total = assignments for enrolled classes + direct AssignmentStudent entries
  completed = submissions with status in [SUBMITTED, AI_PROCESSING, GRADED]
  rate = (completed / total) * 100
  overdue = total where dueDate < now AND no matching submission
```

### Data Flow

```
1. Owner opens Dashboard → DashboardPage renders OwnerDashboard
2. OwnerDashboard renders StudentHealthDashboard
3. StudentHealthDashboard calls useStudentHealthDashboard()
4. Hook calls GET /api/v1/student-health/dashboard
5. Backend service runs 6 batched Prisma queries:
   a. CenterMembership (students in center)
   b. ClassStudent (enrollments + class names)
   c. ClassSession (past non-cancelled sessions)
   d. Attendance (all records for students)
   e. Assignment (all in center)
   f. Submission (completed submissions for students)
6. JS computes per-student metrics + summary
7. Returns sorted list (at-risk first) + summary counts
8. Frontend renders HealthSummaryBar + StudentHealthCard grid
```

### Performance Strategy (NFR2: < 1 second)

**Backend:**
- 6 batch queries instead of N+1 per student
- All queries use indexed columns (centerId, studentId)
- JS-side computation is O(students * classes) — negligible for 150 students
- Target: < 200ms server response time

**Frontend:**
- Single API call for entire dashboard
- TanStack Query with `staleTime: 30_000` (cache for 30 seconds)
- `refetchOnWindowFocus: true` for freshness
- React.memo on StudentHealthCard to prevent re-renders during filtering

### RBAC Access Control

| Role | Access | Story |
|------|--------|-------|
| **Owner** | All students in center | 6.1 (this story) |
| **Admin** | All students in center | 6.1 (this story) |
| **Teacher** | Only students in their classes | 6.4 (future) |
| **Student** | No access | — |

The backend route enforces `requireRole(["OWNER", "ADMIN"])`. Story 6.4 will add Teacher access with scoped filtering.

### Existing Code to REUSE (DO NOT RECREATE)

| Component/Service | File | Reuse |
|---|---|---|
| `AttendanceService.getStudentAttendanceStats` | `apps/backend/src/modules/logistics/attendance.service.ts` | Reference ONLY — uses same formula but is per-student. Our service does batch computation. Do NOT call this method per-student (N+1 problem) |
| `RBACWrapper` | `apps/webapp/src/core/components/RBACWrapper.tsx` | Already used in DashboardPage.tsx for role routing — no changes needed |
| `DashboardPage` | `apps/webapp/src/features/dashboard/DashboardPage.tsx` | Renders OwnerDashboard for OWNER role — MODIFIED in Task 7.2 to add ADMIN support |
| `useAuth` | `apps/webapp/src/features/auth/auth-context.tsx` | Get current user role and centerId |
| `client` | `apps/webapp/src/core/client.ts` | OpenAPI fetch client with auth middleware |
| `Avatar` | `@workspace/ui/components/avatar` | For student cards |
| `Card` | `@workspace/ui/components/card` | For student cards and summary cards |
| `Badge` | `@workspace/ui/components/badge` | For class name chips |
| `Input` | `@workspace/ui/components/input` | For search filter |
| `Select` | `@workspace/ui/components/select` | For class filter |
| `Skeleton` | `@workspace/ui/components/skeleton` | For loading states |
| `Button` | `@workspace/ui/components/button` | For retry on error |

### Existing Backend Patterns to Follow

**Module registration pattern** (from `apps/backend/src/app.ts`):
```typescript
// Each module is a Fastify plugin registered with await + prefix
import { studentHealthRoutes } from "./modules/student-health";
await app.register(studentHealthRoutes, { prefix: "/api/v1/student-health" });
```

**Route file pattern** (from `attendance.routes.ts` / `assignments.routes.ts`):
```typescript
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { AppError } from "../../utils/app-error";
import { mapPrismaError } from "../../utils/prisma-error";

function handleRouteError(error: unknown, request: { log: { error: (e: unknown) => void } }, reply: FastifyReply) {
  request.log.error(error);
  if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
  const mapped = mapPrismaError(error);
  if (mapped) return reply.status(mapped.statusCode).send({ message: mapped.message });
  return reply.status(500).send({ message: "Internal server error" });
}

export async function studentHealthRoutes(fastify: FastifyInstance) {
  // Module-level auth hook (all routes in this module require auth)
  fastify.addHook("preHandler", authMiddleware);

  const service = new StudentHealthService(fastify.prisma);
  const controller = new StudentHealthController(service);

  fastify.get("/dashboard", {
    schema: { querystring: StudentHealthDashboardQuerySchema, response: { 200: responseSchema } },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
  }, async (request, reply) => {
    try {
      const centerId = request.jwtPayload!.centerId;
      if (!centerId) return reply.status(400).send({ message: "Center ID required" });
      const filters = request.query as { classId?: string; search?: string };
      const result = await controller.getDashboard(centerId, filters);
      return reply.send(result);
    } catch (error: unknown) {
      return handleRouteError(error, request, reply);
    }
  });
}
```

**Service pattern** (from `attendance.service.ts`):
```typescript
export class StudentHealthService {
  constructor(private prisma: PrismaClient) {}

  async getDashboard(centerId: string, filters: { classId?: string; search?: string }) {
    const db = getTenantedClient(this.prisma, centerId);
    // ... batch queries using db
  }
}
```

### Component Import Paths

```typescript
// shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";

// Icons
import { Search, Users, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

// API client
import { client } from "@/core/client";

// Auth
import { useAuth } from "@/features/auth/auth-context";

// Types
import type { StudentHealthCard, HealthStatus, HealthSummary } from "@workspace/types";
```

### Backend Middleware & Utils Imports

```typescript
// Auth + Role middleware (import directly, NOT from fastify instance)
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

// Error handling
import { AppError } from "../../utils/app-error";
import { mapPrismaError } from "../../utils/prisma-error";

// Tenanted client
import { getTenantedClient } from "@workspace/db";

// Prisma
import type { PrismaClient } from "@prisma/client";
```

### Existing Dependencies (NO NEW PACKAGES NEEDED)

All UI components and icons are already installed. No new npm packages required.

### Scope Boundaries — What This Story Does NOT Implement

| Feature | Story | Status |
|---------|-------|--------|
| Student Profile Overlay (click card → detail) | 6.2 | Backlog |
| Email Intervention Loop (contact parent) | 6.3 | Backlog |
| Teacher Student Health View (scoped) | 6.4 | Backlog |
| Real-time updates (WebSocket/SSE) | Future | — |
| Configurable thresholds per center | Future | — |
| Historical health trends/charts | Future | — |
| Export student health data | Future | — |

### Previous Story Intelligence

**From Story 5-7 (most recent):**
- Backend module pattern: service class with constructor accepting PrismaClient
- Controller pattern: delegates to service, serializes dates, returns `{ data, message }`
- Route pattern: Fastify plugin with schema validation and preHandler auth
- Frontend hooks: TanStack Query with query keys pattern, `client.GET(...)` from openapi-fetch
- Tests: Vitest for both backend and frontend, co-located test files
- Backend test count: 706 passing (as of 5-7 completion)
- Frontend test count: 772 passing (as of 5-7 completion)

**From Git history:**
- Recent commits follow `feat: Story X-Y — Description` format
- Code review fixes are applied in the same commit
- Schema sync is always run after backend changes

### Project Structure Notes

```
apps/backend/src/modules/student-health/    # NEW MODULE
├── student-health.service.ts               # Health computation service
├── student-health.controller.ts            # Response formatting
├── student-health.routes.ts                # Fastify route definitions
├── student-health.service.test.ts          # Service unit tests (14 tests)
├── student-health.routes.integration.test.ts # Route integration tests (5 tests)
└── index.ts                                # Module export

apps/webapp/src/features/student-health/    # NEW FEATURE
├── components/
│   ├── StudentHealthDashboard.tsx           # Main orchestrator component
│   ├── StudentHealthCard.tsx                # Individual student card
│   ├── HealthSummaryBar.tsx                 # Summary metrics bar
│   └── TrafficLightBadge.tsx                # Reusable status indicator
├── hooks/
│   ├── student-health-keys.ts              # Query key definitions
│   └── use-student-health-dashboard.ts     # TanStack Query hook
└── __tests__/
    ├── StudentHealthCard.test.tsx           # 6 tests
    ├── HealthSummaryBar.test.tsx            # 3 tests
    └── use-student-health-dashboard.test.ts # 3 tests

apps/webapp/src/features/dashboard/
├── DashboardPage.tsx                       # MODIFIED — add ADMIN to OwnerDashboard requiredRoles
└── components/
    └── OwnerDashboard.tsx                  # MODIFIED — replace hardcoded cards

packages/types/src/
├── student-health.ts                       # NEW — health schemas
└── index.ts                                # MODIFIED — add export

apps/backend/src/
└── app.ts                                  # MODIFIED — register student-health module
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Story 6.1 (FR27, NFR2)]
- [Source: _bmad-output/planning-artifacts/architecture.md — REST API patterns, multi-tenancy, module structure]
- [Source: _bmad-output/planning-artifacts/architecture.md — Future: polling/SSE for Traffic Light dashboards]
- [Source: project-context.md — Route-Controller-Service pattern, getTenantedClient, Prisma conventions]
- [Source: apps/backend/src/modules/logistics/attendance.service.ts — getStudentAttendanceStats formula]
- [Source: apps/backend/src/modules/grading/grading.service.ts — Module structure pattern]
- [Source: apps/webapp/src/features/dashboard/DashboardPage.tsx — Role-based dashboard routing]
- [Source: apps/webapp/src/features/dashboard/components/OwnerDashboard.tsx — Hardcoded placeholder to replace]
- [Source: packages/types/src/logistics.ts — AttendanceStatsResponseSchema pattern]
- [Source: packages/db/prisma/schema.prisma — Attendance, Submission, ClassStudent, CenterMembership models]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- **Task 1:** Created `packages/types/src/student-health.ts` with all Zod schemas (HealthStatus, StudentHealthMetrics, StudentHealthCard, HealthSummary, query/response schemas). Exported from index.ts. Types package builds clean.
- **Task 2:** Created `StudentHealthService` with batched Prisma queries (6 queries in parallel). Attendance and assignment metrics computed JS-side. Uses `getTenantedClient` once per request. Note: Submission model is NOT in TENANTED_MODELS so explicit centerId filter used on `this.prisma.submission.findMany`.
- **Task 3:** Created controller (thin delegator), routes (Fastify plugin with ZodTypeProvider, authMiddleware, requireRole OWNER/ADMIN), and index.ts. Registered in app.ts.
- **Task 4:** Schema synced — `schema.d.ts` includes `/api/v1/student-health/dashboard` endpoint.
- **Task 5:** Created `studentHealthKeys` query factory and `useStudentHealthDashboard` hook with TanStack Query (staleTime: 30s, refetchOnWindowFocus: true).
- **Task 6:** Created 4 components: TrafficLightBadge (status dot + label with a11y), HealthSummaryBar (4 clickable metric cards), StudentHealthCard (React.memo, color-coded border, avatar, metrics, class badges with overflow), StudentHealthDashboard (orchestrator with search debounce, class filter, status filter from summary clicks).
- **Task 7:** Replaced OwnerDashboard with thin wrapper importing StudentHealthDashboard. Added ADMIN RBACWrapper block in DashboardPage. Updated DashboardPage.test.tsx assertion from "Center Health Overview" to "Student Health".
- **Task 8:** Created all tests: 14 backend service tests, 5 integration tests, 6 StudentHealthCard tests, 3 HealthSummaryBar tests, 3 hook tests. All 31 new tests pass. Backend: 775 total (0 regressions). Frontend: 838 total (1 more passing — fixed DashboardPage test). Pre-existing failures in InviteUserModal/ProfileEditForm (4 tests) are unrelated.

### Change Log

- 2026-02-18: Story 6-1 implemented — Traffic Light Dashboard (full-stack: types, backend, frontend, tests)
- 2026-02-18: Code review fixes — class filter caching (M2), orchestrator tests (M3), improved deactivated test (M4), added error to hook return (L1)

### File List

**New files:**
- `packages/types/src/student-health.ts`
- `apps/backend/src/modules/student-health/student-health.service.ts`
- `apps/backend/src/modules/student-health/student-health.controller.ts`
- `apps/backend/src/modules/student-health/student-health.routes.ts`
- `apps/backend/src/modules/student-health/index.ts`
- `apps/backend/src/modules/student-health/student-health.service.test.ts`
- `apps/backend/src/modules/student-health/student-health.routes.integration.test.ts`
- `apps/webapp/src/features/student-health/hooks/student-health-keys.ts`
- `apps/webapp/src/features/student-health/hooks/use-student-health-dashboard.ts`
- `apps/webapp/src/features/student-health/components/TrafficLightBadge.tsx`
- `apps/webapp/src/features/student-health/components/HealthSummaryBar.tsx`
- `apps/webapp/src/features/student-health/components/StudentHealthCard.tsx`
- `apps/webapp/src/features/student-health/components/StudentHealthDashboard.tsx`
- `apps/webapp/src/features/student-health/__tests__/StudentHealthCard.test.tsx`
- `apps/webapp/src/features/student-health/__tests__/HealthSummaryBar.test.tsx`
- `apps/webapp/src/features/student-health/__tests__/use-student-health-dashboard.test.ts`
- `apps/webapp/src/features/student-health/__tests__/StudentHealthDashboard.test.tsx`

**Modified files:**
- `packages/types/src/index.ts` — added student-health export
- `apps/backend/src/app.ts` — registered student-health routes
- `apps/webapp/src/features/dashboard/components/OwnerDashboard.tsx` — replaced with StudentHealthDashboard wrapper
- `apps/webapp/src/features/dashboard/DashboardPage.tsx` — added ADMIN RBACWrapper block + updated unknown role check
- `apps/webapp/src/features/dashboard/DashboardPage.test.tsx` — updated assertion for new heading text
- `apps/webapp/src/schema/schema.d.ts` — regenerated (auto-generated)
- `apps/webapp/src/features/users/components/ProfileEditForm.tsx` — Zod 4 email validation fix (bundled in story commit)
- `packages/types/src/invitation.ts` — Zod 4 max-length validation fix (bundled in story commit)
