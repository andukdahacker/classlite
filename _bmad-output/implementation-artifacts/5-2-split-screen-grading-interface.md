# Story 5.2: Split-Screen Grading Interface

Status: done

## Story

As a Teacher,
I want to see student work and AI feedback side-by-side,
so that I can grade efficiently without switching tabs.

## Acceptance Criteria

1. **AC1: Split-screen layout** — Workspace is divided into a Left pane (Student Work) and Right pane (AI Feedback Cards). The panes are resizable via a drag handle. Left pane renders the student's submitted text (Writing) or transcript (Speaking) with the question prompt. Right pane renders AI-generated band scores and individual feedback item cards. The layout defaults to ~55/45 split (slightly more space for student work).
2. **AC2: Pre-fetch next submission** — The next submission in the grading queue pre-fetches in < 500ms to ensure zero lag when navigating between items. When viewing submission N, submission N+1 is pre-fetched via React Query `prefetchQuery`. Navigation controls (Prev/Next) allow browsing through the queue. Current position indicator shows "X of Y".

## Tasks / Subtasks

- [x] **Task 1: Create Resizable component wrapper** (AC: 1)
  - [x] 1.1 `react-resizable-panels` (v3.0.6) is ALREADY installed in `apps/webapp/package.json` — do NOT install again
  - [x] 1.2 Create `apps/webapp/src/features/grading/components/resizable.tsx` — local shadcn-style resizable wrapper (ResizablePanelGroup, ResizablePanel, ResizableHandle) following the standard shadcn resizable pattern. This is a local component (not in `packages/ui`) because the dependency lives in the webapp
  - [x] 1.3 Import from `./resizable` within grading feature components (NOT from `@workspace/ui`)

- [x] **Task 2: Fix backend response schemas + sync frontend types** (AC: 1, 2)
  - [x] 2.1 In `apps/backend/src/modules/grading/grading.routes.ts`, replace `z.object({ data: z.unknown(), message: z.string() })` with the proper response schemas that ALREADY EXIST in `@workspace/types`. Import and use: `GradingQueueResponseSchema` (for GET /submissions), `SubmissionDetailResponseSchema` (for GET /submissions/:id), `SubmissionFeedbackResponseSchema` (for GET /submissions/:id/feedback), `GradingJobResponseSchema` (for POST /submissions/:id/analyze). This is a 4-line change — one per endpoint's `200` response schema
  - [x] 2.2 Start backend locally (`pnpm --filter=backend dev`), then run `pnpm --filter=webapp sync-schema-dev` to regenerate `apps/webapp/src/schema/schema.d.ts` with proper typed responses. Verify the grading endpoints now have typed `data` fields instead of `unknown`
  - [x] 2.3 After sync, the frontend hooks get full type inference from `openapi-fetch` for free — no manual type definitions or casts needed. The `client.GET(...)` calls will return properly typed `data` fields matching the Zod schemas

- [x] **Task 3: Create React Query hooks for grading API** (AC: 1, 2)
  - [x] 3.1 Create `apps/webapp/src/features/grading/hooks/grading-keys.ts` — query key factory following `submissionKeys` pattern: `all`, `queue(filters)`, `detail(submissionId)`, `feedback(submissionId)`
  - [x] 3.2 Create `apps/webapp/src/features/grading/hooks/use-grading-queue.ts` — fetches `GET /api/v1/grading/submissions` with filters (classId, assignmentId, status, page, limit). Uses `client.GET("/api/v1/grading/submissions", ...)` pattern from `use-submission.ts`. After Task 2's schema sync, the response is fully typed automatically — no manual casting needed
  - [x] 3.3 Create `apps/webapp/src/features/grading/hooks/use-submission-detail.ts` — fetches `GET /api/v1/grading/submissions/{submissionId}` for full submission + analysisStatus + feedback. Fully typed after schema sync. Include `refetchInterval` for polling while `analysisStatus === "analyzing"` (poll every 5s, stop when ready/failed)
  - [x] 3.4 Create `apps/webapp/src/features/grading/hooks/use-prefetch-submission.ts` — given next submissionId, calls `queryClient.prefetchQuery` for the detail endpoint. Called when current submission loads. Use `staleTime: 30_000` (30s). When navigating to a pre-fetched submission, pass cached data as `initialData` to avoid any flash of loading state
  - [x] 3.5 Create `apps/webapp/src/features/grading/hooks/use-retrigger-analysis.ts` — `useMutation` hook calling `client.POST("/api/v1/grading/submissions/{submissionId}/analyze", ...)`. On success: invalidate `gradingKeys.detail(submissionId)` to trigger refetch (which will start polling). Show success toast "AI re-analysis triggered". On error: show error toast

- [x] **Task 4: Build GradingWorkbenchPage** (AC: 1, 2)
  - [x] 4.1 Replace placeholder `GradingQueuePage.tsx` content — on mount, fetch grading queue (no status filter — fetch all to enable browsing), auto-load the first "ready" submission into the workbench. The page renders INSIDE the existing `DashboardShell` layout (with sidebar/topbar) — it is NOT a full-screen takeover. The route stays at `/:centerId/dashboard/grading`
  - [x] 4.2 Add workbench route with optional submissionId — update `App.tsx` to add `grading/:submissionId` nested route under the existing `grading` route for direct-link access (e.g., from future Story 5.5 queue click). Use React Router v7 `useParams()` to read `submissionId`. If `submissionId` param is present, load that submission directly. If absent, auto-load the first "ready" item from the queue
  - [x] 4.3 **Queue-based navigation state**: On mount, fetch queue with `limit: 50`. Extract an ordered `submissionIds: string[]` array from queue items. Track `currentIndex` in component state. Derive `prevId = submissionIds[currentIndex - 1]` and `nextId = submissionIds[currentIndex + 1]`. When navigating from a URL with a specific `submissionId`, find its index in the array with `submissionIds.indexOf(submissionId)`. If not found (submission from a different page), load it standalone with disabled prev/next
  - [x] 4.4 Handle empty/error states: (a) No submissions in queue → "All caught up!" celebration with `CircleCheck` icon, (b) All submissions still analyzing → "AI is analyzing submissions..." with spinner, showing count (e.g., "3 submissions analyzing"), (c) API error → error state with retry button, (d) 403 error → "You don't have any classes assigned. Contact your center admin." (this happens when a TEACHER has no class assignments)
  - [x] 4.5 Handle `analysisStatus` states on current submission: "analyzing" → show skeleton/spinner in right pane with "AI is analyzing..." message (polling handled by the hook's `refetchInterval`); "ready" → render feedback; "failed" → show failure reason with "Re-analyze" button using the `useRetriggerAnalysis` mutation hook

- [x] **Task 5: Build the split-screen layout** (AC: 1)
  - [x] 5.1 Create `apps/webapp/src/features/grading/components/WorkbenchLayout.tsx` — uses `ResizablePanelGroup` with two `ResizablePanel` components and a `ResizableHandle` (imported from the local `./resizable` wrapper created in Task 1). Direction: horizontal. Default sizes: left 55%, right 45%. Min sizes: left 30%, right 25%. Use `autoSaveId="grading-workbench"` to persist panel sizes to localStorage
  - [x] 5.2 Add a top bar inside the workbench (not the app TopBar) showing: student name (fallback to "Unknown Student" if `studentName` is null), assignment title, exercise skill badge (Writing/Speaking using `Badge`), and submission timestamp (fallback to "No date" if `submittedAt` is null). Format timestamp as relative time (e.g., "2 hours ago") using `Date` or a lightweight formatter
  - [x] 5.3 Responsive behavior: on viewports < 768px, switch to stacked vertical layout (student work on top, feedback below) using CSS media queries or a `useMediaQuery` hook. Hide the resize handle on mobile. Use `direction="vertical"` for the ResizablePanelGroup on mobile
  - [x] 5.4 On tablet (768-1024px): keep split-screen but default right pane to 40%

- [x] **Task 6: Build StudentWorkPane (left pane)** (AC: 1)
  - [x] 6.1 Create `apps/webapp/src/features/grading/components/StudentWorkPane.tsx` — scrollable pane rendering the student's submission
  - [x] 6.2 Display question/prompt context at top: exercise title, question instructions, writing prompt (for W1/W2/W3), or speaking cue card (for S1/S2/S3). Use a `Collapsible` from `@workspace/ui` so the teacher can minimize it after reading
  - [x] 6.3 Render student's answer text as read-only formatted content. For Writing: display the essay text with paragraph breaks preserved (split on `\n` and render as `<p>` elements). For Speaking: display the transcript text (or "No transcript available" placeholder if `answer.transcript` is missing/empty). Use `ScrollArea` from `@workspace/ui` for overflow
  - [x] 6.4 Show word count at the bottom of the student text (e.g., "247 words"). For Writing tasks, show target word count comparison (e.g., "247 / 250 min words"). Calculate by splitting on whitespace: `text.trim().split(/\s+/).length`
  - [x] 6.5 If the submission has multiple questions (e.g., Part 1 Speaking with multiple recordings), render each question with its answer in sequence with clear `Separator` dividers between them

- [x] **Task 7: Build AIFeedbackPane (right pane)** (AC: 1)
  - [x] 7.1 Create `apps/webapp/src/features/grading/components/AIFeedbackPane.tsx` — scrollable pane rendering AI analysis results
  - [x] 7.2 **Band Score Summary Card** at top: display overall band score prominently (large number, e.g., "6.5"), then per-criterion scores in a grid. For Writing: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range. For Speaking: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation. Each criterion shows score (0-9) with a label. Use `Card` from `@workspace/ui`. Extract this as a separate `BandScoreCard.tsx` component
  - [x] 7.3 **General Feedback section**: display the AI-generated general feedback paragraph below the scores
  - [x] 7.4 **Feedback Items List**: render each `AIFeedbackItem` as a card (`FeedbackItemCard.tsx`). Each card shows: type icon (grammar=`SpellCheck`, vocabulary=`BookOpen`, coherence=`Link`, score_suggestion=`Star`, general=`MessageCircle` from Lucide), content text, severity badge (error=red `destructive` variant, warning=amber `outline` + amber text, suggestion=blue `secondary` variant using `Badge` from `@workspace/ui`), confidence percentage (e.g., "95%"), and suggested fix (if present, shown as `<del>original</del> → <ins>fix</ins>`)
  - [x] 7.5 Group feedback items by type: grammar issues first, then vocabulary, coherence, score suggestions, general. Show count per group header (e.g., "Grammar Issues (4)")
  - [x] 7.6 Loading state: when `analysisStatus === "analyzing"`, show `Skeleton` components mimicking the score card and 3 feedback card placeholders. Add "AI is analyzing this submission..." text with a pulsing indicator. Polling is handled by the `useSubmissionDetail` hook's `refetchInterval` — no extra logic needed here
  - [x] 7.7 Failed state: when `analysisStatus === "failed"`, show the error reason from `failureReason`, and a "Re-analyze" button using the `useRetriggerAnalysis` mutation hook. Show info text: "You can still grade manually without AI assistance." Show a `disabled` state on the button while mutation is pending

- [x] **Task 8: Build submission navigation** (AC: 2)
  - [x] 8.1 Create `apps/webapp/src/features/grading/components/SubmissionNav.tsx` — navigation bar at the top of the workbench (between the workbench header and the split panes)
  - [x] 8.2 Display: "Prev" button (disabled when `currentIndex === 0`), "Next" button (disabled when `currentIndex === submissionIds.length - 1`), position indicator "3 of 12 submissions"
  - [x] 8.3 On "Next" click: update `currentIndex` state, navigate to `submissionIds[currentIndex + 1]`, trigger pre-fetch of N+2. On "Prev" click: update `currentIndex`, navigate to previous (already cached by React Query)
  - [x] 8.4 Keyboard shortcuts: `ArrowLeft` for previous, `ArrowRight` for next. Only fire when `document.activeElement` is NOT an input/textarea/contenteditable (check `tagName` and `isContentEditable`). Register via `useEffect` keydown listener, cleanup on unmount
  - [x] 8.5 Pre-fetch trigger: when a submission loads and `nextId` exists, call `usePrefetchSubmission(nextId)`. When pre-fetched data is available and teacher navigates to next, pass it as `initialData` to the detail query for instant zero-flicker transition

- [x] **Task 9: Write tests** (AC: 1, 2)
  - [x] 9.1 Unit test `grading-keys.ts` — verify query key structure (5 tests)
  - [x] 9.2 Component test `WorkbenchLayout` — verify split panes render, responsive behavior switches to stacked on narrow viewport (mock `matchMedia`) (5 tests)
  - [x] 9.3 Component test `StudentWorkPane` — verify question prompt renders, student text renders, word count displays correctly, "No transcript available" shown when transcript is empty (7 tests)
  - [x] 9.4 Component test `AIFeedbackPane` — verify band scores render with correct labels per skill, feedback items render with correct icons/badges, loading skeleton renders when analyzing, failed state shows retry button and error reason (13 tests)
  - [x] 9.5 Component test `SubmissionNav` — verify prev/next buttons, position indicator text, disabled states at boundaries, keyboard shortcut registration (11 tests)
  - [x] 9.6 Hook test `useGradingQueue` — verify API call with correct params and error handling (2 tests)
  - [x] 9.7 Hook test `useRetriggerAnalysis` — verify POST call, cache invalidation on success, error toast on failure (2 tests)

## Dev Notes

### Architecture Compliance

**This is primarily a FRONTEND story.** All 4 grading API endpoints from Story 5.1 are already implemented and working. The only backend change is Task 2: replacing `z.unknown()` with proper response schemas in `grading.routes.ts` (no logic changes, just schema typing) + running `sync-schema-dev` to propagate types to the frontend.

**API client pattern (MANDATORY — follow `use-submission.ts` exactly):**
```typescript
import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";

// client uses openapi-fetch with typed paths from schema.d.ts
const { data, error } = await client.GET("/api/v1/grading/submissions/{submissionId}", {
  params: { path: { submissionId } },
});
```

**Query key factory pattern (follow `submission-keys.ts`):**
```typescript
export const gradingKeys = {
  all: ["grading"] as const,
  queue: (filters: Record<string, unknown>) => [...gradingKeys.all, "queue", filters] as const,
  detail: (id: string) => [...gradingKeys.all, "detail", id] as const,
  feedback: (id: string) => [...gradingKeys.all, "feedback", id] as const,
};
```

**Component imports from `@workspace/ui`:**
- Components live in `packages/ui/src/components/` and are imported via `@workspace/ui/components/<name>`
- Available: `Badge`, `Button`, `Card` (CardHeader, CardContent, CardTitle, CardDescription), `ScrollArea`, `Skeleton`, `Sheet`, `Tabs`, `Separator`, `Collapsible`
- **Resizable:** `react-resizable-panels` (v3.0.6) is already in `apps/webapp/package.json` — create a local wrapper in the grading feature (Task 1), NOT in packages/ui
- Icons: `lucide-react` (already installed)

### Backend API Endpoints (Already Exist — DO NOT RECREATE)

| Method | Endpoint | Returns |
|--------|----------|---------|
| `GET` | `/api/v1/grading/submissions` | Paginated queue: `{ data: { items: GradingQueueItem[], total, page, limit }, message }` |
| `GET` | `/api/v1/grading/submissions/:submissionId` | Full detail: `{ data: { submission, analysisStatus, feedback }, message }` |
| `GET` | `/api/v1/grading/submissions/:submissionId/feedback` | Feedback only: `{ data: { feedback, items }, message }` |
| `POST` | `/api/v1/grading/submissions/:submissionId/analyze` | Trigger/retry: `{ data: { gradingJob }, message }` |

**Frontend types require schema sync (Task 2):** Currently `schema.d.ts` returns `{ data: unknown }` because the backend uses `z.unknown()`. Task 2 fixes this by replacing with proper Zod schemas (already defined in `@workspace/types`) and running `sync-schema-dev`. After that, all `client.GET/POST` calls get full type inference automatically.

### Existing Code to REUSE (DO NOT DUPLICATE)

| What | Source | How to Reuse |
|------|--------|--------------|
| API client | `src/core/client.ts` | `import client from "@/core/client"` — typed openapi-fetch client |
| Auth context | `src/features/auth/AuthContext.tsx` | `useAuth()` for current user info |
| React Query setup | Already configured in `App.tsx` | `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query` |
| Submission hooks pattern | `src/features/submissions/hooks/use-submission.ts` | Follow same `client.GET` + `useQuery` pattern |
| Query key pattern | `src/features/submissions/hooks/submission-keys.ts` | Follow same factory pattern |
| Toast notifications | `sonner` (via `@workspace/ui`) | `import { toast } from "sonner"` for success/error messages |
| Error boundary | `src/core/components/common/error-boundary.tsx` | Already wraps the grading route in App.tsx |
| Route structure | `src/App.tsx` line ~259 | Grading route: `/:centerId/dashboard/grading` with OWNER/ADMIN/TEACHER protection |

### UI Components Used in This Story

From `packages/ui` (import via `@workspace/ui/components/<name>`): `Badge`, `Button`, `Card`/`CardHeader`/`CardContent`/`CardTitle`/`CardDescription`, `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent`, `ScrollArea`, `Separator`, `Skeleton`

From `lucide-react` (already in webapp): `SpellCheck`, `BookOpen`, `Link`, `Star`, `MessageCircle`, `ChevronLeft`, `ChevronRight`, `CircleCheck`, `Loader2`, `RefreshCw`, `AlertTriangle`, `PenLine`, `Mic`

From `react-resizable-panels` (v3.0.6, already in webapp): `Panel`, `PanelGroup`, `PanelResizeHandle` — wrapped in local `resizable.tsx` (Task 1)

### Design System Tokens

Follow the "Electric Focus" theme already applied in the codebase:
- **Primary:** Royal Blue `#2563EB` (active states, primary buttons)
- **Secondary bg:** Ice Blue Wash `#EFF6FF` (card backgrounds, selected states)
- **Accent:** Focus Amber `#F59E0B` (scores, warnings)
- **Text:** Slate Navy `#1E293B`
- **Border radius:** `0.75rem` (12px) on cards/buttons
- **Typography:** Inter (body/UI), Outfit (headings)
- **Spacing:** Relaxed density — `16px` padding on cards, ample whitespace

### Data Structure Reference

**GradingQueueItem** (from `GET /grading/submissions`):
```typescript
{
  submissionId: string;
  studentName: string | null;    // ⚠️ null if student has no displayName — fallback to "Unknown Student"
  assignmentTitle: string | null; // ⚠️ null if assignment deleted — fallback to "Untitled Assignment"
  exerciseSkill: string;          // Runtime values: "WRITING" | "SPEAKING" (only these appear in grading queue)
  submittedAt: string | null;     // ⚠️ null if submission was never formally submitted — fallback to "No date"
  analysisStatus: "not_applicable" | "analyzing" | "ready" | "failed";
  failureReason?: string | null;
}
```

**Submission Detail** (from `GET /grading/submissions/:id`):
```typescript
{
  submission: {
    id: string;
    status: "SUBMITTED" | "AI_PROCESSING" | "GRADED";
    submittedAt: string;
    answers: Array<{
      id: string;
      questionId: string;
      answer: { text?: string; transcript?: string; /* other fields */ };
      score?: number;
    }>;
    assignment: {
      id: string;
      exercise: {
        title: string;
        skill: "WRITING" | "SPEAKING";
        sections: Array<{
          type: string;
          instructions: string;
          questions: Array<{ id: string; prompt?: string; /* ... */ }>;
        }>;
      };
      dueAt?: string;
    };
    student: { id: string; displayName: string; };
  };
  analysisStatus: "not_applicable" | "analyzing" | "ready" | "failed";
  feedback: {
    id: string;
    overallScore: number | null;
    criteriaScores: {
      taskAchievement?: number;
      coherence?: number;
      lexicalResource?: number;
      grammaticalRange?: number;
      fluency?: number;
      pronunciation?: number;
    } | null;
    generalFeedback: string | null;
    items: Array<{
      id: string;
      type: "grammar" | "vocabulary" | "coherence" | "score_suggestion" | "general";
      content: string;
      startOffset?: number;
      endOffset?: number;
      originalContextSnippet?: string;
      suggestedFix?: string;
      severity?: "error" | "warning" | "suggestion";
      confidence?: number;
      isApproved?: boolean | null; // null = pending (Story 5.4 populates this)
    }>;
  } | null;
}
```

### IELTS Criteria Labels

**Writing criteria (display labels):**
| Key | Label |
|-----|-------|
| `taskAchievement` | Task Achievement |
| `coherence` | Coherence & Cohesion |
| `lexicalResource` | Lexical Resource |
| `grammaticalRange` | Grammatical Range & Accuracy |

**Speaking criteria (display labels):**
| Key | Label |
|-----|-------|
| `fluency` | Fluency & Coherence |
| `lexicalResource` | Lexical Resource |
| `grammaticalRange` | Grammatical Range & Accuracy |
| `pronunciation` | Pronunciation |

### Scope Boundaries — What This Story Does NOT Implement

These are explicitly handled by later stories. DO NOT implement them:

| Feature | Story | Status |
|---------|-------|--------|
| Evidence anchoring (tether lines from feedback to text) | 5.3 | Backlog |
| Accept/reject AI suggestions (isApproved toggle) | 5.4 | Backlog |
| Teacher score override (teacherFinalScore fields) | 5.4 | Backlog |
| "Approve & Next" action with stamp animation | 5.4 | Backlog |
| Breather summary after every 5 items | 5.4 | Backlog |
| Full grading queue management page with filters | 5.5 | Backlog |
| Student feedback view | 5.6 | Backlog |

**The right pane renders feedback cards as READ-ONLY in this story.** No approve/reject buttons. No score editing. Those interactions are added in Story 5.4. The feedback items display `isApproved` as null (pending) — show them with neutral styling (no green/red approved/rejected states).

### Pre-fetch Strategy with Instant Transitions

```typescript
// Hook: use-prefetch-submission.ts
// When submission N loads, pre-fetch N+1
const queryClient = useQueryClient();

useEffect(() => {
  if (nextSubmissionId) {
    queryClient.prefetchQuery({
      queryKey: gradingKeys.detail(nextSubmissionId),
      queryFn: () => fetchSubmissionDetail(nextSubmissionId),
      staleTime: 30_000, // 30 seconds
    });
  }
}, [nextSubmissionId]);

// When navigating to next submission, use pre-fetched data as initialData
// for zero-flicker transition:
function useSubmissionDetail(submissionId: string) {
  const queryClient = useQueryClient();
  // Check if data was pre-fetched (types are inferred after Task 2 schema sync)
  const cachedData = queryClient.getQueryData(gradingKeys.detail(submissionId));

  return useQuery({
    queryKey: gradingKeys.detail(submissionId),
    queryFn: () => fetchSubmissionDetail(submissionId),
    initialData: cachedData,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.analysisStatus;
      return status === "analyzing" ? 5000 : false;
    },
  });
}
```

This guarantees the teacher sees instant content when clicking "Next" (if pre-fetch completed). Only falls back to a loading spinner if the pre-fetch hasn't finished yet.

### Responsive Breakpoints

| Viewport | Layout | Notes |
|----------|--------|-------|
| Desktop (> 1024px) | Horizontal split 55/45, resizable | Full experience |
| Tablet (768-1024px) | Horizontal split 60/40, resizable | Slightly smaller right pane |
| Mobile (< 768px) | Vertical stack (work on top, feedback below) | No resize handle, scroll between sections |

### File Structure (New Files)

```
apps/webapp/src/features/grading/
├── GradingQueuePage.tsx              # MODIFIED — replace placeholder with workbench entry
├── components/
│   ├── resizable.tsx                 # NEW — local shadcn-style wrapper for react-resizable-panels
│   ├── WorkbenchLayout.tsx           # Split-screen resizable container
│   ├── StudentWorkPane.tsx           # Left pane: student submission display
│   ├── AIFeedbackPane.tsx            # Right pane: AI analysis display
│   ├── BandScoreCard.tsx             # Band score summary component
│   ├── FeedbackItemCard.tsx          # Individual feedback item card
│   └── SubmissionNav.tsx             # Prev/Next navigation
├── hooks/
│   ├── grading-keys.ts              # React Query key factory
│   ├── use-grading-queue.ts         # Hook: fetch grading queue
│   ├── use-submission-detail.ts     # Hook: fetch submission + feedback (with polling)
│   ├── use-prefetch-submission.ts   # Hook: prefetch next submission
│   └── use-retrigger-analysis.ts    # Hook: useMutation for POST /analyze
└── __tests__/
    ├── WorkbenchLayout.test.tsx
    ├── StudentWorkPane.test.tsx
    ├── AIFeedbackPane.test.tsx
    ├── SubmissionNav.test.tsx
    └── grading-hooks.test.ts
```

**Modified files:**
- `apps/backend/src/modules/grading/grading.routes.ts` — replace `z.unknown()` with typed response schemas
- `apps/webapp/src/schema/schema.d.ts` — auto-regenerated via `sync-schema-dev`
- `apps/webapp/src/App.tsx` — add nested `grading/:submissionId` route

### Critical Implementation Notes

1. **Do NOT create new backend endpoints.** All APIs exist from Story 5.1. The only backend change is fixing response schema types in `grading.routes.ts` (Task 2) — no new routes or logic.

2. **Use `openapi-fetch` typed client** (`@/core/client`). Do NOT use raw `fetch()` or `axios`. The client provides automatic type inference from `schema.d.ts`.

3. **Feedback items are READ-ONLY in this story.** Render them as informational cards. Do not add approve/reject buttons, checkboxes, or any mutation actions. Those belong to Story 5.4.

4. **Pre-fetching must be silent.** The teacher should never see a loading spinner when clicking "Next" if pre-fetch succeeded. Show instant transition. Only show loading if pre-fetch failed or was slow.

5. **The queue determines navigation order.** Fetch the full queue list on mount, use it to determine prev/next submission IDs. The queue is sorted by `submittedAt` (oldest first) by default.

6. **Handle null feedback gracefully.** If `feedback` is null and `analysisStatus` is "ready", it means analysis completed but produced no feedback. Show "AI analysis completed with no feedback items."

7. **Tenant isolation is automatic.** The backend API already scopes by `centerId` from the auth token. The frontend does not need to pass `centerId` to grading endpoints — it's extracted from the JWT by backend middleware.

8. **No `any` types.** After Task 2 (backend schema fix + `sync-schema-dev`), `schema.d.ts` will have fully typed responses. The `client.GET(...)` calls will return typed data automatically — no manual casts or local type files needed. If schema sync hasn't been done yet, the types will be `unknown` and compilation will fail, which is the correct signal to run Task 2 first.

9. **Test with Vitest + React Testing Library.** Co-locate test files in `__tests__/` directory within the feature folder. Mock `client.GET` calls in tests.

10. **ResizablePanel persistence (optional nice-to-have).** `react-resizable-panels` supports `autoSaveId` to persist panel sizes to localStorage. Use `autoSaveId="grading-workbench"` so the teacher's preferred split persists across sessions.

### Previous Story Intelligence (from 5-1)

**Patterns established in Story 5.1 that apply here:**
- Gemini AI generates structured JSON with `overallScore`, `criteriaScores`, `generalFeedback`, and `highlights` (stored as `AIFeedbackItem` records)
- Each highlight has `startOffset`/`endOffset` for future text anchoring (Story 5.3) — display these offsets are available but do NOT implement visual anchoring in this story
- `confidence` field (0-1) on each feedback item — display as percentage (e.g., "95%") to help teacher assess AI reliability
- `originalContextSnippet` stores the text at AI analysis time — useful for showing what the AI saw even if text display differs slightly
- `analysisStatus` is derived from `GradingJob.status` on the backend, not stored directly — always use the status from the API response

**Code review findings from 5-1 to carry forward:**
- Teacher-class authorization is enforced by backend — if teacher doesn't teach the class, API returns 403. Handle this gracefully in the UI (show "You don't have access to this submission")
- The queue endpoint supports pagination (page, limit) — default to `limit: 50` for initial load to get enough items for smooth navigation
- `failureReason` on queue items tells the teacher why AI analysis failed — always display this when `analysisStatus === "failed"`

### Project Structure Notes

- All new code goes in `apps/webapp/src/features/grading/` — the feature-first directory already exists with the placeholder
- Hooks in `hooks/` subdirectory, components in `components/` subdirectory, tests in `__tests__/` subdirectory
- Follow co-location principle: grading-specific components stay in the grading feature, not in shared components
- The `resizable.tsx` wrapper stays local in the grading feature `components/` directory (not in `packages/ui`) because `react-resizable-panels` is an `apps/webapp` dependency, not a `packages/ui` dependency
- No local `types.ts` needed — after Task 2's schema sync, all types flow from `@workspace/types` through `schema.d.ts` into the `openapi-fetch` client automatically

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 — Story 5.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Feature-first structure, API patterns, state management]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Split-screen workbench, Evidence Anchoring UX, responsive strategy, keyboard shortcuts]
- [Source: _bmad-output/implementation-artifacts/5-1-automated-submission-analysis.md — Backend API, data models, code review fixes]
- [Source: project-context.md — Testing rules, import patterns, no any types]
- [Source: apps/webapp/src/features/submissions/hooks/use-submission.ts — Hook pattern to follow]
- [Source: apps/webapp/src/core/client.ts — openapi-fetch typed client]
- [Source: packages/types/src/grading.ts — Zod schemas for grading types]
- [Source: apps/webapp/src/App.tsx — Route configuration, grading route at line ~259]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Backend builds clean after schema changes (0 TypeScript errors)
- Frontend compiles clean (0 TypeScript errors from `tsc --noEmit`)
- Schema sync successful: `schema.d.ts` now has typed grading endpoints
- Full test suite: 671 tests passing across 51 test files, 0 failures (post-review)

### Completion Notes List

- **Task 1:** Created local shadcn-style `resizable.tsx` wrapper for `react-resizable-panels` in grading feature. Exports ResizablePanelGroup, ResizablePanel, ResizableHandle.
- **Task 2:** Replaced 4x `z.object({ data: z.unknown() })` with proper response schemas (GradingQueueResponseSchema, SubmissionDetailResponseSchema, SubmissionFeedbackResponseSchema, GradingJobResponseSchema). Ran `sync-schema-dev` to regenerate `schema.d.ts` with fully typed responses.
- **Task 3:** Created 5 React Query hooks following existing `use-submission.ts` pattern: grading-keys factory, useGradingQueue (with filters), useSubmissionDetail (with polling for "analyzing" status at 5s interval), usePrefetchSubmission (staleTime 30s), useRetriggerAnalysis (mutation with toast notifications and cache invalidation).
- **Task 4:** Rewrote GradingQueuePage from placeholder to full workbench. Handles empty queue ("All caught up!"), all-analyzing state, 403 errors, API errors with retry, and queue-based navigation with URL sync. Added `grading/:submissionId` nested route in App.tsx.
- **Task 5:** Created WorkbenchLayout with useMediaQuery hook. Horizontal split 55/45 on desktop, 60/40 on tablet, vertical stack on mobile. Resize handle hidden on mobile. autoSaveId persists panel sizes.
- **Task 6:** Created StudentWorkPane with collapsible question/prompt context, paragraph-preserved text rendering, word count with min-word comparison for Writing, "No transcript available" for Speaking, Separator dividers for multi-question submissions.
- **Task 7:** Created AIFeedbackPane with BandScoreCard (per-skill criteria labels), FeedbackItemCard (type icons, severity badges, confidence %, suggested fixes with del/ins), feedback grouped by type with counts, Skeleton loading state, failed state with Re-analyze button.
- **Task 8:** Created SubmissionNav with Prev/Next buttons, position indicator, disabled states at boundaries, ArrowLeft/ArrowRight keyboard shortcuts (skipped when input/textarea focused), cleanup on unmount.
- **Task 9:** 45 new tests across 5 test files covering all components and hooks. All 665 project tests pass.

### Change Log

- 2026-02-16: Story 5.2 implementation complete — Split-screen grading interface with all 9 tasks done
- 2026-02-16: Code review fixes applied (6 issues fixed: H1 currentIndex sync, H2 type assertions, M1 hook tests, M2 detail retry, M3 schema types, M4 test mock warnings)

### File List

**New files:**
- `apps/webapp/src/features/grading/components/resizable.tsx`
- `apps/webapp/src/features/grading/components/WorkbenchLayout.tsx`
- `apps/webapp/src/features/grading/components/StudentWorkPane.tsx`
- `apps/webapp/src/features/grading/components/AIFeedbackPane.tsx`
- `apps/webapp/src/features/grading/components/BandScoreCard.tsx`
- `apps/webapp/src/features/grading/components/FeedbackItemCard.tsx`
- `apps/webapp/src/features/grading/components/SubmissionNav.tsx`
- `apps/webapp/src/features/grading/hooks/grading-keys.ts`
- `apps/webapp/src/features/grading/hooks/use-grading-queue.ts`
- `apps/webapp/src/features/grading/hooks/use-submission-detail.ts`
- `apps/webapp/src/features/grading/hooks/use-prefetch-submission.ts`
- `apps/webapp/src/features/grading/hooks/use-retrigger-analysis.ts`
- `apps/webapp/src/features/grading/__tests__/grading-keys.test.ts`
- `apps/webapp/src/features/grading/__tests__/WorkbenchLayout.test.tsx`
- `apps/webapp/src/features/grading/__tests__/StudentWorkPane.test.tsx`
- `apps/webapp/src/features/grading/__tests__/AIFeedbackPane.test.tsx`
- `apps/webapp/src/features/grading/__tests__/SubmissionNav.test.tsx`
- `apps/webapp/src/features/grading/__tests__/grading-hooks.test.ts`

**Modified files:**
- `apps/backend/src/modules/grading/grading.routes.ts` — replaced z.unknown() with typed response schemas
- `apps/webapp/src/schema/schema.d.ts` — auto-regenerated via sync-schema-dev, patched with nested relation types
- `apps/webapp/src/App.tsx` — added grading/:submissionId nested route
- `apps/webapp/src/features/grading/GradingQueuePage.tsx` — replaced placeholder with full workbench
- `packages/types/src/grading.ts` — expanded SubmissionDetailSchema with nested relations (z.looseObject for passthrough)
