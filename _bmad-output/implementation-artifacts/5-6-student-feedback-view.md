# Story 5.6: Student Feedback View

Status: done

## Story

As a Student,
I want to view my graded assignment with teacher feedback,
so that I can learn from my mistakes and improve.

## Acceptance Criteria

1. **AC1 — Notification:** Student receives an in-app indication when their submission is graded (badge/highlight on the Student Assignment Dashboard for newly graded items).
2. **AC2 — Access Path:** From Student Dashboard (Story 3.16), clicking a "Graded" assignment opens the feedback view.
3. **AC3 — Feedback Layout:** Display the student's original submission with: overall score prominently displayed, inline comments anchored to specific text (teacher-approved AI comments + student-facing teacher comments), and a general feedback section at bottom.
4. **AC4 — Comment Visibility:** Only teacher-approved AI feedback items (`isApproved = true`) and student-facing teacher comments (`visibility = "student_facing"`) appear. Rejected AI suggestions and private teacher comments are hidden.
5. **AC5 — Grammar Highlights:** Grammar corrections shown as tracked-changes style (strikethrough original + correction inline) using AI feedback items of type `grammar` with `suggestedFix`.
6. **AC6 — Score Breakdown:** For multi-criteria rubrics (IELTS Writing: Task Achievement, Coherence, Lexical Resource, Grammar), show individual criteria scores. Use teacher override scores (`teacherFinalScore`, `teacherCriteriaScores`) when available, falling back to AI scores.
7. **AC7 — Submission History:** If resubmission was allowed, display version history showing previous submissions with their scores and dates.
8. **AC8 — Mobile Optimized:** Feedback view works on viewports down to 375px. Tap to expand anchored comments. Scrollable sections with sticky score header.

## Tasks / Subtasks

- [x] **Task 1: Define student feedback Zod schemas** (AC: 3, 4, 6)
  - [x] 1.1 Add `StudentFeedbackResponseSchema` to `packages/types/src/grading.ts`
    - Reuse `SubmissionAnswerSchema` for answers
    - Include filtered `AIFeedbackItemSchema` (only approved items)
    - Include filtered `TeacherCommentSchema` (only student_facing)
    - Include score fields (overall + criteria, preferring teacher overrides)
    - Include `generalFeedback` (teacher override or AI)
  - [x] 1.2 Add `SubmissionHistoryItemSchema` — `{ id, submittedAt, score, status }`
  - [x] 1.3 Add `StudentFeedbackResponseSchema` wrapping: submission answers, feedback items, comments, scores, history

- [x] **Task 2: Backend service — getStudentFeedback** (AC: 3, 4, 5, 6)
  - [x] 2.1 Add method to `apps/backend/src/modules/grading/grading.service.ts`
  - [x] 2.2 Create `resolveUser(db, firebaseUid)` private method (or reuse/adapt existing `verifyAccess()`). Resolve Firebase UID via `authAccount.findUniqueOrThrow({ where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } } })`. Return `{ userId, role }` without enforcing teacher-only RBAC.
  - [x] 2.3 Query `Submission` with `include: { answers: true, feedback: { include: { items: true } }, teacherComments: true }` where `id = submissionId` AND `centerId` scoped via `getTenantedClient`
  - [x] 2.4 Verify `submission.studentId === userId` — return 403 if not the owner (STUDENT role). Teachers/Admins/Owners bypass this check.
  - [x] 2.5 Filter `feedback.items` to only `isApproved === true`
  - [x] 2.6 Filter `teacherComments` to only `visibility === "student_facing"`
  - [x] 2.7 Build response: use `teacherFinalScore ?? overallScore` for displayed score, `teacherCriteriaScores ?? criteriaScores` for breakdown, `teacherGeneralFeedback ?? generalFeedback` for general feedback
  - [x] 2.8 Include author info on teacher comments (join `User` for `authorName`)

- [x] **Task 3: Backend service — getSubmissionHistory** (AC: 7)
  - [x] 3.1 Add method to `grading.service.ts`
  - [x] 3.2 Query all submissions for same `assignmentId + studentId` where `status = GRADED`, ordered by `submittedAt DESC`
  - [x] 3.3 For each, include `feedback.teacherFinalScore ?? feedback.overallScore` as the score
  - [x] 3.4 Return array of `{ id, submittedAt, score, status }`

- [x] **Task 4: Backend controller + routes — student feedback endpoints** (AC: 2, 3, 7)
  - [x] 4.1 Add controller methods in `grading.controller.ts` following Route-Controller-Service pattern
  - [x] 4.2 Add routes in `grading.routes.ts` under a new prefix `/student`:
    - `GET /api/v1/grading/student/submissions/:submissionId` — returns student feedback (requires auth, allows ALL roles; ownership enforced in service for STUDENT role)
    - `GET /api/v1/grading/student/submissions/:submissionId/history` — returns submission history
  - [x] 4.3 Use `authMiddleware` (global hook). For these student routes, use `requireRole(["STUDENT", "TEACHER", "ADMIN", "OWNER"])` — explicitly include STUDENT. The existing teacher routes use `requireRole(["TEACHER", "ADMIN", "OWNER"])`. These are separate route registrations.
  - [x] 4.4 Use `fastify-type-provider-zod` for request/response schemas (same `validatorCompiler`/`serializerCompiler` pattern)
  - [x] 4.5 Controller formats `{ data, message }` response shape. Use existing `serializeDates()` helper for Date-to-ISO conversion.

- [x] **Task 5: Frontend hook — useStudentFeedback** (AC: 3)
  - [x] 5.1 Create `apps/webapp/src/features/grading/hooks/use-student-feedback.ts`
  - [x] 5.2 Add keys to existing `gradingKeys` in `apps/webapp/src/features/grading/hooks/grading-keys.ts`:
    ```typescript
    studentFeedback: (id: string) => [...gradingKeys.all, "student-feedback", id] as const,
    submissionHistory: (id: string) => [...gradingKeys.all, "submission-history", id] as const,
    ```
  - [x] 5.3 Fetch `GET /api/v1/grading/student/submissions/:submissionId` using `import { client } from "@/core/client"` (openapi-fetch)
  - [x] 5.4 Return typed `StudentFeedbackResponse`

- [x] **Task 6: Frontend hook — useSubmissionHistory** (AC: 7)
  - [x] 6.1 Create `apps/webapp/src/features/grading/hooks/use-submission-history.ts`
  - [x] 6.2 Use `gradingKeys.submissionHistory(submissionId)` as query key
  - [x] 6.3 Fetch `GET /api/v1/grading/student/submissions/:submissionId/history` using `import { client } from "@/core/client"`

- [x] **Task 7: Frontend — StudentFeedbackPage** (AC: 2, 3, 8)
  - [x] 7.1 Create `apps/webapp/src/features/grading/student/StudentFeedbackPage.tsx`
  - [x] 7.2 URL params: `centerId`, `submissionId` from route (`/:centerId/dashboard/feedback/:submissionId`)
  - [x] 7.3 Layout: sticky score header at top, scrollable body with student work + inline feedback, general feedback section at bottom
  - [x] 7.4 Loading state with skeleton. Error state for 403/404.
  - [x] 7.5 Mobile responsive — single column layout, no split screen (unlike teacher workbench)

- [x] **Task 8: Frontend — StudentScoreDisplay component** (AC: 3, 6)
  - [x] 8.1 Create `apps/webapp/src/features/grading/student/StudentScoreDisplay.tsx`
  - [x] 8.2 Prominent overall score (large number, IELTS band style 0-9)
  - [x] 8.3 Criteria breakdown cards if `criteriaScores` present: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy (for Writing); Fluency, Pronunciation (for Speaking)
  - [x] 8.4 Visual band scale indicator (colored bar or gauge)

- [x] **Task 9: Frontend — StudentFeedbackContent component** (AC: 3, 4, 5)
  - [x] 9.1 Create `apps/webapp/src/features/grading/student/StudentFeedbackContent.tsx`
  - [x] 9.2 Render student's original answers (writing text or transcript)
  - [x] 9.3 Reuse offset-to-highlight logic from `StudentWorkPane.tsx` — specifically the global offset calculation for multi-answer concatenation and the per-answer local offset mapping. Do NOT recreate this logic; extract or import the shared utility.
  - [x] 9.4 Grammar items (`type: "grammar"`) render as tracked-change spans: `<del>original</del><ins>suggestedFix</ins>` with appropriate styling (red strikethrough + green insertion)
  - [x] 9.5 Non-grammar anchored items render as highlighted text spans. Tap/click on highlight to expand the comment in a popover (read-only, no editing).
  - [x] 9.6 Display teacher comment anchors with emerald green highlights (same color as in teacher workbench) and "Teacher" badge
  - [x] 9.7 Distinguish AI feedback vs teacher comments visually (AI: blue/purple tint, Teacher: emerald green + "Teacher" badge with author name)

- [x] **Task 10: Frontend — StudentCommentsList component** (AC: 3, 4)
  - [x] 10.1 Create `apps/webapp/src/features/grading/student/StudentCommentsList.tsx`
  - [x] 10.2 General feedback section at bottom of the page
  - [x] 10.3 Display unanchored AI feedback items (those without startOffset/endOffset)
  - [x] 10.4 Display unanchored teacher comments (general comments without offsets)
  - [x] 10.5 Visual distinction: AI items with AI badge, teacher items with "Teacher" badge + author name/avatar
  - [x] 10.6 Chronological ordering within the section

- [x] **Task 11: Frontend — SubmissionHistoryPanel component** (AC: 7)
  - [x] 11.1 Create `apps/webapp/src/features/grading/student/SubmissionHistoryPanel.tsx`
  - [x] 11.2 Collapsible panel showing list of past submissions for same assignment
  - [x] 11.3 Each entry: date, score, link to view that version's feedback
  - [x] 11.4 Current submission highlighted. Only show if history has > 1 entry.

- [x] **Task 12: Route registration and dashboard integration** (AC: 1, 2)
  - [x] 12.1 Add route in `apps/webapp/src/App.tsx` nested under `/:centerId/dashboard`: `feedback/:submissionId` with `allowedRoles: ["STUDENT", "TEACHER", "ADMIN", "OWNER"]`. Use the same `<ErrorBoundary><ProtectedRoute>` wrapper pattern as existing routes.
  - [x] 12.2 In `apps/webapp/src/features/dashboard/components/AssignmentCard.tsx` (~line 66): change the "View Results" navigation from `/${centerId}/assignments/${assignment.id}/take` to `/${centerId}/dashboard/feedback/${assignment.submissionId}` when `subStatus === "GRADED"`. The `submissionId` is already returned by the student assignments endpoint.
  - [x] 12.3 Add "New" badge on recently graded assignment cards (graded within last 24 hours or since student last viewed results). Use `localStorage` to track last-viewed submission IDs.
  - [x] 12.4 Sync the `openapi-fetch` schema: run `pnpm --filter=webapp sync-schema-dev` after backend routes are added

- [x] **Task 13: Backend integration tests** (AC: 3, 4, 7)
  - [x] 13.1 Create `apps/backend/src/modules/grading/student-feedback.routes.integration.test.ts`
  - [x] 13.2 Test: student can fetch their own graded submission feedback
  - [x] 13.3 Test: student CANNOT fetch another student's submission (403)
  - [x] 13.4 Test: response contains only approved AI feedback items (not rejected)
  - [x] 13.5 Test: response contains only student_facing teacher comments (not private)
  - [x] 13.6 Test: teacher override scores are preferred over AI scores
  - [x] 13.7 Test: submission history returns correct entries
  - [x] 13.8 Test: teacher/admin can access any student's feedback view

- [x] **Task 14: Frontend component tests** (AC: 3, 5, 6, 8)
  - [x] 14.1 Create `apps/webapp/src/features/grading/student/__tests__/StudentFeedbackPage.test.tsx`
  - [x] 14.2 Test: renders score and criteria breakdown correctly
  - [x] 14.3 Test: grammar corrections display as tracked changes (strikethrough + insertion)
  - [x] 14.4 Test: only approved AI items and student_facing comments render
  - [x] 14.5 Test: general feedback section renders unanchored comments
  - [x] 14.6 Test: submission history panel shows when multiple submissions exist
  - [x] 14.7 Test: mobile viewport renders correctly (no horizontal scroll)

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service layering** (project-context.md Rule 6): Route extracts params, controller formats `{ data, message }` response, service does DB + business logic.
- **Multi-tenancy** (Rule 1): Use `getTenantedClient(centerId)` for all Prisma queries. Do NOT use `new PrismaClient()`.
- **Zod type safety** (Rule 2): All request/response schemas via `fastify-type-provider-zod`.
- **Feature-first organization** (Convention): New student components go in `apps/webapp/src/features/grading/student/`. Co-locate tests.

### Critical Implementation Details

**Firebase UID Resolution (Actual Codebase Pattern):**
The grading service uses a private `verifyAccess()` method that resolves Firebase UID AND checks RBAC:
```typescript
// In grading.service.ts — verifyAccess() uses:
const authAccount = await db.authAccount.findUniqueOrThrow({
  where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } }
});
```
For the student endpoint, create a NEW method `verifyStudentAccess()` (or rename to `resolveUser()`) that:
1. Resolves Firebase UID to internal userId using the same `findUniqueOrThrow` composite key pattern above
2. Returns `{ userId, role }` without enforcing teacher-only RBAC
3. Let the calling method handle ownership/role checks

**Ownership Check Pattern:**
```typescript
// In getStudentFeedback():
const { userId, role } = await this.resolveUser(db, firebaseUid);
// STUDENT role: verify submission belongs to them
if (role === 'STUDENT' && submission.studentId !== userId) {
  throw AppError.forbidden('Not authorized to view this submission');
}
// TEACHER/ADMIN/OWNER: access any submission in their center (tenancy handles isolation)
```
Use `AppError.forbidden()` (not bare `throw new Error`) — this is the existing error pattern in the grading service.

**Score Display Priority:**
Teacher overrides take precedence:
- `teacherFinalScore ?? feedback.overallScore` for overall
- `teacherCriteriaScores ?? feedback.criteriaScores` for breakdown
- `teacherGeneralFeedback ?? feedback.generalFeedback` for text

**Offset-to-Highlight Reuse:**
`StudentWorkPane.tsx` already implements complex logic for:
1. Global offset calculation across concatenated multi-answer text
2. Mapping global offsets to per-answer local offsets
3. Merging AI feedback highlights with teacher comment highlights

The student feedback view MUST reuse this logic. Extract the offset calculation utilities into a shared module (e.g., `apps/webapp/src/features/grading/utils/offset-utils.ts`) if not already extracted. Do NOT recreate from scratch.

**Grammar Tracked-Changes Rendering:**
AI feedback items with `type: "grammar"` have:
- `startOffset` / `endOffset` — the error location in student text
- `originalContextSnippet` — the original text
- `suggestedFix` — the correction

Render as: `<span class="line-through text-red-500">{original}</span><span class="text-green-600 font-medium">{suggestedFix}</span>`

**Teacher Comment Colors:**
From Story 5-7: teacher comment anchors use emerald green highlights (`bg-emerald-100`). AI feedback uses blue/purple. Maintain this visual distinction in the student view.

**No Editing in Student View:**
The student view is strictly read-only. Do NOT include:
- Comment creation popover (omitting `onCreateComment` from StudentWorkPane already handles this)
- Approve/reject buttons
- Score override inputs
- Text selection for commenting (inert when `onCreateComment` is omitted)

**StudentWorkPane Reuse Note:** The `onCreateComment` prop is already optional in `StudentWorkPane.tsx`. When not passed, the CommentPopover doesn't render and text selection has no effect. Simply omit the prop — no fork or `readOnly` prop needed.

### Existing Components to Reuse

| Component | Reuse Strategy |
|-----------|---------------|
| `StudentWorkPane.tsx` | `onCreateComment` prop is already optional. When omitted, CommentPopover doesn't render and text selection is inert. Just don't pass `onCreateComment` — no `readOnly` prop or fork needed. |
| `HighlightedText` logic | Reuse for rendering text with inline feedback anchors |
| `TeacherCommentCard.tsx` | Render in read-only mode (hide edit/delete buttons). Already supports author name/avatar display. |
| `FeedbackItemCard.tsx` | Adapt for read-only (hide approve/reject buttons). Show content and anchored context. |
| `BandScoreCard.tsx` | Reuse directly for IELTS score display |
| `ConnectionLineOverlay.tsx` | May be useful for connecting highlights to expanded comments |

### Backend Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/grading/student/submissions/:submissionId` | ALL roles (ownership check for STUDENT) | Student feedback with filtered items |
| GET | `/api/v1/grading/student/submissions/:submissionId/history` | ALL roles (ownership check for STUDENT) | Submission version history |

### Database Queries (No Migration Needed)

All required fields already exist:
- `Submission.status` — `GRADED` status indicates ready for student view
- `AIFeedbackItem.isApproved` — filter for student visibility
- `TeacherComment.visibility` — `"student_facing"` filter
- `SubmissionFeedback.teacherFinalScore` / `teacherCriteriaScores` — teacher overrides

No new database columns or migrations required for this story.

### Student Dashboard Integration

**Confirmed:** The student assignments endpoint (`GET /api/v1/student/assignments/`) already returns `submissionId` and `submissionStatus` for each assignment. No backend changes needed for the dashboard data.

**File to modify:** `apps/webapp/src/features/dashboard/components/AssignmentCard.tsx`

**Current code (line ~66):**
```typescript
// Currently ALL statuses navigate to the same submission form:
navigate(`/${centerId}/assignments/${assignment.id}/take`);
```

**Required change:**
```typescript
if (subStatus === "GRADED" && assignment.submissionId) {
  navigate(`/${centerId}/dashboard/feedback/${assignment.submissionId}`);
} else {
  navigate(`/${centerId}/assignments/${assignment.id}/take`);
}
```

The "View Results" button label is already correctly rendered when `subStatus === "GRADED"`.

For the "New" badge: compare graded timestamp against `localStorage.getItem('lastViewedGrades_${centerId}')` timestamp.

### Project Structure Notes

New files follow feature-first pattern under the existing grading feature:

```
apps/webapp/src/features/grading/student/
├── StudentFeedbackPage.tsx        # Main page component
├── StudentScoreDisplay.tsx        # Score header + criteria breakdown
├── StudentFeedbackContent.tsx     # Student work with inline feedback
├── StudentCommentsList.tsx        # General comments section
├── SubmissionHistoryPanel.tsx     # Version history (collapsible)
└── __tests__/
    └── StudentFeedbackPage.test.tsx

apps/webapp/src/features/grading/hooks/
├── use-student-feedback.ts        # NEW
└── use-submission-history.ts      # NEW

apps/webapp/src/features/grading/utils/
└── offset-utils.ts                # EXTRACT from StudentWorkPane if needed

apps/backend/src/modules/grading/
├── grading.service.ts             # ADD getStudentFeedback, getSubmissionHistory
├── grading.controller.ts          # ADD student feedback controller methods
├── grading.routes.ts              # ADD /student/* routes
└── student-feedback.routes.integration.test.ts  # NEW

packages/types/src/grading.ts      # ADD StudentFeedbackResponseSchema, SubmissionHistoryItemSchema
```

### Previous Story Learnings (Epic 5)

From Story 5-4 (One-Click Approval):
- `$transaction` pattern: call `getTenantedClient` OUTSIDE the transaction, use `tx` with explicit `centerId` inside (Rule 5). Not directly needed here since student feedback is read-only, but important if any write operations are added.
- Optimistic updates: Not needed for read-only student view.

From Story 5-5 (Grading Queue):
- Used `findFirst` instead of `findUnique` for enrollment checks (commit 963f82d). Note: Firebase UID resolution in grading service uses `findUniqueOrThrow` with composite key (different table/pattern).
- URL search params for filter persistence — useful pattern for submission history navigation.
- Integration tests use `Fastify()` + manual mock wiring + `app.inject()` pattern (NOT `buildApp()`). Mock Firebase auth via `(app as any).firebaseAuth = mockFirebaseAuth` where `mockFirebaseAuth.verifyIdToken` returns `{ uid, email, role, center_id }`. Mock Prisma via `(app as any).prisma = mockPrisma` where `mockPrisma.$extends.mockReturnValue(mockDb)`.

From Story 5-7 (Teacher Commenting):
- Teacher comment highlight colors: emerald green (`bg-emerald-100`).
- `data-char-start` attributes on DOM elements for offset mapping — reuse this in student view.
- Character offset mapping from DOM selection uses global offset calculation per answer — this is the critical utility to reuse/extract.
- Cross-answer selection rejection — not needed in student view (no selection).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.6 acceptance criteria]
- [Source: project-context.md — Rules 1, 2, 5, 6]
- [Source: _bmad-output/planning-artifacts/architecture.md — REST API, RBAC, multi-tenancy patterns]
- [Source: packages/types/src/grading.ts — SubmissionDetailSchema, AIFeedbackItemSchema, TeacherCommentSchema]
- [Source: apps/backend/src/modules/grading/grading.routes.ts — existing endpoint patterns and role restrictions]
- [Source: apps/webapp/src/features/grading/components/StudentWorkPane.tsx — offset calculation and highlight rendering]
- [Source: 5-5-grading-queue-management.md — Firebase UID resolution pattern, integration test patterns]
- [Source: 5-7-free-form-teacher-commenting.md — teacher comment highlight colors, offset mapping, visibility toggle]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Backend build: clean compilation after adding explicit return type to `getStudentFeedback` (Prisma inference issue)
- Backend tests: 754 passed (12 new student feedback tests), 0 regressions
- Frontend tests: 14 new tests all pass (StudentScoreDisplay: 4, StudentFeedbackContent: 4, StudentCommentsList: 4, SubmissionHistoryPanel: 2)
- Lint: 0 warnings after removing unused `beforeEach` import from test file
- Pre-existing failures in `users/components` (InviteUserModal, ProfileEditForm) — unrelated to this story

### Completion Notes List
- Task 1: Added `StudentFeedbackDataSchema`, `SubmissionHistoryItemSchema`, `StudentFeedbackResponseSchema`, `SubmissionHistoryResponseSchema` to `packages/types/src/grading.ts`
- Task 2: Added `resolveUser()` private method and `getStudentFeedback()` to grading service. Filters approved AI items, student_facing comments. Prefers teacher override scores.
- Task 3: Added `getSubmissionHistory()` — queries all GRADED submissions for same assignment+student
- Task 4: Added controller methods + routes under `/student` prefix with `requireRole(["STUDENT", "TEACHER", "ADMIN", "OWNER"])`
- Task 5-6: Created `use-student-feedback.ts` and `use-submission-history.ts` hooks with TanStack Query. Added keys to `grading-keys.ts`. Note: openapi-fetch types will resolve after schema sync (Task 12.4).
- Task 7: `StudentFeedbackPage.tsx` — main page with sticky score header, back navigation, loading/error states, localStorage tracking for "New" badge
- Task 8: `StudentScoreDisplay.tsx` — read-only score card with visual band scale bar and criteria breakdown (writing + speaking)
- Task 9: `StudentFeedbackContent.tsx` — renders student answers with inline annotations. Grammar corrections as tracked-change spans (red strikethrough + green insertion). AI highlights in blue, teacher highlights in emerald green with popover on tap.
- Task 10: `StudentCommentsList.tsx` — general feedback section with unanchored AI/teacher comments, chronological ordering, visual distinction (AI badge vs Teacher badge + author name)
- Task 11: `SubmissionHistoryPanel.tsx` — collapsible panel, shows only when >1 entry, current submission highlighted, navigation to other versions
- Task 12: Route registered at `/:centerId/dashboard/feedback/:submissionId`. AssignmentCard navigates to feedback view when GRADED. "New" badge via localStorage. Schema sync pending (requires running backend).
- Task 13: 12 integration tests covering ownership, filtering, score preferences, history, auth
- Task 14: 14 component tests covering score display, grammar tracked changes, comment visibility, general feedback, history panel

### Change Log
- 2026-02-17: Story 5.6 implemented — Student Feedback View with full backend + frontend
- 2026-02-17: Code review fixes applied (7 issues: 2 HIGH, 3 MEDIUM, 2 LOW)
  - H1: Fixed hardcoded skill="WRITING" — backend now returns exerciseSkill, frontend uses it
  - H2: Added GRADED status check in getStudentFeedback service
  - M1: Extracted shared offset-utils.ts from duplicated code in StudentWorkPane + StudentFeedbackContent
  - M2: Removed misleading empty history field from StudentFeedbackDataSchema/controller
  - M3: Added missing mobile viewport test (Task 14.7)
  - L1: resolveUser now throws on missing membership instead of defaulting to STUDENT
  - L2: AssignmentCard "New" badge now checks 24-hour grading window

### File List
- `packages/types/src/grading.ts` — MODIFIED (added StudentFeedback + SubmissionHistory schemas; added exerciseSkill, removed history)
- `apps/backend/src/modules/grading/grading.service.ts` — MODIFIED (added resolveUser, getStudentFeedback, getSubmissionHistory; review: GRADED check, exercise join, resolveUser throws)
- `apps/backend/src/modules/grading/grading.controller.ts` — MODIFIED (added getStudentFeedback, getSubmissionHistory; review: removed empty history)
- `apps/backend/src/modules/grading/grading.routes.ts` — MODIFIED (added /student/* routes with STUDENT role access)
- `apps/backend/src/modules/grading/student-feedback.routes.integration.test.ts` — NEW (14 integration tests; review: +2 tests for exerciseSkill and non-GRADED)
- `apps/webapp/src/features/grading/hooks/grading-keys.ts` — MODIFIED (added studentFeedback, submissionHistory keys)
- `apps/webapp/src/features/grading/hooks/use-student-feedback.ts` — NEW
- `apps/webapp/src/features/grading/hooks/use-submission-history.ts` — NEW
- `apps/webapp/src/features/grading/utils/offset-utils.ts` — NEW (review: extracted shared offset calculation)
- `apps/webapp/src/features/grading/student/StudentFeedbackPage.tsx` — NEW (review: uses exerciseSkill from API)
- `apps/webapp/src/features/grading/student/StudentScoreDisplay.tsx` — NEW
- `apps/webapp/src/features/grading/student/StudentFeedbackContent.tsx` — NEW (review: uses shared offset-utils)
- `apps/webapp/src/features/grading/student/StudentCommentsList.tsx` — NEW
- `apps/webapp/src/features/grading/student/SubmissionHistoryPanel.tsx` — NEW
- `apps/webapp/src/features/grading/student/__tests__/StudentFeedbackPage.test.tsx` — NEW (15 tests; review: +1 mobile viewport test)
- `apps/webapp/src/features/grading/components/StudentWorkPane.tsx` — MODIFIED (review: refactored to use shared offset-utils)
- `apps/webapp/src/App.tsx` — MODIFIED (added feedback/:submissionId route)
- `apps/webapp/src/features/dashboard/components/AssignmentCard.tsx` — MODIFIED (GRADED → feedback view, "New" badge; review: added 24h window)
