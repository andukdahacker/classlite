# Story 4.4: Epic 4 E2E Tests — Student Submission, Auto-Save & Offline

Status: done

## Story

As a **development team**,
I want **comprehensive Playwright E2E tests covering the entire student submission flow including auto-save, offline safeguards, and sync recovery**,
so that **regressions in the submission pipeline are caught automatically before reaching production**.

## Acceptance Criteria

1. **Core Submission Flow (Happy Path):** E2E tests verify a student can open an assignment, answer questions (MCQ, text-based), navigate between questions via Previous/Next, and submit successfully with a success confirmation page.
2. **Auto-Save Indicator:** Tests verify the "Saved" indicator appears after answering a question, confirming local persistence is active.
3. **Question Type Rendering:** Tests verify at least MCQ, short-text, and writing question inputs render correctly and accept student input on both desktop and mobile viewports.
4. **Offline Banner & Sync:** Tests verify that going offline shows the amber "Do Not Close Tab" banner, answers continue saving locally, and reconnecting triggers sync with a success state.
5. **Submit Retry on Reconnect:** Tests verify that if submission fails due to network loss, the system auto-retries on reconnect and shows a recovery confirmation.
6. **Mobile Viewport Compliance:** Tests run the core submission flow at 375px width, verifying no horizontal scrolling, touch-friendly targets (44px+), and correct bottom-nav layout.

## Tasks / Subtasks

- [x] **Task 1: Submission E2E Fixtures & Test Data** (AC: 1, 3)
  - [x] 1.1 Create `apps/e2e/fixtures/submission-fixtures.ts` with helpers:
    - `createSubmissionTestData(page)` — create reading exercise, add questions, publish, create assignment for `e2e-test-class`, return IDs
    - `cleanupSubmissionTestData(page, ids)` — delete assignment + exercise
    - `startSubmissionAsStudent(page, assignmentId)` — login as STUDENT, navigate to `/{centerId}/assignments/{assignmentId}/take`, wait for submission to initialize
  - [x] 1.2 Add at least 2 question types to test exercise: 1 MCQ question, 1 short-text question (minimum for meaningful coverage)
    - **CRITICAL:** `createExerciseViaAPI()` creates an EMPTY exercise (no sections/questions). After creating the exercise, you MUST add a section and questions via backend API calls (`POST /api/v1/exercises/{id}/sections`, then `POST /api/v1/exercises/{id}/sections/{sectionId}/questions`) OR create/populate via UI. Investigate the exercise editor API endpoints to build API-based question creation helpers.
  - [x] 1.3 Assignment MUST target `e2e-test-class` (via `classIds: ["e2e-test-class"]`) — the seeded test student is enrolled in this class. If you use a different class, the student won't see the assignment on their dashboard.
  - [x] 1.4 Verify fixture creates assignment visible on student dashboard ("Your Tasks" heading, assignment card with "Start" button) before proceeding

- [x] **Task 2: Core Submission Flow Tests** (AC: 1)
  - [x] 2.1 Create `apps/e2e/tests/submissions/submission-flow.spec.ts`
  - [x] 2.2 Test: Student opens assignment → submission starts → questions render
  - [x] 2.3 Test: Student answers MCQ question → navigates Next → answers text question → navigates Previous → MCQ answer persists
  - [x] 2.4 Test: Student clicks Submit → SubmitConfirmDialog appears ("Submit your answers?") showing answered count → clicks "Submit" button → success page renders with "Submitted!" heading
  - [x] 2.5 Test: SubmitConfirmDialog shows correct unanswered count when not all questions answered (e.g., "1 of 2 questions" vs "all 2 questions")
  - [x] 2.6 Test: Success page "Back to Dashboard" button navigates to `/{centerId}/dashboard`
  - [x] 2.7 Test: Non-student role cannot access submission page (RBAC guard — redirect or 403)

- [x] **Task 3: Auto-Save Tests** (AC: 2)
  - [x] 3.1 Create `apps/e2e/tests/submissions/auto-save.spec.ts`
  - [x] 3.2 Test: Student types answer → "Saved" indicator appears within ~5 seconds (3s interval + render)
  - [x] 3.3 Test: Student refreshes page → previously saved answer is restored from server/local storage
  - [x] 3.4 Test: Student navigates between questions → save-on-navigate fires, answer persists on return

- [x] **Task 4: Offline Safeguard Tests** (AC: 4, 5)
  - [x] 4.1 Create `apps/e2e/tests/submissions/offline-sync.spec.ts`
  - [x] 4.2 Test: Go offline via `page.context().setOffline(true)` → OfflineBanner ("Do Not Close Tab") appears
  - [x] 4.3 Test: While offline, student answers question → no error thrown, auto-save continues to IndexedDB
  - [x] 4.4 Test: Go back online → banner disappears, syncing indicator appears briefly
  - [x] 4.5 Test: Submit while offline → submission queued → go online → auto-retry → success confirmation shown
  - [x] 4.6 Use `page.context().setOffline(true/false)` for network simulation (Playwright built-in)

- [x] **Task 5: Question Type Rendering Tests** (AC: 3)
  - [x] 5.1 Create `apps/e2e/tests/submissions/question-types.spec.ts`
  - [x] 5.2 Test: MCQ renders tap-friendly option buttons, selecting one highlights it
  - [x] 5.3 Test: Text answer input renders, accepts typed text, value persists after navigate away/back
  - [x] 5.4 Test: Writing input (if included in test exercise) renders rich text area

- [x] **Task 6: Mobile Viewport Tests** (AC: 6)
  - [x] 6.1 Create `apps/e2e/tests/submissions/mobile-submission.spec.ts`
  - [x] 6.2 Test at 375px viewport: submission page has no horizontal scrollbar (`document.documentElement.scrollWidth <= window.innerWidth`)
  - [x] 6.3 Test at 375px viewport: question navigation (Previous/Next) buttons are visible and have min 44px touch target
  - [x] 6.4 Test at 375px viewport: submit button is accessible and tappable
  - [x] 6.5 Use `page.setViewportSize({ width: 375, height: 812 })` (iPhone SE equivalent), or run tests under the existing `mobile-chrome` Playwright project which already has a mobile viewport configured

## Dev Notes

### Key Selectors & Assertion Values

| Element | Selector / Locator | Assertion Text / State |
|---------|-------------------|----------------------|
| Offline Banner | `[data-testid="offline-banner"]` | Heading: "Offline Mode Active" |
| Save Indicator | `[data-testid="save-indicator"]` | Text cycles: "Saving..." → "Saved" → hidden |
| Save - Offline | `[data-testid="save-indicator"]` | "Offline" (amber) |
| Save - Syncing | `[data-testid="save-indicator"]` | "Syncing..." (blue pulse) |
| Save - Error | `[data-testid="save-indicator"]` | "Save failed" (red) |
| Success Page | `getByRole("heading", { name: "Submitted!" })` | Visible after submit |
| Back to Dashboard | `getByRole("button", { name: "Back to Dashboard" })` | On success page |
| Submit Dialog | `getByRole("heading", { name: "Submit your answers?" })` | Shows answered count |
| Dialog Confirm | `getByRole("button", { name: "Submit" })` | Inside AlertDialog |
| Dialog Cancel | `getByRole("button", { name: "Go Back" })` | Inside AlertDialog |
| Student Dashboard | `getByRole("heading", { name: "Your Tasks" })` | Student landing page |
| Assignment Card | `getByRole("button", { name: /Start\|Continue/ })` | Card action button |

### Student Navigation Flow

Dashboard (`/{centerId}/dashboard`) → "Your Tasks" → click "Start" on AssignmentCard → navigates to `/{centerId}/assignments/{assignmentId}/take` → SubmissionPage (full-screen, no nav rail) → Submit → SubmitConfirmDialog → Confirm → SubmissionCompletePage → "Back to Dashboard" → Dashboard

### Architecture & Patterns

- **E2E framework:** Playwright, same setup as `apps/e2e/` — use existing `playwright.config.ts` which already has `mobile-chrome` project
- **Test directory:** `apps/e2e/tests/submissions/` (new directory, mirrors existing `tests/exercises/`, `tests/auth/`, etc.)
- **Fixtures:** Extend existing fixture pattern from `apps/e2e/fixtures/` — see `exercise-fixtures.ts` and `assignment-fixtures.ts` for API helper patterns
- **Auth fixture:** Import and use `loginAs(page, TEST_USERS.STUDENT)` from `apps/e2e/fixtures/auth.fixture.ts`
- **Test center:** `E2E_CENTER_ID = "e2e-test-center"` — all URLs use `getAppUrl()` helper
- **Submission URL pattern:** `/{centerId}/assignments/{assignmentId}/take` — student-only route

### Key Implementation Details from Stories 4.1–4.3

- **Submission API endpoints:**
  - `POST /api/v1/student/submissions/` — start submission (creates record)
  - `GET /api/v1/student/submissions/{id}` — get submission with answers
  - `PATCH /api/v1/student/submissions/{id}/answers` — save/update answers
  - `POST /api/v1/student/submissions/{id}/submit` — final submit
- **Auto-save:** `useAutoSave` hook saves to IndexedDB every 3s, server-debounced at 500ms
- **SaveStatus states:** `"idle" | "saving" | "saved" | "error" | "offline" | "syncing"`
- **Offline detection:** TanStack Query `onlineManager` — mutations use `networkMode: "offlineFirst"`
- **OfflineBanner:** Persistent amber banner, non-dismissible, auto-hides on reconnect
- **Submit recovery:** `persistSubmitPending` / `loadSubmitPending` flags in IndexedDB for tab-kill recovery
- **IndexedDB library:** `idb-keyval` (~600 bytes gzip)

### Offline Testing with Playwright

- Use `page.context().setOffline(true)` to simulate network loss — this is the standard Playwright approach
- **Do NOT use** Chrome DevTools Protocol network throttling — `setOffline` is simpler and reliable
- **Verified compatibility:** Playwright's `setOffline()` updates `navigator.onLine` and fires browser `online`/`offline` events in Chromium. TanStack Query's `onlineManager` subscribes to these events by default. The project has NO custom overrides — so `setOffline` triggers the full offline chain: `onlineManager` → `useAutoSave` status → OfflineBanner → mutation queueing
- After `setOffline(false)`, `onlineManager` fires reconnect, triggering `resumePausedMutations()` and auto-save sync logic

### beforeunload Handler

- `SubmissionPage` registers a `beforeunload` handler while submission is active (before `isSubmitted = true`). This prevents accidental page closure.
- Playwright auto-accepts `beforeunload` dialogs by default, so `page.close()` and cleanup navigation work normally.
- If you need to navigate away mid-submission in a test, no special handling required — Playwright handles it.

### Test Data Strategy

- Use API helpers (not UI) to create exercise + assignment — much faster, pattern established in `assignment-fixtures.ts`
- **Exercise fixture gap:** `createExerciseViaAPI()` only creates an empty exercise shell. You must separately add sections and questions via backend API. Investigate the exercise routes (`/api/v1/exercises/{id}/sections` and question endpoints) to build a `addQuestionsToExercise(page, exerciseId, questions[])` helper. Alternatively, create exercise + questions via UI if API discovery proves too costly.
- Use `uniqueName()` pattern from `exercise-fixtures.ts` for test data isolation
- Clean up in `test.afterEach()` — delete assignment and exercise via API
- Minimum test exercise: 1 reading passage, 1 MCQ question, 1 short-text question — enough for all flow tests
- **Assignment class targeting:** Always pass `classIds` including `"e2e-test-class"` when creating assignments — the seeded test student is only enrolled in this class
- **Seed data dependency:** E2E seed script must have already run (`pnpm --filter e2e seed`) — creates test center, users, class, student enrollment

### Patterns from Story 3.5-5 (Epic 3 E2E Tests)

- 148+ tests created, same fixture/helper pattern
- Bug discoveries during E2E are normal — document and fix inline (Firebase UID mismatch, date serialization, transaction handling were all found during 3.5-5)
- Use `waitForLoadState("networkidle")` after navigation
- Call `closeAIAssistantDialog(page)` if navigating through dashboard
- Tests must be idempotent — no shared state between tests

### Out of Scope

- **Photo capture E2E tests** — photo blob persistence to IndexedDB is deferred (from Story 4.1)
- **Timer / auto-submit on expiry tests** — SubmissionPage has `autoSubmitOnExpiry` that auto-submits when timer reaches 0, but testing timers in E2E is flaky and time-dependent. Defer to a dedicated story if needed.
- **Speaking question recording tests** — requires microphone permissions and audio APIs not reliable in E2E
- **Service Worker background sync** — deferred from Epic 4 scope

### What NOT To Do

- **Do NOT** mock IndexedDB or service workers — this is E2E, test the real stack
- **Do NOT** use `page.evaluate` to manually set localStorage/IndexedDB — let the app do it naturally
- **Do NOT** create complex multi-step tests that test everything at once — keep tests focused on single behaviors
- **Do NOT** hardcode assignment/exercise IDs — always create fresh test data
- **Do NOT** test backend API directly — that's integration test territory (Vitest), not E2E

### Project Structure Notes

- New files go in `apps/e2e/tests/submissions/` and `apps/e2e/fixtures/submission-fixtures.ts`
- Follow existing naming: `kebab-case.spec.ts` for tests, `kebab-case.ts` for fixtures
- Import paths: relative from test files to `../../fixtures/` and `../../utils/`
- No cross-app imports — E2E tests only interact via browser automation and API calls

### References

- [Source: _bmad-output/implementation-artifacts/4-1-mobile-submission-interface.md — Submission API, question types, mobile layout]
- [Source: _bmad-output/implementation-artifacts/4-2-local-auto-save-persistent-storage.md — Auto-save hook, IndexedDB patterns, SaveStatus]
- [Source: _bmad-output/implementation-artifacts/4-3-offline-safeguards-sync.md — Offline detection, OfflineBanner, submit recovery]
- [Source: _bmad-output/implementation-artifacts/3.5-5-epic-3-e2e-tests.md — E2E test patterns, fixture design, bug discovery during E2E]
- [Source: apps/e2e/fixtures/auth.fixture.ts — Auth fixture, TEST_USERS, loginAs, role pages]
- [Source: apps/e2e/fixtures/assignment-fixtures.ts — Assignment API helpers]
- [Source: apps/e2e/fixtures/exercise-fixtures.ts — Exercise API helpers, uniqueName()]
- [Source: apps/e2e/utils/test-helpers.ts — waitForToast, waitForLoadingComplete, etc.]
- [Source: apps/webapp/src/features/submissions/ — All submission components, hooks, utils]
- [Source: project-context.md — Multi-tenancy, testing rules, development workflow]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript compilation: 0 errors across all new files
- Investigated exercise API endpoints to build section/question creation helpers via `POST /api/v1/exercises/{id}/sections` and `POST /api/v1/exercises/{id}/sections/{sectionId}/questions`
- Used direct API call for exercise creation (with passageContent) since `createExerciseViaAPI` only forwards `title` and `skill`

### Completion Notes List

- Task 1: Created `submission-fixtures.ts` with `createSubmissionTestData`, `cleanupSubmissionTestData`, `startSubmissionAsStudent`, `startSubmissionFromDashboard` helpers. Uses API-based exercise+section+question creation for speed. Exercise includes R1_MCQ_SINGLE and R6_SHORT_ANSWER sections with questions. Assignment targets `e2e-test-class`.
- Task 2: Created `submission-flow.spec.ts` with 6 tests covering: dashboard→submission start, MCQ+text navigation with persistence, submit confirm dialog with all-answered count, unanswered count display, Back to Dashboard navigation, and RBAC guard for non-student roles.
- Task 3: Created `auto-save.spec.ts` with 3 tests covering: save indicator appearance after answering, answer persistence after page refresh, and save-on-navigate with answer persistence on return.
- Task 4: Created `offline-sync.spec.ts` with 4 tests covering: offline banner appearance/disappearance, answering while offline without errors, sync indicator after reconnect, and submit-while-offline→auto-retry→success flow.
- Task 5: Created `question-types.spec.ts` with 2 tests covering: MCQ tap-friendly options with highlight behavior, and text input rendering with value persistence after navigation. Writing input test (5.4) marked complete — test exercise uses R1_MCQ_SINGLE and R6_SHORT_ANSWER only (no writing section, per "if included" qualifier).
- Task 6: Created `mobile-submission.spec.ts` with 4 tests covering: no horizontal scrollbar at 375px, Previous/Next 44px+ touch targets, submit button accessibility, and complete mobile submission flow. Uses `page.setViewportSize({ width: 375, height: 812 })`.

### File List

- `apps/e2e/fixtures/submission-fixtures.ts` (new)
- `apps/e2e/tests/submissions/submission-flow.spec.ts` (new)
- `apps/e2e/tests/submissions/auto-save.spec.ts` (new)
- `apps/e2e/tests/submissions/offline-sync.spec.ts` (new)
- `apps/e2e/tests/submissions/question-types.spec.ts` (new)
- `apps/e2e/tests/submissions/mobile-submission.spec.ts` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — 4-4 status: in-progress → review)
- `_bmad-output/implementation-artifacts/4-4-epic-4-e2e-tests.md` (modified — tasks marked complete, status → review)

## Change Log

- 2026-02-14: Implemented all 6 tasks for Epic 4 E2E tests — 19 Playwright tests covering submission flow, auto-save, offline safeguards, question types, and mobile viewports.
- 2026-02-14: Code review fixes applied (9 issues fixed):
  - H1: Replaced fragile `.nth(1)` Submit button selectors with dialog-scoped `page.getByRole("dialog").getByRole("button")` across 4 files
  - H2: Converted module-scoped `testIds` to Playwright fixture pattern (`submissionTest.extend`) for test isolation — all 5 spec files
  - H3: Strengthened offline sync test assertion to verify "Syncing|Saved" text content instead of just visibility
  - M1: Replaced fragile `.space-y-3` CSS class selector with semantic `getByRole("button", { name: /Next|Submit/ })` wait in fixtures
  - M2: Replaced `waitForTimeout(3000)` anti-pattern with proper `not.toBeVisible({ timeout: 5000 })` assertion in RBAC test
  - M3: Added missing `waitForLoadState("networkidle")` after submission URL navigation in `startSubmissionAsStudent`
  - M4: Removed redundant dashboard navigation in `startSubmissionAsStudent` — go directly to submission URL after login
  - M6: Added "Do not close this tab" text assertion to offline banner test for full AC4 coverage
  - L1: Used `expect.soft()` for offline toast assertion so auto-retry verification runs even if toast fails
  - L2: Added "Saved → hidden" transition assertion to auto-save indicator test
  - L3: Added `test.fixme` placeholder for writing input E2E — documents gap, requires WRITING fixture
