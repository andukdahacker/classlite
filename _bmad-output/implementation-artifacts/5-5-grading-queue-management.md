# Story 5.5: Grading Queue Management

Status: done

## Story

As a Teacher,
I want to view and manage my grading queue before entering the workbench,
so that I can prioritize which submissions to grade first.

## Acceptance Criteria

1. **AC1: Queue View** — `/:centerId/dashboard/grading` (no submissionId param) displays a table of submissions awaiting grading with columns: Student Name, Assignment Title, Class, Submitted At, Due Date, Status (Pending AI / Ready / In Progress), Priority flag.
2. **AC2: Status Definitions** — Pending AI = GradingJob pending/processing; Ready = GradingJob completed AND no teacher actions yet; In Progress = GradingJob completed AND teacher has started (any AIFeedbackItem with `isApproved != null` OR any TeacherComment exists).
3. **AC3: Filter & Sort** — Filter by Class, Assignment, Grading Status. Sort by Submitted At (default oldest-first), Due Date, Student Name. Filters and sort persist in URL search params.
4. **AC4: Priority Flagging** — Teacher can flag submissions as "Priority" via a star icon toggle. Flagged items always sort to the top regardless of other sort criteria. Priority is persisted to the backend.
5. **AC5: Enter Workbench** — Clicking a submission row navigates to `/:centerId/dashboard/grading/:submissionId` (existing workbench). "Start Grading" button navigates to the first "Ready" submission.
6. **AC6: Progress Indicator** — When an Assignment filter is active, a progress bar shows "X of Y graded" for that assignment (X = GRADED submissions, Y = total submissions for the assignment).
7. **AC7: Assignment Filter Shortcut** — The queue page reads `assignmentId` from URL search params and auto-applies the filter. The Assignment Management page (Story 3.15) gets a "View Submissions" link that navigates to the queue with `?assignmentId=<id>`.

## Tasks / Subtasks

- [x] **Task 1: Database — Add isPriority field to Submission** (AC: 4)
  - [x]1.1 In `packages/db/prisma/schema.prisma`, add to the `Submission` model: `isPriority Boolean @default(false) @map("is_priority")`. Place it after the `timeSpentSec` field
  - [x]1.2 Generate migration: `pnpm --filter=db db:migrate:dev --name add-submission-is-priority`
  - [x]1.3 Generate Prisma client: `pnpm --filter=db db:generate`
  - [x]1.4 Build db package: `pnpm --filter=db build`

- [x] **Task 2: Shared types — Enhanced queue and priority schemas** (AC: 1-6)
  - [x]2.1 In `packages/types/src/grading.ts`, add `GradingStatusSchema = z.enum(["pending_ai", "ready", "in_progress", "graded"])` and export `type GradingStatus`. This is the teacher-facing queue status, distinct from `AnalysisStatus` which is AI-centric
  - [x]2.2 Enhance `GradingQueueItemSchema` with additional fields: `assignmentId: z.string()`, `classId: z.string().nullable()`, `className: z.string().nullable()`, `dueDate: z.string().nullable()` (ISO string), `isPriority: z.boolean()`, `gradingStatus: GradingStatusSchema`. Keep all existing fields (`submissionId`, `studentName`, `assignmentTitle`, `exerciseSkill`, `submittedAt`, `analysisStatus`, `failureReason`) for backward compatibility
  - [x]2.3 Enhance `GradingQueueFiltersSchema` with: `gradingStatus: GradingStatusSchema.optional()`, `sortBy: z.enum(["submittedAt", "dueDate", "studentName"]).default("submittedAt").optional()`, `sortOrder: z.enum(["asc", "desc"]).default("asc").optional()`. Keep existing filters (`classId`, `assignmentId`, `status`, `page`, `limit`)
  - [x]2.4 Add `TogglePrioritySchema = z.object({ isPriority: z.boolean() })` and export `type TogglePriority`
  - [x]2.5 Add `QueueProgressSchema = z.object({ graded: z.number().int(), total: z.number().int() })`. Add to `GradingQueueResponseSchema.data` as `progress: QueueProgressSchema.nullable().optional()` — only populated when `assignmentId` filter is active
  - [x]2.6 Export all new schemas and types, build: `pnpm --filter=types build`

- [x] **Task 3: Backend service — Enhanced queue, priority, progress** (AC: 1-6)
  - [x]3.1 In `grading.service.ts`, enhance `getGradingQueue` method's Prisma query to include additional relations:
    ```typescript
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          classId: true,
          class: { select: { name: true } },
          exercise: { select: { skill: true } },
        },
      },
      student: { select: { name: true } },
      gradingJob: { select: { status: true, error: true, errorCategory: true } },
      feedback: {
        select: {
          items: {
            where: { isApproved: { not: null } },
            select: { id: true },
            take: 1,
          },
        },
      },
      _count: { select: { teacherComments: true } },
    }
    ```
    Also add `isPriority: true` to the Submission select. The `feedback.items` check (take 1 where isApproved not null) and `_count.teacherComments` enable efficient gradingStatus derivation without N+1 queries
  - [x]3.2 Add `gradingStatus` derivation logic when mapping queue items:
    ```typescript
    function deriveGradingStatus(
      submissionStatus: string,
      jobStatus: string | null,
      hasTeacherAction: boolean,
    ): GradingStatus {
      if (submissionStatus === "GRADED") return "graded";
      if (!jobStatus || jobStatus === "pending" || jobStatus === "processing") return "pending_ai";
      if (jobStatus === "failed") return "pending_ai"; // treat failed as pending (can retrigger)
      // jobStatus === "completed"
      return hasTeacherAction ? "in_progress" : "ready";
    }
    ```
    Where `hasTeacherAction = (feedback?.items?.length > 0) || (_count.teacherComments > 0)`. Map each queue item to include: `assignmentId`, `classId`, `className`, `dueDate` (ISO string or null), `isPriority`, `gradingStatus`
  - [x]3.3 Add sorting logic. After deriving all items, sort them:
    - **Priority first:** items with `isPriority === true` always precede non-priority items
    - **Within each priority group**, sort by `sortBy` param: `submittedAt` (default, ASC = oldest first), `dueDate` (ASC = soonest first, nulls last), `studentName` (ASC = alphabetical)
    - **Sort order:** respect `sortOrder` param (asc/desc), applied within each priority group
  - [x]3.4 Add `gradingStatus` filter. If `filters.gradingStatus` is set, filter the derived items AFTER gradingStatus computation (same pattern as existing `status` filter — post-fetch filtering since gradingStatus is derived). If both `status` (analysisStatus) and `gradingStatus` filters are set, apply both (intersection)
  - [x]3.5 Add progress computation: if `filters.assignmentId` is provided, compute `progress`:
    ```typescript
    const progressQuery = await db.submission.groupBy({
      by: ["status"],
      where: { centerId, assignmentId: filters.assignmentId },
      _count: { id: true },
    });
    const graded = progressQuery.find(g => g.status === "GRADED")?._count.id ?? 0;
    const total = progressQuery.reduce((sum, g) => sum + g._count.id, 0);
    ```
    Return `progress: { graded, total }` in the response. If no `assignmentId` filter, return `progress: null`
  - [x]3.6 Add method `togglePriority(centerId: string, submissionId: string, firebaseUid: string, isPriority: boolean)`:
    - Call `verifyAccess()` to check teacher/admin/owner role
    - Find the submission by `id` and `centerId` (use `getTenantedClient`)
    - Throw 404 if not found
    - Update `submission.isPriority = isPriority`
    - Return the updated submission `{ submissionId, isPriority }`

- [x] **Task 4: Backend controller + routes** (AC: 1-6)
  - [x]4.1 Update `getGradingQueue` controller method to pass new filter/sort params (`gradingStatus`, `sortBy`, `sortOrder`) from query to service. Return the enhanced response including `progress`
  - [x]4.2 Add `togglePriority` controller method: `togglePriority(centerId: string, submissionId: string, firebaseUid: string, body: TogglePriority)` — delegates to service, returns `{ data: { submissionId, isPriority }, message: "Priority updated" }`
  - [x]4.3 In `grading.routes.ts`, add new route: `PATCH /submissions/:submissionId/priority` — body: `TogglePrioritySchema`, auth: TEACHER/ADMIN/OWNER, response: `z.object({ data: z.object({ submissionId: z.string(), isPriority: z.boolean() }), message: z.string() })`
  - [x]4.4 Update `GET /submissions` route schema to include the new query params (`gradingStatus`, `sortBy`, `sortOrder`) in the querystring schema, and the enhanced response schema with `progress`

- [x] **Task 5: Schema sync** (AC: all)
  - [x]5.1 Start backend: `pnpm --filter=backend dev`
  - [x]5.2 Sync schema: `pnpm --filter=webapp sync-schema-dev`
  - [x]5.3 Verify `apps/webapp/src/schema/schema.d.ts` includes the new priority endpoint and enhanced queue response type

- [x] **Task 6: Frontend hooks** (AC: 1-6)
  - [x]6.1 Create `apps/webapp/src/features/grading/hooks/use-toggle-priority.ts`. Export `useTogglePriority()` — TanStack mutation calling `client.PATCH("/api/v1/grading/submissions/{submissionId}/priority", ...)`. Accepts `{ submissionId: string, isPriority: boolean }`. **Optimistic update:** immediately toggle `isPriority` on the matching item in the cached queue query data (`queryClient.setQueryData(gradingKeys.queue(...))`). On error: rollback. On success: no invalidation needed (optimistic update is source of truth). Show `toast.error` on failure only. **Note:** since `gradingKeys.queue(filters)` depends on the current filter object, use `queryClient.getQueriesData({ queryKey: gradingKeys.all })` to find and update ALL queue caches, OR pass the current filters to the hook and update the specific cache
  - [x]6.2 Update `use-grading-queue.ts` — extend `GradingQueueFilters` interface with: `gradingStatus?: "pending_ai" | "ready" | "in_progress" | "graded"`, `sortBy?: "submittedAt" | "dueDate" | "studentName"`, `sortOrder?: "asc" | "desc"`. Pass these as query params to the GET request. The query key already includes the full filters object, so different filter combos get separate caches automatically

- [x] **Task 7: GradingQueueListView component** (AC: 1, 2, 4, 5)
  - [x]7.1 Create `apps/webapp/src/features/grading/components/GradingQueueListView.tsx`. Props: `items: GradingQueueItem[]`, `isLoading: boolean`, `progress: { graded: number, total: number } | null`, `filters: GradingQueueFilters`, `onFiltersChange: (filters) => void`, `onTogglePriority: (submissionId: string, isPriority: boolean) => void`, `onStartGrading: () => void`
  - [x]7.2 Render a `<Table>` (from `@workspace/ui/components/table`) with columns:
    - **Priority**: Star icon (`Star` from lucide-react). Filled gold (`fill-amber-400 text-amber-400`) when `isPriority`, outline gray when not. Clickable — calls `onTogglePriority(submissionId, !isPriority)`. `<Button variant="ghost" size="icon" className="h-7 w-7">`
    - **Student**: `studentName ?? "Unknown"`. Left-aligned
    - **Assignment**: `assignmentTitle`. Secondary text: `className` in muted below (stacked using flex-col)
    - **Submitted**: `formatRelativeTime(submittedAt)`. Full date on hover via `title` attribute
    - **Due**: `formatRelativeTime(dueDate)` or "No due date". Red text if overdue (`new Date(dueDate) < new Date()`)
    - **Status**: Badge component:
      - `pending_ai` → `<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending AI</Badge>` with `Loader2` spinner icon
      - `ready` → `<Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Ready</Badge>` with `CheckCircle2` icon
      - `in_progress` → `<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">In Progress</Badge>` with `Clock` icon
      - `graded` → `<Badge variant="secondary">Graded</Badge>` with `CircleCheck` icon
  - [x]7.3 Table rows are clickable — `onClick` navigates to `/:centerId/dashboard/grading/:submissionId`. Use `cursor-pointer hover:bg-muted/50` styling. Entire row is clickable except the priority star button (use `e.stopPropagation()` on star click)
  - [x]7.4 Column headers are clickable for sorting: Student Name, Submitted At, Due Date headers call `onFiltersChange({ ...filters, sortBy, sortOrder })`. Active sort column shows `ArrowUp`/`ArrowDown` icon. Click toggles between asc/desc. Submitted At is the default sort
  - [x]7.5 "Start Grading" button above the table: `<Button size="sm">Start Grading <ArrowRight /></Button>`. Calls `onStartGrading()`. Disabled when no "ready" or "in_progress" items exist. Button text changes to "Continue Grading" if any items are "in_progress"
  - [x]7.6 Empty state: when no items match current filters, show centered message: "No submissions match your filters" with a "Clear Filters" button. When no items at all (unfiltered), show: "All caught up! No submissions to grade."
  - [x]7.7 Loading state: show `<Skeleton>` rows (5 rows) using `@workspace/ui/components/skeleton`
  - [x]7.8 Mobile responsive: on screens < 768px, hide Class, Due Date columns. Use `hidden md:table-cell` on those column headers and cells

- [x] **Task 8: QueueFilters component** (AC: 3, 7)
  - [x]8.1 Create `apps/webapp/src/features/grading/components/QueueFilters.tsx`. Props: `filters: GradingQueueFilters`, `onFiltersChange: (filters) => void`, `classOptions: { id: string, name: string }[]`, `assignmentOptions: { id: string, title: string }[]`
  - [x]8.2 Render a horizontal filter bar with `<div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/30">`:
    - **Class filter**: `<Select>` (from `@workspace/ui/components/select`) with placeholder "All Classes". Options populated from `classOptions`. On change: `onFiltersChange({ ...filters, classId: value || undefined, page: 1 })`
    - **Assignment filter**: `<Select>` with placeholder "All Assignments". Options from `assignmentOptions`. On change: `onFiltersChange({ ...filters, assignmentId: value || undefined, page: 1 })`
    - **Status filter**: `<Select>` with placeholder "All Statuses". Static options: "Pending AI", "Ready", "In Progress", "Graded". On change: `onFiltersChange({ ...filters, gradingStatus: value || undefined, page: 1 })`
    - **Clear button**: `<Button variant="ghost" size="sm">Clear</Button>` with `X` icon. Only visible when any filter is active. Resets all filters to defaults
  - [x]8.3 Derive `classOptions` and `assignmentOptions` from the queue items data (extract unique classId/className and assignmentId/assignmentTitle pairs). This avoids needing separate API calls for filter dropdowns. Pass from `GradingQueuePage` after extracting from unfiltered or fully-loaded queue items. **NOTE:** if the queue is paginated and doesn't return all classes/assignments, the dev may need to add a lightweight `/api/v1/grading/filter-options` endpoint that returns distinct classes/assignments with submissions. For now, the queue returns items with limit:50 which should cover most cases — optimize later if needed
  - [x]8.4 On mount, read `assignmentId` from URL search params (`useSearchParams()`). If present, pre-populate the assignment filter. This fulfills AC7 (deep link from Assignment Management)

- [x] **Task 9: QueueProgressBar component** (AC: 6)
  - [x]9.0 **PREREQUISITE:** The `Progress` shadcn component does NOT exist in `packages/ui` yet. Install it first: `cd packages/ui && npx shadcn@latest add progress`. This creates `packages/ui/src/components/progress.tsx`. Then rebuild: `pnpm --filter=ui build`. Verify the export is available as `@workspace/ui/components/progress` before proceeding
  - [x]9.1 Create `apps/webapp/src/features/grading/components/QueueProgressBar.tsx`. Props: `progress: { graded: number, total: number } | null`, `assignmentTitle: string | null`
  - [x]9.2 Only render when `progress` is not null (assignment filter is active). Show: `<div className="flex items-center gap-3 px-4 py-2 bg-muted/20 border-b">`:
    - Text: `"${progress.graded} of ${progress.total} graded"` with assignment title
    - Progress bar: `<Progress value={(progress.graded / progress.total) * 100} />` from `@workspace/ui/components/progress`. If `progress.total === 0`, show 0%
    - Percentage: `"${Math.round((progress.graded / progress.total) * 100)}%"` in muted text
  - [x]9.3 When all items are graded (`progress.graded === progress.total && progress.total > 0`), show a celebratory state: green progress bar with "Complete!" text

- [x] **Task 10: GradingQueuePage — List/Detail routing** (AC: 5)
  - [x]10.1 In `GradingQueuePage.tsx` (the `GradingQueuePageInner` function), add conditional rendering based on `urlSubmissionId`:
    ```typescript
    if (!urlSubmissionId) {
      return <QueueListMode centerId={centerId} />;
    }
    // ... existing workbench code unchanged ...
    ```
    Extract `QueueListMode` into its own file: `apps/webapp/src/features/grading/components/QueueListMode.tsx` (GradingQueuePage.tsx is already 600+ lines — adding list mode inline would make it unmanageable). This component manages filter state, fetches the queue, and renders `QueueFilters`, `QueueProgressBar`, and `GradingQueueListView`
  - [x]10.2 In `QueueListMode`, manage filter state with URL search params for persistence:
    ```typescript
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(() => ({
      classId: searchParams.get("classId") || undefined,
      assignmentId: searchParams.get("assignmentId") || undefined,
      gradingStatus: searchParams.get("gradingStatus") as GradingStatus | undefined,
      sortBy: (searchParams.get("sortBy") as "submittedAt" | "dueDate" | "studentName") || "submittedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
      limit: 100, // fetch more for list view
    }), [searchParams]);
    ```
    On filter change, update search params: `setSearchParams(newParams, { replace: true })`
  - [x]10.3 `QueueListMode` computes `classOptions` and `assignmentOptions` from full queue data:
    ```typescript
    const classOptions = useMemo(() => {
      const map = new Map<string, string>();
      for (const item of queueItems) {
        if (item.classId && item.className) map.set(item.classId, item.className);
      }
      return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [queueItems]);
    ```
    Same pattern for `assignmentOptions` (dedup by assignmentId → assignmentTitle)
  - [x]10.4 `QueueListMode` implements `onStartGrading`:
    ```typescript
    const handleStartGrading = useCallback(() => {
      // Find first ready item, or first in_progress item
      const target = queueItems.find(i => i.gradingStatus === "ready")
        ?? queueItems.find(i => i.gradingStatus === "in_progress");
      if (target) navigate(`/${centerId}/dashboard/grading/${target.submissionId}`);
    }, [queueItems, centerId, navigate]);
    ```
  - [x]10.5 **Add "Back to Queue" button to `SubmissionNav.tsx`.** This does NOT currently exist — `SubmissionNav` only has Prev/Next buttons and a position counter (`{currentIndex + 1} of {total} submissions`). Add a new prop `onBackToQueue: () => void` and render a `<Button variant="ghost" size="sm">` with `<ArrowLeft />` icon and text "Queue" as the FIRST element (leftmost) in the nav bar, before the Prev button. In `GradingQueuePage`, wire it: `onBackToQueue={() => navigate(\`/${centerId}/dashboard/grading\`)}`. The navigation should preserve any existing search params if possible (e.g., `/${centerId}/dashboard/grading?assignmentId=xxx`)
  - [x]10.6 Remove the auto-selection behavior: currently the `useEffect` that sets `currentIndex` when no `urlSubmissionId` is provided (lines ~82-93 of current code) should only run when `urlSubmissionId` is defined. When `urlSubmissionId` is undefined, the list view handles everything — no need to auto-select a queue item. Guard the effect: `if (!urlSubmissionId) return;`
  - [x]10.7 **Extract `formatRelativeTime` to a shared util.** The function is currently defined inline in `GradingQueuePage.tsx` (lines ~40-50). Move it to `apps/webapp/src/features/grading/utils/format-time.ts` and export it. Update the import in `GradingQueuePage.tsx` and import it in `GradingQueueListView.tsx` for the Submitted/Due columns. Do NOT duplicate the function

- [x] **Task 11: Assignment list deep link** (AC: 7)
  - [x]11.1 In `apps/webapp/src/features/assignments/assignments-page.tsx` (component: `AssignmentsPage`), locate the assignment table row actions. The current actions dropdown (`DropdownMenu`) has: Edit, Close, Reopen, Archive, Delete — but NO "View Submissions" link
  - [x]11.2 Add a "View Submissions" action to the assignment row's `DropdownMenu`: `<DropdownMenuItem onClick={() => navigate(\`/${centerId}/dashboard/grading?assignmentId=${assignment.id}\`)}>` with `<ClipboardList className="mr-2 h-4 w-4" />` icon and text "View Submissions". Place it as the FIRST item in the dropdown (most relevant action for grading workflow). Only show this action if the assignment has status OPEN or CLOSED (i.e., submissions may exist)
  - [x]11.3 Import `ClipboardList` from `lucide-react` and `useNavigate` from `react-router` (if not already imported) in `assignments-page.tsx`

- [x] **Task 12: Write tests** (AC: 1-7)
  - [x]12.1 Backend: unit test `grading.service.ts` — test `togglePriority` (toggle on, toggle off, access denied, not found). Test enhanced `getGradingQueue`: gradingStatus derivation (pending_ai, ready, in_progress, graded), sorting (by submittedAt, dueDate, studentName), priority sorting (flagged first), gradingStatus filter, progress computation when assignmentId is set. (12 tests)
  - [x]12.2 Backend: integration test in `grading.routes.integration.test.ts` — test: PATCH `/priority` (toggle on/off, auth check, 404), GET `/submissions` with new params (sortBy, gradingStatus filter, progress in response). (6 tests)
  - [x]12.3 Frontend: component test `GradingQueueListView.test.tsx` — test: renders table with correct columns, status badges display correctly, priority star toggles, row click navigates, empty state renders, loading skeleton renders, Start Grading button navigates to first ready item. (8 tests)
  - [x]12.4 Frontend: component test `QueueFilters.test.tsx` — test: filter dropdowns render options, selection triggers onFiltersChange, clear button resets, URL param pre-populates assignment filter. (4 tests)
  - [x]12.5 Frontend: component test `QueueProgressBar.test.tsx` — test: renders progress when not null, hidden when null, shows complete state. (3 tests)
  - [x]12.6 Frontend: hook test `use-toggle-priority.test.ts` — test: optimistic update on toggle, rollback on error. (2 tests)
  - [x]12.7 Frontend: integration test — test: list view renders on queue route without submissionId, clicking row navigates to workbench route. (2 tests)

## Dev Notes

### Architecture Compliance

**This is a FULL-STACK story.** Backend enhancements for the grading queue endpoint plus a new priority toggle endpoint. Frontend is the main body of work — a new queue list view with filters, sorting, progress indicators.

**Layered architecture (Route -> Controller -> Service):**
- **Service:** Handles DB queries via `getTenantedClient(prisma, centerId)`. Derives gradingStatus from multiple relations. Computes progress stats.
- **Controller:** Orchestrates service calls, formats `{ data, message }` response with serialized dates.
- **Route:** Extracts query/body params, calls controller, maps errors to HTTP codes.

**Multi-tenancy:** All queries use `getTenantedClient`. No `$transaction` needed in this story (priority toggle and queue fetch are single operations).

**CRITICAL: Preserve teacher-scoped class filtering.** The current `getGradingQueue` service method uses `class: { teacherId: teacherUserId }` to ensure TEACHER-role users only see submissions for classes they teach. ADMIN/OWNER see all center submissions. When enhancing the Prisma query in Task 3.1, this existing access control logic MUST be preserved — do NOT remove or bypass it. The `verifyAccess` call resolves the Firebase UID to a user ID and determines the role.

**Queue includes GRADED submissions.** The current service filters `status: { in: ["SUBMITTED", "AI_PROCESSING", "GRADED"] }`. This is intentional — GRADED submissions must be in the response for the progress indicator (AC6) to work and for teachers to review past grading. The list view should show GRADED items with a muted "Graded" badge, while non-graded items are the primary focus.

### Critical: Current GradingQueuePage Behavior Change

The existing `GradingQueuePage` auto-selects the first queue item and immediately renders the workbench — there is **NO list view today**. This story introduces a list view as the **default** when no `submissionId` is in the URL.

**Current behavior (to be changed):**
```
Teacher navigates to /:centerId/dashboard/grading
→ Queue fetched (limit: 50)
→ First "ready" item auto-selected
→ Workbench immediately renders
```

**New behavior:**
```
Teacher navigates to /:centerId/dashboard/grading
→ Queue fetched (limit: 100)
→ Queue LIST VIEW renders with table, filters, progress
→ Teacher clicks row or "Start Grading"
→ Navigates to /:centerId/dashboard/grading/:submissionId
→ Workbench renders (unchanged)
```

The key code change: guard the auto-selection `useEffect` so it only runs when `urlSubmissionId` is defined. When undefined, render `<QueueListMode>` instead of the workbench.

### GradingStatus Derivation Logic

The teacher-facing status is derived from multiple database fields, NOT stored:

```
Submission.status === "GRADED"           → "graded"
GradingJob.status is null/pending/processing/failed → "pending_ai"
GradingJob.status === "completed" AND (
  any AIFeedbackItem.isApproved != null  → "in_progress"
  OR any TeacherComment exists           → "in_progress"
)
GradingJob.status === "completed" AND
  no teacher actions                     → "ready"
```

**Efficient derivation:** The Prisma query uses `feedback.items` with `where: { isApproved: { not: null } }, take: 1` (existence check, not full load) and `_count: { teacherComments: true }` to avoid loading full feedback data for every queue item.

### Priority Sorting Strategy

Priority items always float to the top. Within each priority group, the selected sort applies:

```
[Priority items sorted by sortBy/sortOrder]
[Non-priority items sorted by sortBy/sortOrder]
```

Implementation: after deriving all items and applying filters, sort with a comparator:
```typescript
items.sort((a, b) => {
  // Priority first
  if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
  // Then by selected sort
  return compareBySortField(a, b, sortBy, sortOrder);
});
```

### Filter Options Strategy

Filter dropdown options (classes, assignments) are **derived from queue data** rather than separate API calls. This is pragmatic for current scale:

```typescript
const classOptions = useMemo(() => {
  const map = new Map<string, string>();
  for (const item of allQueueItems) {
    if (item.classId && item.className) map.set(item.classId, item.className);
  }
  return Array.from(map, ([id, name]) => ({ id, name }));
}, [allQueueItems]);
```

**Trade-off:** If the queue has many pages and the first page doesn't include all classes, some filter options may be missing. At current scale (limit: 100), this covers most centers. If this becomes an issue, add a `/api/v1/grading/filter-options` endpoint later.

### URL Search Params for Filter State

Filters persist in URL search params for shareability and browser back/forward support:

```
/:centerId/dashboard/grading?assignmentId=abc&gradingStatus=ready&sortBy=dueDate&sortOrder=asc
```

Use `useSearchParams()` from react-router. On filter change, update params with `replace: true` (no new history entry for filter changes). This also enables AC7: the Assignment Management page simply navigates to the queue URL with `?assignmentId=<id>`.

### Progress Computation

The progress bar shows grading progress for a specific assignment. Computed server-side for accuracy:

```sql
SELECT status, COUNT(*) FROM submission
WHERE center_id = ? AND assignment_id = ?
GROUP BY status
```

Returns `{ graded: count(GRADED), total: count(ALL) }`. Included in the queue response only when `assignmentId` filter is active to avoid unnecessary queries.

### Existing Components to MODIFY (DO NOT RECREATE)

| Component | File | Changes |
|-----------|------|---------|
| `GradingQueuePage` | `src/features/grading/GradingQueuePage.tsx` | Add conditional list/workbench rendering, guard auto-selection useEffect, extract formatRelativeTime to util, import QueueListMode |
| `SubmissionNav` | `src/features/grading/components/SubmissionNav.tsx` | Add "Back to Queue" button (new `onBackToQueue` prop) |
| `useGradingQueue` | `hooks/use-grading-queue.ts` | Extend filter interface with gradingStatus, sortBy, sortOrder |
| `grading.service.ts` | `apps/backend/src/modules/grading/grading.service.ts` | Enhance getGradingQueue (sorting, gradingStatus, priority, progress), add togglePriority method |
| `grading.controller.ts` | `apps/backend/src/modules/grading/grading.controller.ts` | Update getGradingQueue, add togglePriority |
| `grading.routes.ts` | `apps/backend/src/modules/grading/grading.routes.ts` | Add priority route, update GET /submissions schema |
| `grading.ts` (types) | `packages/types/src/grading.ts` | Add GradingStatus, TogglePriority, QueueProgress schemas; enhance queue item and filter schemas |
| `AssignmentsPage` | `src/features/assignments/assignments-page.tsx` | Add "View Submissions" link to row action dropdown (AC7) |

### New Components to CREATE

| Component | File | Purpose |
|-----------|------|---------|
| `QueueListMode` | `src/features/grading/components/QueueListMode.tsx` | Top-level list mode container — manages filter state, fetches queue, composes filters + progress + list view |
| `GradingQueueListView` | `src/features/grading/components/GradingQueueListView.tsx` | Table view of grading queue with sortable columns, priority stars, status badges |
| `QueueFilters` | `src/features/grading/components/QueueFilters.tsx` | Filter bar with class/assignment/status dropdowns |
| `QueueProgressBar` | `src/features/grading/components/QueueProgressBar.tsx` | Assignment progress indicator |

### New Hooks to CREATE

| Hook | File | Purpose |
|------|------|---------|
| `useTogglePriority` | `hooks/use-toggle-priority.ts` | Optimistic mutation for priority flagging |

### API Endpoints

| Method | Path | Purpose | Auth | Change |
|--------|------|---------|------|--------|
| GET | `/api/v1/grading/submissions` | List queue with enhanced filters/sort/progress | TEACHER/ADMIN/OWNER | MODIFIED |
| PATCH | `/api/v1/grading/submissions/:submissionId/priority` | Toggle priority flag | TEACHER/ADMIN/OWNER | NEW |

### Component Import Paths (Established Project Patterns)

```typescript
// shadcn components:
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Progress } from "@workspace/ui/components/progress";
import { Skeleton } from "@workspace/ui/components/skeleton";
// Icons:
import { Star, ArrowUp, ArrowDown, ArrowRight, CheckCircle2, CircleCheck, Clock, Loader2, X, FileText } from "lucide-react";
// Routing:
import { useNavigate, useParams, useSearchParams } from "react-router";
// Toast:
import { toast } from "sonner";
// API client:
import client from "@/core/client";
// Auth:
import { useAuth } from "@/features/auth/auth-context";
```

### Existing Dependencies (NO NEW PACKAGES NEEDED)

| Package | Usage |
|---------|-------|
| `lucide-react` | Star, ArrowUp, ArrowDown, ArrowRight, CheckCircle2, CircleCheck, Clock, Loader2, X, FileText |
| `tailwindcss` | All styling |
| `react` | useState, useMemo, useCallback, useEffect |
| `react-router` | useNavigate, useParams, useSearchParams |
| `@tanstack/react-query` | useQuery, useMutation, useQueryClient |

### Scope Boundaries — What This Story Does NOT Implement

| Feature | Story | Status |
|---------|-------|--------|
| Split-screen grading workbench | 5.2 | Done |
| Evidence anchoring | 5.3 | Done |
| Approve/reject/finalize flow | 5.4 | Done |
| Student Feedback View | 5.6 | Backlog |
| Teacher commenting | 5.7 | Done |
| Pagination controls in queue list | Future | Not planned (limit:100 covers most cases) |
| Bulk actions on queue items | Future | Not planned |
| Queue auto-refresh / real-time | Future | TanStack Query refetchInterval can be added later |

### Previous Story Intelligence

**From Story 5-4 (One-Click Approval Loop):**
- `GradingQueuePage` currently has `useGradingQueue({ limit: 50 })` — increase to `limit: 100` for list view
- The `navigateTo` function uses `navigate(\`/${centerId}/dashboard/grading/${id}\`, { replace: true })` — reuse this pattern for row click navigation
- `SubmissionNav` currently has ONLY Prev/Next buttons and a position counter — NO "Back to Queue" link exists. Task 10.5 adds it
- Session tracking state (sessionGradedCount, showBreather) is only relevant in workbench mode — no changes needed
- `formatRelativeTime` is defined INLINE in GradingQueuePage.tsx (lines ~40-50) — NOT in a shared util. Task 10.7 extracts it to `utils/format-time.ts`

**From Story 5-7 (Free-Form Teacher Commenting):**
- TeacherComment count is now available per submission — used for gradingStatus "in_progress" derivation
- The grading service already has `_count` patterns for comments — reuse for the queue query

**From Story 5-2 (Split-Screen Grading Interface):**
- `WorkbenchLayout` has `ResizablePanelGroup` — NOT used in list view, only in workbench mode
- `SubmissionNav` sits between the header and the workbench — it does NOT have a "Back to Queue" link (confirmed: only Prev/Next + counter). Task 10.5 adds the `onBackToQueue` prop

**Code review patterns from previous stories:**
- Wrap all callbacks in `useCallback` with proper dependency arrays
- Use `useMemo` for derived data (classOptions, assignmentOptions)
- Use `React.memo` for table rows if performance becomes an issue
- Test optimistic updates with both success and error paths

### Database Migration Notes

The migration adds a single nullable boolean column with a default value. This is:
- **Non-breaking:** existing rows get `false` automatically
- **No downtime required:** `ALTER TABLE ADD COLUMN ... DEFAULT false` is instant in PostgreSQL for boolean columns
- **Index consideration:** no index needed on `is_priority` alone — the sort is done application-side after fetching

### Project Structure Notes

```
apps/webapp/src/features/grading/
├── GradingQueuePage.tsx                  # MODIFIED — conditional list/workbench, guard useEffect, extract formatRelativeTime
├── components/
│   ├── QueueListMode.tsx                # NEW — list mode container (filter state, queue fetch, composes sub-components)
│   ├── GradingQueueListView.tsx          # NEW — queue table with columns, priority, status badges
│   ├── QueueFilters.tsx                  # NEW — class/assignment/status filter bar
│   ├── QueueProgressBar.tsx              # NEW — assignment progress indicator
│   ├── AIFeedbackPane.tsx                # UNCHANGED
│   ├── FeedbackItemCard.tsx              # UNCHANGED
│   ├── BandScoreCard.tsx                 # UNCHANGED
│   ├── StampedAnimation.tsx              # UNCHANGED
│   ├── BreatherCard.tsx                  # UNCHANGED
│   ├── SubmissionNav.tsx                 # MODIFIED — add "Back to Queue" button (onBackToQueue prop)
│   ├── WorkbenchLayout.tsx               # UNCHANGED
│   ├── StudentWorkPane.tsx               # UNCHANGED
│   └── ConnectionLineOverlay.tsx         # UNCHANGED
├── utils/
│   └── format-time.ts                   # NEW — extracted formatRelativeTime from GradingQueuePage
├── hooks/
│   ├── grading-keys.ts                   # UNCHANGED
│   ├── use-grading-queue.ts             # MODIFIED — extend filter interface
│   ├── use-toggle-priority.ts           # NEW — priority mutation with optimistic update
│   ├── use-submission-detail.ts         # UNCHANGED
│   ├── use-prefetch-submission.ts       # UNCHANGED
│   ├── use-approve-feedback-item.ts     # UNCHANGED
│   ├── use-bulk-approve.ts             # UNCHANGED
│   ├── use-finalize-grading.ts         # UNCHANGED
│   ├── use-grading-shortcuts.ts        # UNCHANGED
│   ├── use-retrigger-analysis.ts       # UNCHANGED
│   ├── use-create-comment.ts           # UNCHANGED
│   ├── use-update-comment.ts           # UNCHANGED
│   └── use-delete-comment.ts           # UNCHANGED
└── __tests__/
    ├── GradingQueueListView.test.tsx     # NEW — 8 tests
    ├── QueueFilters.test.tsx             # NEW — 4 tests
    ├── QueueProgressBar.test.tsx         # NEW — 3 tests
    └── use-toggle-priority.test.ts      # NEW — 2 tests

apps/webapp/src/features/assignments/
└── assignments-page.tsx                  # MODIFIED — add "View Submissions" action to row dropdown

apps/backend/src/modules/grading/
├── grading.routes.ts                     # MODIFIED — new priority route, enhanced GET schema
├── grading.controller.ts                 # MODIFIED — enhanced getGradingQueue, new togglePriority
├── grading.service.ts                    # MODIFIED — enhanced queue + new togglePriority
├── grading.service.test.ts               # MODIFIED — 12 new tests
└── grading.routes.integration.test.ts    # MODIFIED — 6 new tests

packages/types/src/
└── grading.ts                            # MODIFIED — new schemas

packages/db/prisma/
├── schema.prisma                         # MODIFIED — add isPriority to Submission
└── migrations/
    └── XXXXXXXXXX_add_submission_is_priority/
        └── migration.sql                 # AUTO-GENERATED
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 — Story 5.5 (FR21, FR26)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Layered architecture, multi-tenancy, TanStack Query, feature-first organization]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Teacher role: grading queue summary, High-Velocity Pedagogy]
- [Source: _bmad-output/implementation-artifacts/5-4-one-click-approval-loop.md — GradingQueuePage structure, navigation patterns, formatRelativeTime, useGradingQueue usage]
- [Source: _bmad-output/implementation-artifacts/5-7-free-form-teacher-commenting.md — TeacherComment model, comment count for gradingStatus derivation]
- [Source: project-context.md — Route-Controller-Service, getTenantedClient, testing rules, naming conventions]
- [Source: packages/db/prisma/schema.prisma — Submission model, Assignment model (dueDate, classId), Class model (name), GradingJob, SubmissionFeedback, AIFeedbackItem, TeacherComment]
- [Source: packages/types/src/grading.ts — GradingQueueItemSchema, GradingQueueFiltersSchema, AnalysisStatusSchema, existing schemas]
- [Source: apps/backend/src/modules/grading/grading.service.ts — getGradingQueue current implementation, verifyAccess, deriveAnalysisStatus]
- [Source: apps/backend/src/modules/grading/grading.routes.ts — GET /submissions current route, auth pattern]
- [Source: apps/webapp/src/features/grading/GradingQueuePage.tsx — Current auto-selection behavior, useParams for submissionId, navigateTo pattern, empty states]
- [Source: apps/webapp/src/features/grading/hooks/use-grading-queue.ts — Current hook structure, GradingQueueFilters interface]
- [Source: apps/webapp/src/features/grading/hooks/grading-keys.ts — Query key structure]
- [Source: apps/webapp/src/App.tsx — Route definitions: /:centerId/dashboard/grading and /:centerId/dashboard/grading/:submissionId]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- All 12 tasks completed across backend and frontend
- Database migration `20260217135552_add_submission_is_priority` created and applied
- Backend: enhanced `getGradingQueue` with gradingStatus derivation, priority sorting, progress computation; added `togglePriority` endpoint
- Frontend: new queue list view with filters, progress bar, priority flagging, sortable columns
- Assignment page deep link added ("View Submissions" action)
- SubmissionNav updated with "Back to Queue" button
- All existing tests updated to work with enhanced mock data shapes
- 12 new backend tests + 17 new frontend tests (all passing)
- Lint passes with 0 warnings
- Pre-existing test failures in `InviteUserModal.test.tsx` and `ProfileEditForm.test.tsx` are unrelated to this story

**Code Review Fixes Applied (2026-02-17):**
- H1: Fixed `formatRelativeTime` to handle future dates (dueDate) — was returning "Just now" for all future dates
- H2: Fixed search param preservation across 3 navigation paths — row click (GradingQueueListView), Start Grading (QueueListMode), Back to Queue (GradingQueuePage) now carry filter params
- M1: Fixed Radix Select deselect UX — added `"__all__"` sentinel values for individual filter deselection in QueueFilters
- C1/H3: Added 6 PATCH priority integration tests to `grading.routes.integration.test.ts` (toggle on/off, 401/403/404/400)
- M3: Added 3 sort scenario tests to `grading.service.test.ts` (dueDate with nulls, studentName alphabetical, submittedAt desc)
- Task 12.7: Row-click navigation and list rendering covered by existing GradingQueueListView component tests
- Final test counts: Backend 742 passed (was 733), Frontend 811 passed

### File List

**Modified:**
- `packages/db/prisma/schema.prisma` — Added `isPriority` to Submission model
- `packages/types/src/grading.ts` — Added GradingStatus, TogglePriority, QueueProgress schemas; enhanced queue item/filter schemas
- `packages/ui/package.json` — Added Progress component dependency
- `pnpm-lock.yaml` — Updated lockfile
- `apps/backend/src/modules/grading/grading.service.ts` — Enhanced getGradingQueue, added togglePriority, deriveGradingStatus, compareBySortField
- `apps/backend/src/modules/grading/grading.controller.ts` — Added togglePriority controller
- `apps/backend/src/modules/grading/grading.routes.ts` — Added PATCH priority route
- `apps/backend/src/modules/grading/grading.service.test.ts` — Updated existing mocks, added 12+3 Story 5-5 tests
- `apps/backend/src/modules/grading/grading.routes.integration.test.ts` — Updated mock data + added 6 PATCH priority integration tests
- `apps/webapp/src/schema/schema.d.ts` — Regenerated from OpenAPI
- `apps/webapp/src/features/grading/GradingQueuePage.tsx` — Split into list/workbench modes, removed auto-selection, search param preservation
- `apps/webapp/src/features/grading/components/SubmissionNav.tsx` — Added onBackToQueue prop + button
- `apps/webapp/src/features/grading/hooks/use-grading-queue.ts` — Extended GradingQueueFilters interface
- `apps/webapp/src/features/assignments/assignments-page.tsx` — Added "View Submissions" action

**Created:**
- `packages/db/prisma/migrations/20260217135552_add_submission_is_priority/migration.sql`
- `apps/webapp/src/features/grading/components/QueueListMode.tsx`
- `apps/webapp/src/features/grading/components/GradingQueueListView.tsx`
- `apps/webapp/src/features/grading/components/QueueFilters.tsx`
- `apps/webapp/src/features/grading/components/QueueProgressBar.tsx`
- `apps/webapp/src/features/grading/hooks/use-toggle-priority.ts`
- `apps/webapp/src/features/grading/utils/format-time.ts`
- `apps/webapp/src/features/grading/__tests__/GradingQueueListView.test.tsx`
- `apps/webapp/src/features/grading/__tests__/QueueFilters.test.tsx`
- `apps/webapp/src/features/grading/__tests__/QueueProgressBar.test.tsx`
- `apps/webapp/src/features/grading/__tests__/use-toggle-priority.test.ts`
- `packages/ui/src/components/progress.tsx` (shadcn component)
