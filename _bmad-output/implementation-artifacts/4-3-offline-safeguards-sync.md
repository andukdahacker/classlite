# Story 4.3: Offline Safeguards & Sync

Status: done

## Story

As a Student,
I want to be able to submit even if my internet is unstable,
So that my deadline is met without stress.

## Acceptance Criteria

1. **AC1: Offline Warning Banner** — If offline during an active submission, system displays a persistent "Do Not Close Tab" warning banner at the top of the SubmissionPage. Banner uses amber styling, shows `CloudOff` icon, and remains visible until connectivity returns.
2. **AC2: Offline Submission Queue** — The submission is queued locally and automatically retried once a network connection is detected. Queued mutations (save answers, final submit) resume without user action.
3. **AC3: Server Confirmation Only** — User receives a success celebration/notification only after the server confirms receipt. No "Submitted!" until the server responds with 200.

## Tasks / Subtasks

- [x] Task 1: Extend SaveStatus type and indicator (AC: 1)
  - [x] 1.1 In `use-auto-save.ts`, extend `SaveStatus` union: add `"offline" | "syncing"` to the existing `"idle" | "saving" | "saved" | "error"` type
  - [x] 1.2 In `SubmissionHeader.tsx`, import `CloudOff` and `CloudUpload` from `lucide-react` (not currently imported), then add two entries to `SAVE_INDICATOR_CONFIG`:
    - `offline`: `CloudOff` icon (size-3.5, `text-amber-500`) + "Offline" text — uses amber-500 (#F59E0B) per UX spec "Focus Amber"
    - `syncing`: `CloudUpload` icon (size-3.5, `text-blue-600`, `animate-pulse`) + "Syncing..." text
  - [x] 1.3 Update `SaveIndicator` component — `offline` and `syncing` states persist (no auto-hide, same as `error`)
  - [x] 1.4 Write tests for new indicator states

- [x] Task 2: Add networkMode to submission mutations (AC: 2)
  - [x] 2.1 In `use-save-answers.ts`, add `networkMode: "offlineFirst"` to the `useMutation` options (matches precedent in `auth.hooks.ts` lines 50, 65, 81)
  - [x] 2.2 In `use-submit-submission.ts`, add `networkMode: "offlineFirst"` to the `useMutation` options
  - [x] 2.3 In `use-upload-photo.ts`, add `networkMode: "offlineFirst"` to the existing `useMutation` options. The hook already uses `useMutation` with a `fetch`-based `mutationFn` for FormData uploads — no structural refactoring needed, just add the `networkMode` property

- [x] Task 3: Integrate network detection into useAutoSave (AC: 1, 2)
  - [x] 3.1 Import `onlineManager` from `@tanstack/react-query` in `use-auto-save.ts`
  - [x] 3.2 Subscribe to `onlineManager` state changes — when offline, set `saveStatus` to `"offline"` (IndexedDB saves continue normally, server saves are skipped/paused)
  - [x] 3.3 When coming back online with pending changes, set `saveStatus` to `"syncing"`, trigger an immediate server save of current answers, then transition to `"saved"` on success. Show `toast.success("Changes synced")` after successful sync (per UX spec line 557: "Sync Complete" toast on reconnection)
  - [x] 3.4 Update the `UseAutoSaveReturn` interface — add `isOnline: boolean` for consumers
  - [x] 3.5 Write tests for offline → online transitions, including: IndexedDB saves continue while offline, server save resumes on reconnect, status transitions correctly

- [x] Task 4: Create OfflineBanner component (AC: 1)
  - [x] 4.1 Create `apps/webapp/src/features/submissions/components/OfflineBanner.tsx`
  - [x] 4.2 Render a sticky banner at the top of the SubmissionPage when `isOnline === false` AND submission is active (not yet submitted)
  - [x] 4.3 Use shadcn `Alert` component with custom amber styling (follow `ConflictWarningBanner.tsx` pattern): amber-50 bg, amber-400 border, amber-500 icon, amber-800 text — uses amber-500 (#F59E0B) per UX spec "Focus Amber"
  - [x] 4.4 Banner text: "Offline Mode Active — We're saving your work locally. Keep going! Do not close this tab. Your submission will sync automatically when you reconnect." (Tone per UX spec line 100: encouraging, not alarming)
  - [x] 4.5 Banner is NOT dismissible (no close button) — disappears automatically when online
  - [x] 4.6 Write component tests: renders when offline, hides when online, does not render after submission

- [x] Task 5: Update SubmissionPage for offline-aware submit flow (AC: 2, 3)
  - [x] 5.1 Consume `isOnline` from `useAutoSave` return value
  - [x] 5.2 Pass `isOnline` and `saveStatus` to the new `OfflineBanner` component
  - [x] 5.3 Modify `handleSubmit`: wrap the entire submit flow (save → upload → submit → clear) in a try/catch that distinguishes network errors from validation errors
  - [x] 5.4 If offline when student taps "Submit": show `toast.warning("You're offline. Your answers are saved locally and will submit automatically when you reconnect.")`. Keep the SubmitConfirmDialog open or show a pending state — do NOT navigate to SubmissionCompletePage yet
  - [x] 5.5 Persist `isSubmitPending` flag to IndexedDB (via `submission-storage.ts`) so that if the browser kills the tab while offline, the submit auto-retries on reopen. Use a new storage key: `classlite:submit-pending:{centerId}:{assignmentId}`. Clear on successful server submit
  - [x] 5.6 Add `useEffect` that watches for `isOnline` becoming `true` while `isSubmitPending` is set — automatically retry the submit sequence. Also check for persisted `isSubmitPending` on mount (after `startSubmission` succeeds)
  - [x] 5.7 Only set `isSubmitted = true` and navigate to `SubmissionCompletePage` AFTER `submitSubmission.mutateAsync()` resolves successfully (server confirmed). Add `toast.success("You're back online! Submission received.")` on server confirmation after offline recovery
  - [x] 5.8 Write integration tests: offline submit queues and retries, success only after server confirm, persisted submit-pending flag survives remount

- [x] Task 6: Tests & validation (AC: 1, 2, 3)
  - [x] 6.1 Unit test: `useAutoSave` transitions to `"offline"` status when `onlineManager` reports offline
  - [x] 6.2 Unit test: IndexedDB saves continue every 3s while offline (server saves paused)
  - [x] 6.3 Unit test: On reconnect, `useAutoSave` transitions to `"syncing"` → triggers server save → transitions to `"saved"` → shows "Changes synced" toast
  - [x] 6.4 Unit test: OfflineBanner renders when offline + active submission, hidden when online
  - [x] 6.5 Unit test: SubmissionHeader shows `CloudOff` + "Offline" indicator when offline
  - [x] 6.6 Unit test: SubmissionHeader shows `CloudUpload` + "Syncing..." when syncing
  - [x] 6.7 Unit test: `persistSubmitPending` / `loadSubmitPending` / `clearSubmitPending` storage functions work correctly
  - [x] 6.8 Integration test: handleSubmit while offline → queued → reconnect → auto-retry → success → "You're back online!" toast
  - [x] 6.9 Integration test: SubmissionCompletePage only renders after server 200 confirmation
  - [x] 6.10 Integration test: persisted submit-pending flag triggers auto-retry on remount (tab-killed recovery)

## Dev Notes

### Critical Architecture Constraints

- **Multi-tenancy:** ALL queries MUST use `getTenantedClient(centerId)` from `@workspace/db`. NEVER `new PrismaClient()`. [Source: project-context.md#Critical-Implementation-Rules]
- **Feature-first code organization:** All new code goes in `apps/webapp/src/features/submissions/`. [Source: architecture.md#Structure-Patterns]
- **No `any` types.** Use `unknown` with narrowing. [Source: project-context.md#Code-Quality-Rules]
- **No `console.log`** in production code. [Source: project-context.md#Code-Quality-Rules]
- **Co-located tests:** `.test.ts` files next to source files. [Source: project-context.md#Testing-Rules]
- **Tailwind + shadcn/ui only** for styling. No inline CSS objects. [Source: architecture.md#Styling-Solution]

### This Is a Frontend-Only Story

No backend changes needed. The existing backend endpoints (`PATCH /answers`, `POST /submit`, `POST /photo`) are unchanged. This story adds **network-awareness** and **offline queuing** on the frontend by leveraging TanStack Query's built-in `networkMode` and `onlineManager`.

### Key Technical Approach: TanStack Query `networkMode: "offlineFirst"`

The architecture doc specifies TanStack Query + `persistQueryClient` for offline strategy. [Source: architecture.md#Offline-Strategy]

`networkMode: "offlineFirst"` means:
- Mutation fires immediately regardless of network status
- If online → request goes to server normally
- If offline → request is paused in TanStack Query's internal queue
- When `onlineManager` detects reconnection → paused mutations resume automatically
- No custom queue implementation needed — TanStack Query handles the queue

**Existing precedent:** `apps/webapp/src/features/auth/auth.hooks.ts` already uses `networkMode: "offlineFirst"` for auth mutations (lines 50, 65, 81).

### Network Detection via onlineManager

TanStack Query's `onlineManager` already tracks browser online/offline state. It listens to `window.addEventListener('online'/'offline')` and `navigator.onLine`.

**Existing usage in codebase:** `apps/webapp/src/core/components/layout/OfflineIndicator.tsx` uses `onlineManager.isOnline()` (line 12) with a subscription for real-time updates.

**For useAutoSave:** Subscribe to `onlineManager.subscribe()` to react to connectivity changes. When offline → skip server debounce timer (IndexedDB saves continue normally). When online → flush pending changes to server.

```typescript
import { onlineManager } from "@tanstack/react-query";

// Inside useAutoSave:
useEffect(() => {
  const unsubscribe = onlineManager.subscribe((isOnline) => {
    if (!isOnline) {
      setSaveStatus("offline");
    } else if (hasPendingChanges) {
      setSaveStatus("syncing");
      // Trigger immediate server save
    }
  });
  return unsubscribe;
}, []);
```

### Offline Banner Design

**Component:** `OfflineBanner.tsx` — renders at the top of SubmissionPage, inside the scrollable content area but above the question.

**Pattern reference:** Follow `ConflictWarningBanner.tsx` from logistics feature — same Alert + amber styling approach.

```tsx
// Simplified structure — uses amber-500 (#F59E0B) per UX spec "Focus Amber":
<Alert className="border-amber-400 bg-amber-50 text-amber-800 rounded-none">
  <CloudOff className="size-4 text-amber-500" />
  <AlertTitle>Offline Mode Active</AlertTitle>
  <AlertDescription>
    We're saving your work locally. Keep going! Do not close this tab.
    Your submission will sync automatically when you reconnect.
  </AlertDescription>
</Alert>
```

**Placement in SubmissionPage:** Render `<OfflineBanner />` above the question content, below the `<SubmissionHeader />`. It appears/disappears based on `isOnline` state from `useAutoSave`.

**Responsive:** Full-width on all viewports. Text wraps naturally. No special mobile handling needed.

### Submit Flow Changes (handleSubmit)

**Current flow (SubmissionPage.tsx lines 216-254):**
1. Save all answers → `saveAnswers.mutateAsync()`
2. Upload photos → `uploadPhoto.mutateAsync()` (loop)
3. Submit → `submitSubmission.mutateAsync()`
4. Clear IndexedDB → `clearAnswersLocal()`
5. Set `isSubmitted = true`

**New flow with offline awareness:**
```typescript
const handleSubmit = async () => {
  if (!submissionId || !centerId || !assignmentId) return;

  try {
    // Step 1: Save current answers (will queue if offline)
    const changedAnswers = Object.entries(answers)
      .filter(([qId]) => answers[qId] !== undefined)
      .map(([questionId, answer]) => ({ questionId, answer }));
    if (changedAnswers.length > 0) {
      await saveAnswers.mutateAsync({ submissionId, answers: changedAnswers });
    }

    // Step 2: Upload pending photos (will queue if offline)
    // NOTE: pendingPhotos is Map<string, File> — use Map iteration, not Object.entries
    for (const [questionId, file] of pendingPhotos.current.entries()) {
      await uploadPhoto.mutateAsync({ submissionId, questionId, file });
    }
    pendingPhotos.current.clear();

    // Step 3: Submit (will queue if offline via networkMode)
    await submitSubmission.mutateAsync({ submissionId });

    // Step 4: Server confirmed — NOW clear IndexedDB and celebrate
    await clearAnswersLocal(centerId, assignmentId);
    clearSubmitPending(centerId, assignmentId); // Clear persisted flag
    setIsSubmitted(true);
    toast.success("You're back online! Submission received.");

  } catch (error) {
    // Network error — mutation is queued by TanStack Query
    if (!onlineManager.isOnline()) {
      setIsSubmitPending(true);
      persistSubmitPending(centerId, assignmentId); // Persist to IndexedDB
      toast.warning("You're offline. Your submission will send automatically when you reconnect.");
      // Do NOT set isSubmitted = true
      // Do NOT navigate to complete page
    } else {
      // Actual server error (not network)
      toast.error("Submission failed. Please try again.");
    }
  }
};
```

**Auto-retry on reconnect:**
```typescript
// Watch for reconnection while submit is pending
useEffect(() => {
  if (!isSubmitPending || !isOnline) return;
  // Network is back and we have a pending submit — retry
  handleSubmit();
  setIsSubmitPending(false);
}, [isOnline, isSubmitPending]);

// Check for persisted submit-pending flag on mount (covers tab-killed scenario)
useEffect(() => {
  if (!centerId || !assignmentId || !submissionId) return;
  loadSubmitPending(centerId, assignmentId).then((pending) => {
    if (pending && isOnline) {
      handleSubmit(); // Auto-retry the submit
    } else if (pending) {
      setIsSubmitPending(true); // Wait for reconnect
    }
  });
}, [centerId, assignmentId, submissionId]);
```

**Submit-pending persistence (add to `submission-storage.ts`):**
```typescript
const SUBMIT_PENDING_PREFIX = "classlite:submit-pending:";

export async function persistSubmitPending(centerId: string, assignmentId: string): Promise<void> {
  await set(`${SUBMIT_PENDING_PREFIX}${centerId}:${assignmentId}`, true);
}

export async function loadSubmitPending(centerId: string, assignmentId: string): Promise<boolean> {
  const val = await get<boolean>(`${SUBMIT_PENDING_PREFIX}${centerId}:${assignmentId}`);
  return val === true;
}

export async function clearSubmitPending(centerId: string, assignmentId: string): Promise<void> {
  await del(`${SUBMIT_PENDING_PREFIX}${centerId}:${assignmentId}`);
}
```

### Error Classification

Distinguish network errors from server errors:
- **Network error:** `error instanceof TypeError && error.message.includes("fetch")` or `!onlineManager.isOnline()` at time of catch
- **Server error (4xx/5xx):** The mutation reached the server but was rejected — show error toast, do NOT queue

For `networkMode: "offlineFirst"` mutations, TanStack Query will NOT throw on network failure — it queues instead. The `mutateAsync` will only throw if the server responds with an error. So the primary check is `onlineManager.isOnline()` to decide whether to show the offline warning vs the error toast.

### Photo Upload — networkMode Addition (Task 2.3)

**Current `use-upload-photo.ts`:** Already uses `useMutation` (line 5) with a `fetch`-based `mutationFn` for FormData uploads. No structural changes needed.

**Required change:** Add `networkMode: "offlineFirst"` to the existing `useMutation` options object — single line addition. This ensures photo uploads queue when offline and auto-retry on reconnection, same as `useSaveAnswers` and `useSubmitSubmission`.

### Implementation Details: SaveStatus Transitions

State machine for `saveStatus` in `useAutoSave`:

```
ONLINE FLOW:
idle → saving → saved → idle (auto-hide)
idle → saving → error (IndexedDB or server failed while online)

OFFLINE TRANSITION:
any state → offline (onlineManager reports offline)
  - IndexedDB saves continue on 3s interval
  - Server saves paused (skip debounce trigger)

RECONNECT TRANSITION:
offline → syncing (onlineManager reports online + pending server changes)
syncing → saved (server save succeeds)
syncing → error (server save fails after reconnect — unusual)
```

**Pending changes detection:** Compare `answersRef.current` against `lastServerSavedAnswersRef.current` using `JSON.stringify`. If different → there are pending changes that need server sync on reconnect.

### Existing Code to Modify

| File | Change |
|------|--------|
| `apps/webapp/src/features/submissions/hooks/use-auto-save.ts` | Extend `SaveStatus` type, add `onlineManager` subscription, add `isOnline` to return, add syncing logic on reconnect |
| `apps/webapp/src/features/submissions/hooks/use-save-answers.ts` | Add `networkMode: "offlineFirst"` |
| `apps/webapp/src/features/submissions/hooks/use-submit-submission.ts` | Add `networkMode: "offlineFirst"` |
| `apps/webapp/src/features/submissions/hooks/use-upload-photo.ts` | Add `networkMode: "offlineFirst"` to existing `useMutation` |
| `apps/webapp/src/features/submissions/lib/submission-storage.ts` | Add `persistSubmitPending()` and `loadSubmitPending()` and `clearSubmitPending()` functions for submit-pending flag persistence |
| `apps/webapp/src/features/submissions/components/SubmissionHeader.tsx` | Add `offline` and `syncing` entries to `SAVE_INDICATOR_CONFIG`, import `CloudOff`/`CloudUpload` icons |
| `apps/webapp/src/features/submissions/components/SubmissionPage.tsx` | Consume `isOnline` from `useAutoSave`, render `OfflineBanner`, add `isSubmitPending` state, modify `handleSubmit` for offline queuing, add reconnect auto-retry effect |

### New Files to Create

| File | Purpose |
|------|---------|
| `apps/webapp/src/features/submissions/components/OfflineBanner.tsx` | Persistent "Do Not Close Tab" warning banner for offline state |
| `apps/webapp/src/features/submissions/components/OfflineBanner.test.tsx` | Tests for offline banner visibility |

### Existing Code to REUSE (Do NOT Reinvent)

| Component/Pattern | Location | Reuse How |
|-------------------|----------|-----------|
| `onlineManager` | `@tanstack/react-query` (already installed) | Subscribe for online/offline state changes |
| `useIsOnline()` pattern | `apps/webapp/src/core/components/layout/OfflineIndicator.tsx` lines 10-16 | Reference for onlineManager subscription pattern — but integrate directly into `useAutoSave` instead of importing (keep submission-specific logic encapsulated) |
| `networkMode: "offlineFirst"` pattern | `apps/webapp/src/features/auth/auth.hooks.ts` lines 50, 65, 81 | Same pattern for submission mutations |
| `Alert` component | `@workspace/ui` (`packages/ui/src/components/alert.tsx`) | For OfflineBanner |
| `ConflictWarningBanner` pattern | `apps/webapp/src/features/logistics/components/ConflictWarningBanner.tsx` | Reference for amber warning banner styling with Alert |
| `CloudOff`, `CloudUpload` icons | `lucide-react` (already installed) | For offline/syncing indicator states |
| `SAVE_INDICATOR_CONFIG` map pattern | `SubmissionHeader.tsx` lines 27-46 | Extend with new states (designed for this) |
| `submission-storage.ts` | `apps/webapp/src/features/submissions/lib/submission-storage.ts` | No changes needed — IndexedDB layer works as-is |
| `idb-keyval` | Already installed | No changes |
| `toast.warning()` | `sonner` (already installed) | For offline submit notification |

### Previous Story Intelligence (Stories 4.1 and 4.2)

**From Story 4.1:**
- Answer state is `Record<string, unknown>` keyed by `questionId`
- Save-on-navigate calls `saveAnswers` mutation when navigating between questions
- `useBeforeUnload` guard prevents accidental tab close — keep as-is, it works alongside the offline banner
- `pendingPhotos` ref stores photo files before upload — these need to survive offline
- `startSubmission` creates the server record on mount — if offline on mount, the student can't even start. This is acceptable: starting a submission requires server (to get `submissionId`). If student is offline from the start, they see the generic TanStack Query error. This story focuses on going offline MID-submission.

**From Story 4.2:**
- `SaveStatus` type was designed to be extended with `"offline" | "syncing"` (per Story 4.2 spec Task 5.7 — the type uses a union pattern and SubmissionHeader uses a `Record` map, both designed for easy extension)
- `SAVE_INDICATOR_CONFIG` is a `Record` map — adding new entries is trivial
- Auto-save saves to IndexedDB every 3s regardless of network — this continues working offline with zero changes
- Server saves are debounced (500ms) and independent of IndexedDB saves — when offline, server saves simply won't fire (which is correct behavior)
- `lastServerSaveTimestamp` ref and `lastServerSavedAnswersRef` provide dirty-state detection

**Code review fix from Story 4.2:** Fixed 3 bugs including unstable dependency, missing tests, unhandled rejection. Keep these patterns stable.

### Git Intelligence (Recent Commits)

```
25bf05e fix(webapp): Story 4.2 code review fixes — unstable dep, missing tests, unhandled rejection
1e8f904 feat(webapp): implement Story 4.2 auto-save with lint fixes
5e79467 feat(sm): Story 4.2 — Local Auto-save & Persistent Storage (ready-for-dev)
b056f99 fix(backend): update staging webapp domain
1e2657c feat: Story 4.1 — Mobile Submission Interface + code review fixes
```

Stories 4.1 and 4.2 are the immediate predecessors. All submission infrastructure is stable and tested (592+ tests). The `useAutoSave` hook and `SaveIndicator` component were explicitly designed with extension points for this story.

### Testing Requirements

**Unit tests** (Vitest, co-located):
- `use-auto-save.test.ts` (extend existing): Test offline/online transitions, IndexedDB continues while offline, server save resumes on reconnect
- `SubmissionHeader.test.tsx` (extend existing): Test offline and syncing indicator states
- `OfflineBanner.test.tsx` (new): Test visibility based on online state and submission status

**Integration tests:**
- `SubmissionPage.test.tsx` (extend existing): Test offline submit flow, reconnect auto-retry, server confirmation required for success

**Mock pattern for onlineManager:**
```typescript
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    onlineManager: {
      isOnline: vi.fn(() => true),
      subscribe: vi.fn((callback) => {
        // Store callback for test control
        return vi.fn(); // unsubscribe
      }),
    },
  };
});
```

**Run tests:** `pnpm --filter=webapp test`

### Out of Scope (Deferred)

| Feature | Deferred To |
|---------|-------------|
| `persistQueryClient` for TanStack Query cache (full offline reads) | Future — not needed for submission writes |
| Service Worker for background sync | Future — `networkMode: "offlineFirst"` handles the use case |
| Offline starting a new submission (no submissionId yet) | Future — requires offline-first architecture changes to server |
| Cross-tab offline state sync | Future — multi-tab is already a known v1 limitation |
| "Rotating Feather" branded save animation | Future UX refinement — `LoaderCircle` is MVP |
| Resubmission support | Future |

### Known Limitations (v1)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Cannot START submission while offline** | Student must be online to begin (needs `submissionId` from server). If they go offline during work, this story handles it. | Acceptable — starting is a single request. The critical path is mid-submission offline. |
| **Photo uploads queue but files stay in memory** | If the page is force-closed while offline with pending photos, photo files in `pendingPhotos` ref are lost (they're `File` objects in memory, not persisted to IndexedDB) | Photos are supplementary (handwritten work). The typed answers are safe in IndexedDB. Future: persist photo blobs to IndexedDB. |
| **Multiple queued mutations execute sequentially** | TanStack Query fires queued mutations one at a time on reconnect, which may take a few seconds | Acceptable — `syncing` indicator shows progress. Usually only 1-2 mutations queued. |
| **Browser may kill tab on mobile** | OS may kill the background tab, losing in-memory state | IndexedDB persists answers AND `isSubmitPending` flag. On reopen, `startSubmission` returns existing record, IndexedDB restores local answers (from Story 4.2), and persisted submit-pending flag triggers auto-retry of the final submit. |

### Project Structure Notes

- All new code in `apps/webapp/src/features/submissions/` — consistent with Stories 4.1 and 4.2
- Only 1 new file (`OfflineBanner.tsx` + test) — rest is extending existing files
- No changes to `packages/types`, `packages/db`, or `apps/backend` — purely frontend
- Tests co-located next to source files

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-4-Story-4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Offline-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#OfflineIndicator]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StudentSubmissionFlow]
- [Source: project-context.md#Critical-Implementation-Rules]
- [Source: project-context.md#Development-Workflow]
- [Source: _bmad-output/implementation-artifacts/4-2-local-auto-save-persistent-storage.md — SaveStatus extensibility, useAutoSave design]
- [Source: _bmad-output/implementation-artifacts/4-1-mobile-submission-interface.md — submission infrastructure, answer state, API design]
- [Source: apps/webapp/src/features/auth/auth.hooks.ts — networkMode: "offlineFirst" precedent]
- [Source: apps/webapp/src/core/components/layout/OfflineIndicator.tsx — onlineManager usage pattern]
- [Source: apps/webapp/src/features/logistics/components/ConflictWarningBanner.tsx — amber warning banner pattern]
- [Source: apps/webapp/src/features/submissions/hooks/use-auto-save.ts — extension point for SaveStatus]
- [Source: apps/webapp/src/features/submissions/components/SubmissionHeader.tsx — SAVE_INDICATOR_CONFIG extension point]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed edge case: onlineManager reconnect handler compared `JSON.stringify({})` vs `""` (initial), causing false "pending changes" detection. Fixed by checking actual entry-level diffs instead of snapshot comparison.
- Submit dialog button matching: tests needed to navigate to last question before Submit button appeared (QuestionStepper only shows Submit on isLast).

### Completion Notes List

- **Task 1:** Extended `SaveStatus` type with `"offline" | "syncing"`. Added `CloudOff` + `CloudUpload` icon config entries to `SAVE_INDICATOR_CONFIG`. Both states persist (no auto-hide). 4 new tests.
- **Task 2:** Added `networkMode: "offlineFirst"` to `useSaveAnswers`, `useSubmitSubmission`, `useUploadPhoto` — single-line additions matching `auth.hooks.ts` precedent.
- **Task 3:** Integrated `onlineManager.subscribe()` in `useAutoSave`. When offline: status → `"offline"`, server saves paused, IndexedDB continues. On reconnect: detects pending changes, sends server sync, shows "Changes synced" toast. Exposed `isOnline` in return. 5 new tests.
- **Task 4:** Created `OfflineBanner.tsx` — non-dismissible amber `Alert` per UX spec. Shows when `!isOnline && !isSubmitted`, auto-hides when online. 4 new tests.
- **Task 5:** Updated `SubmissionPage` with offline-aware submit flow. Added `isSubmitPending` state + IndexedDB persistence. handleSubmit distinguishes offline vs server errors. Auto-retries on reconnect + tab-killed recovery via `loadSubmitPending` on mount. Success toast + SubmissionCompletePage only after server 200 confirmation. 7 new tests.
- **Task 6:** All 10 test scenarios verified across 4 test files. Coverage includes unit tests for storage functions, indicator states, banner visibility, and integration tests for offline submit flows.

### File List

**Modified files:**
- `apps/webapp/src/features/submissions/hooks/use-auto-save.ts` — Extended SaveStatus type, added onlineManager subscription, isOnline return
- `apps/webapp/src/features/submissions/hooks/use-auto-save.test.ts` — Added 5 offline/online transition tests
- `apps/webapp/src/features/submissions/hooks/use-save-answers.ts` — Added networkMode: "offlineFirst"
- `apps/webapp/src/features/submissions/hooks/use-submit-submission.ts` — Added networkMode: "offlineFirst"
- `apps/webapp/src/features/submissions/hooks/use-upload-photo.ts` — Added networkMode: "offlineFirst"
- `apps/webapp/src/features/submissions/lib/submission-storage.ts` — Added persistSubmitPending, loadSubmitPending, clearSubmitPending
- `apps/webapp/src/features/submissions/lib/submission-storage.test.ts` — Added 5 submit-pending storage tests
- `apps/webapp/src/features/submissions/components/SubmissionHeader.tsx` — Added CloudOff/CloudUpload imports, offline/syncing config entries
- `apps/webapp/src/features/submissions/components/SubmissionHeader.test.tsx` — Added 4 offline/syncing indicator tests
- `apps/webapp/src/features/submissions/components/SubmissionPage.tsx` — Added OfflineBanner, isSubmitPending state, offline-aware handleSubmit, auto-retry effects
- `apps/webapp/src/features/submissions/components/SubmissionPage.test.tsx` — Added 7 offline submit flow tests

**New files:**
- `apps/webapp/src/features/submissions/components/OfflineBanner.tsx` — Offline warning banner component
- `apps/webapp/src/features/submissions/components/OfflineBanner.test.tsx` — Banner visibility tests

**Sprint status:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 4-3-offline-safeguards-sync: ready-for-dev → in-progress → review → done

### Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) — Claude Opus 4.6
**Date:** 2026-02-14
**Result:** APPROVED after 8 fixes applied

**Issues Found & Fixed:**

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | HIGH | Race condition: `loadSubmitPending` and `loadAnswersLocal` concurrent — submit could fire before offline answers restored | Added `localAnswersRestored` state gate; mount submit-pending check waits for IndexedDB answer restore to complete |
| H2 | HIGH | Reconnect auto-retry cleared `isSubmitPending` synchronously before async `handleSubmit` completed | Added `submitRetryRef` guard to prevent re-entry; let `handleSubmit` manage state internally; clear `isSubmitPending` on server error |
| M1 | MEDIUM | Toast always showed "Submission received." — didn't distinguish offline recovery from normal submit | Added `isRecoverySubmitRef`; recovery paths show "You're back online! Submission received." |
| M2 | MEDIUM | Missing test: `useAutoSave` reconnect sync error path (syncing → error) | Added test verifying status transition + error toast |
| M3 | MEDIUM | Missing test: `handleSubmit` online server error path | Added test verifying error toast on server 4xx/5xx |
| L1 | LOW | No dark mode support for OfflineBanner amber colors | Added `dark:` Tailwind variants matching dark palette |
| L2 | LOW | `persistSubmitPending` failed silently — no user feedback | Changed to `toast.warning("Unable to save offline state — avoid closing this tab.")` |
| L3 | LOW | No toast for reconnect sync failure — user only saw small indicator | Added `toast.error("Failed to sync changes...")` in `onError` callback |

**Tests:** 620 passed (3 new tests added), 0 failed
