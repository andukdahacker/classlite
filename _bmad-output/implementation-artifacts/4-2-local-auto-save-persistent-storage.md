# Story 4.2: Local Auto-save & Persistent Storage

Status: review

## Story

As a Student,
I want to have my work saved automatically while I type,
So that I don't lose progress if my browser closes.

## Acceptance Criteria

1. **AC1: Auto-save Interval** — System triggers a background save to persistent client-side storage (IndexedDB) every 3 seconds while the student has an active submission.
2. **AC2: Saved Indicator** — A "Saved" indicator appears in the submission header UI to confirm local persistence. States: Saving (spinner), Saved (green checkmark, fades after 2s), Error (red, persists).

## Tasks / Subtasks

- [x] Task 1: Install `idb-keyval` dependency (AC: foundation)
  - [x] 1.1 Run `pnpm --filter=webapp add idb-keyval`
- [x] Task 2: Create IndexedDB storage utility (AC: 1)
  - [x] 2.1 Create `apps/webapp/src/features/submissions/lib/submission-storage.ts`
  - [x] 2.2 Implement `saveAnswersLocal(centerId, assignmentId, submissionId, answers)` — serialize and write to IndexedDB; wrap in try/catch for IndexedDB unavailability
  - [x] 2.3 Implement `loadAnswersLocal(centerId, assignmentId)` — read and deserialize from IndexedDB; return `undefined` on failure
  - [x] 2.4 Implement `clearAnswersLocal(centerId, assignmentId)` — remove entry after successful submit
  - [x] 2.5 Implement `getStorageKey(centerId, assignmentId)` — deterministic key: `classlite:answers:{centerId}:{assignmentId}`
  - [x] 2.6 Implement `isStorageAvailable()` — probe IndexedDB availability (returns boolean); called once on mount to detect private browsing / quota issues
  - [x] 2.7 Write unit tests for storage utility (including IndexedDB unavailability fallback)
- [x] Task 3: Create `useAutoSave` hook (AC: 1, 2)
  - [x] 3.1 Create `apps/webapp/src/features/submissions/hooks/use-auto-save.ts`
  - [x] 3.2 3-second `setInterval` that saves `answers` to IndexedDB via `submission-storage.ts`
  - [x] 3.3 Dual save: save to IndexedDB always; also save dirty answers to server (500ms debounce after last change, only changed questionIds)
  - [x] 3.4 Track save state: `idle | saving | saved | error`
  - [x] 3.5 Track `lastSavedAt` (local) and `lastServerSavedAt` timestamps separately
  - [x] 3.6 Expose `lastServerSaveTimestamp` ref so save-on-navigate can skip if server save fired < 1s ago (prevents doubled requests)
  - [x] 3.7 On `isStorageAvailable() === false`: skip IndexedDB writes, set `saveStatus` to `error` on first attempt, show `toast.error("Auto-save unavailable — your work is only saved to the server")` once
  - [x] 3.8 Return `{ saveStatus, lastSavedAt, clearLocal, storageAvailable }` for UI consumption
  - [x] 3.9 Write unit tests (including storage unavailable path, debounce timing, race condition with save-on-navigate)
- [x] Task 4: Integrate auto-save into SubmissionPage (AC: 1)
  - [x] 4.1 Import and call `useAutoSave` in `SubmissionPage.tsx`
  - [x] 4.2 On mount after `startSubmission` succeeds: extract existing server answers from the response and seed into `answers` state (currently only `id` and `startedAt` are extracted — need to also parse `answers[]` array)
  - [x] 4.3 After server seed: attempt to restore from IndexedDB via `loadAnswersLocal(centerId, assignmentId)`. Merge strategy: for each questionId, use whichever has a newer `savedAt` timestamp; if no timestamp comparison possible, local wins (it's fresher than server for in-progress work)
  - [x] 4.4 Pass `saveStatus` prop to `SubmissionHeader`
  - [x] 4.5 On successful final submit: call `clearAnswersLocal()` to clean up IndexedDB
  - [x] 4.6 Keep save-on-navigate effect but add guard: skip server save if `lastServerSaveTimestamp` < 1s ago (uses ref from `useAutoSave`)
- [x] Task 5: Add "Saved" indicator to SubmissionHeader (AC: 2)
  - [x] 5.1 Add `saveStatus` prop to `SubmissionHeader`
  - [x] 5.2 Render indicator as a new `<div>` between the title/progress `<div className="flex-1">` and the timer `<div>`. Use `shrink-0` to prevent collapse. On viewports < 400px, hide text label and show icon only (`hidden sm:inline` on text span)
  - [x] 5.3 Saving state: `LoaderCircle` icon (size-3.5, `animate-spin`) + "Saving..." text (text-xs text-muted-foreground). Note: UX spec calls for "Rotating Feather" animation — `LoaderCircle` is accepted for MVP; feather animation is a future UX refinement
  - [x] 5.4 Saved state: `Check` icon (size-3.5, `text-green-600`) + "Saved" text (text-xs text-green-600) — auto-hide after 2 seconds via `setTimeout`
  - [x] 5.5 Error state: `CircleAlert` icon (size-3.5, `text-destructive`) + "Save failed" text (text-xs text-destructive) — persists until next successful save
  - [x] 5.6 Idle state: hidden (render nothing)
  - [x] 5.7 Design the `SaveStatus` type as extensible: `type SaveStatus = "idle" | "saving" | "saved" | "error"`. Story 4.3 will add `"offline" | "syncing"` states to the same indicator component — keep the rendering logic in a switch/map pattern that's easy to extend
  - [x] 5.8 Write component tests for all indicator states including auto-hide timing
- [x] Task 6: Tests & validation (AC: 1, 2)
  - [x] 6.1 Unit test: auto-save fires every 3 seconds (mock timers)
  - [x] 6.2 Unit test: answers persist in IndexedDB after save
  - [x] 6.3 Unit test: answers restore from IndexedDB on mount and merge correctly with server answers
  - [x] 6.4 Unit test: IndexedDB cleared after final submission
  - [x] 6.5 Unit test: "Saved" indicator shows correct state transitions (including auto-hide timing)
  - [x] 6.6 Unit test: IndexedDB unavailable — graceful fallback, toast shown once, server saves still work
  - [x] 6.7 Unit test: save-on-navigate skips server save when `lastServerSaveTimestamp` < 1s ago
  - [x] 6.8 Integration test: SubmissionPage renders with auto-save active

## Dev Notes

### Critical Architecture Constraints

- **Multi-tenancy:** ALL queries MUST use `getTenantedClient(centerId)` from `@workspace/db`. NEVER `new PrismaClient()`. [Source: project-context.md#Critical-Implementation-Rules]
- **Feature-first code organization:** Frontend: `features/{feature}/`. All new code goes in `apps/webapp/src/features/submissions/`. [Source: architecture.md#Structure-Patterns]
- **No `any` types.** Use `unknown` with narrowing. [Source: project-context.md#Code-Quality-Rules]
- **No `console.log`** in production code. [Source: project-context.md#Code-Quality-Rules]
- **Co-located tests:** `.test.ts` files next to source files. [Source: project-context.md#Testing-Rules]
- **Tailwind + shadcn/ui only** for styling. No inline CSS objects. [Source: architecture.md#Styling-Solution]

### This Is a Frontend-Only Story

No backend changes needed. The existing `PATCH /api/v1/student/submissions/{id}/answers` endpoint (from Story 4.1) handles server-side saves. This story adds a **client-side persistence layer** on top.

### IndexedDB Storage Design

**Library:** `idb-keyval` — Tiny (~600 bytes gzip) key-value wrapper around IndexedDB. Architecture doc specifies this. [Source: architecture.md#Offline-Strategy]

**Storage key format:** `classlite:answers:{centerId}:{assignmentId}`
- Includes `centerId` to prevent key collisions in multi-tenant scenarios (a student could theoretically belong to multiple centers)
- Keyed by `assignmentId` (not `submissionId`) because the student may not have a `submissionId` yet if the server is unreachable (relevant for Story 4.3 offline queue)
- Single key per center+assignment — stores the full `Record<string, unknown>` answers object

**Stored data shape:**
```typescript
interface StoredAnswers {
  centerId: string;
  assignmentId: string;
  submissionId: string | null;
  answers: Record<string, unknown>;
  savedAt: number; // Date.now() timestamp
}
```

**Why `idb-keyval` over raw IndexedDB:**
- Architecture doc specifies it [Source: architecture.md#Offline-Strategy]
- 600 bytes gzip vs writing boilerplate IndexedDB open/transaction/objectStore code
- Promise-based API: `set(key, val)`, `get(key)`, `del(key)`
- Used in TanStack Query's own persistence examples

### Implementation Details: `submission-storage.ts`

```typescript
// apps/webapp/src/features/submissions/lib/submission-storage.ts
import { get, set, del } from "idb-keyval";

const PREFIX = "classlite:answers:";

export function getStorageKey(centerId: string, assignmentId: string): string {
  return `${PREFIX}${centerId}:${assignmentId}`;
}

export interface StoredAnswers {
  centerId: string;
  assignmentId: string;
  submissionId: string | null;
  answers: Record<string, unknown>;
  savedAt: number;
}

/**
 * Probe IndexedDB availability. Returns false in private browsing,
 * when quota is exceeded, or when IndexedDB is blocked by browser policy.
 * Call once on mount — cache the result for the session.
 */
export async function isStorageAvailable(): Promise<boolean> {
  try {
    const testKey = "__classlite_probe__";
    await set(testKey, 1);
    await del(testKey);
    return true;
  } catch {
    return false;
  }
}

export async function saveAnswersLocal(
  centerId: string,
  assignmentId: string,
  submissionId: string | null,
  answers: Record<string, unknown>,
): Promise<void> {
  const key = getStorageKey(centerId, assignmentId);
  const data: StoredAnswers = { centerId, assignmentId, submissionId, answers, savedAt: Date.now() };
  await set(key, data);
}

export async function loadAnswersLocal(
  centerId: string,
  assignmentId: string,
): Promise<StoredAnswers | undefined> {
  const key = getStorageKey(centerId, assignmentId);
  return get<StoredAnswers>(key);
}

export async function clearAnswersLocal(
  centerId: string,
  assignmentId: string,
): Promise<void> {
  const key = getStorageKey(centerId, assignmentId);
  await del(key);
}
```

### IndexedDB Unavailability Handling

When `isStorageAvailable()` returns `false` (private browsing, quota exceeded, browser restrictions):
1. `useAutoSave` skips all IndexedDB writes for the session
2. Server saves still function normally (the `useSaveAnswers` mutation is independent)
3. Show a one-time `toast.error("Auto-save unavailable — your work is only saved when connected")` on first failed attempt
4. The "Saved" indicator does NOT show `error` state permanently — it simply doesn't show local save status (server saves are transparent via save-on-navigate)
5. `useBeforeUnload` guard remains active regardless — student is still warned before closing tab

### Implementation Details: `useAutoSave` Hook

```typescript
// apps/webapp/src/features/submissions/hooks/use-auto-save.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { saveAnswersLocal, clearAnswersLocal, isStorageAvailable } from "../lib/submission-storage";
import { useSaveAnswers } from "./use-save-answers";

// Extensible type — Story 4.3 will add "offline" | "syncing"
export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  centerId: string | undefined;
  assignmentId: string | undefined;
  submissionId: string | null;
  answers: Record<string, unknown>;
  enabled: boolean; // false when submitted or loading
  intervalMs?: number; // default 3000
  serverDebounceMs?: number; // default 500
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  lastServerSaveTimestamp: React.MutableRefObject<number>; // exposed for save-on-navigate coordination
  clearLocal: () => Promise<void>;
  storageAvailable: boolean;
}
```

**Key behavior:**
1. On mount: call `isStorageAvailable()` once, cache result in ref. If `false`, skip all IndexedDB writes for the session and show one-time toast warning
2. Every `intervalMs` (default 3000ms), compare `answers` to `lastSavedAnswersRef` using `JSON.stringify`
3. If different → set status to `saving` → save to IndexedDB (if available) → debounce server save (500ms after last change, only changed questionIds) → set status to `saved`
4. If same → skip (no unnecessary writes)
5. On IndexedDB error → set status to `error`, log nothing (no `console.log` per project rules)
6. `lastSavedAnswersRef` and `lastServerSavedAnswersRef` update independently after their respective saves
7. Server save is best-effort — if it fails, local save still succeeds. `saveStatus` reflects local save state (the primary purpose of this story)
8. Expose `lastServerSaveTimestamp` ref — save-on-navigate in SubmissionPage checks this to skip redundant server saves if one fired < 1s ago

**Change detection for server save:** Track a separate `lastServerSavedAnswersRef`. On each interval, diff `answers` against this ref to find changed `questionId`s. Only send changed answers in the `PATCH` request. Update `lastServerSavedAnswersRef` and `lastServerSaveTimestamp` on success.

**`JSON.stringify` performance note:** This runs every 3s on the answers record. For most question types (MCQ, matching, blanks), answers are tiny JSON objects. For Writing essays (W1-W3), answers contain a `text` field that could be ~500 words. This is still well under 1ms for `JSON.stringify` at this size. Acceptable for v1 — profile only if performance issues are reported.

**Important:** The 3-second interval saves to **IndexedDB always** (the primary goal of this story). Server saves are a bonus optimization — if the server save fails, IndexedDB still has the data. This decouples local persistence from network availability.

### Implementation Details: SubmissionPage Changes

**Step 1 — Seed server answers on `startSubmission` success:**

The current `startSubmission` `onSuccess` handler (SubmissionPage.tsx:116-119) only extracts `id` and `startedAt` from the response. It ignores the `answers[]` array that the backend returns for resumed submissions. **Fix this:** also parse the answers from the response and seed them into state.

```typescript
onSuccess: (data) => {
  const sub = (data as { data: { id: string; startedAt: string; answers?: Array<{ questionId: string; answer: unknown }> } }).data;
  setSubmissionId(sub.id);
  setStartedAt(sub.startedAt);
  // Seed existing server answers (for resumed submissions)
  if (sub.answers?.length) {
    setAnswers((prev) => {
      const seeded = { ...prev };
      for (const a of sub.answers!) {
        if (a.answer && !seeded[a.questionId]) {
          seeded[a.questionId] = a.answer;
        }
      }
      return seeded;
    });
  }
},
```

**Step 2 — Restore from IndexedDB (after server seed):**
```typescript
// After startSubmission succeeds and server answers are seeded:
useEffect(() => {
  if (!centerId || !assignmentId || !submissionId) return;
  loadAnswersLocal(centerId, assignmentId).then((stored) => {
    if (stored?.answers && Object.keys(stored.answers).length > 0) {
      setAnswers((prev) => {
        // Merge: for each questionId, local wins (it's fresher for in-progress work)
        // Server-seeded answers (from step 1) are already in `prev`
        // Local answers override them because student typed more recently
        return { ...prev, ...stored.answers };
      });
    }
  });
}, [centerId, assignmentId, submissionId]);
```

**Merge strategy:** Server answers are seeded first (Step 1). Local IndexedDB answers then override (Step 2) because they represent the most recent student typing — IndexedDB saves every 3s while server saves only on navigate. If the student is on a different device with no IndexedDB data, they get the server answers. If they're on the same device with IndexedDB data, they get their latest work.

**On submit — clean up IndexedDB:**
```typescript
// Inside handleSubmit, after submitSubmission.mutateAsync succeeds:
if (centerId && assignmentId) {
  await clearAnswersLocal(centerId, assignmentId);
}
```

**Save-on-navigate coordination:** Keep the existing save-on-navigate effect but add a guard using `lastServerSaveTimestamp` ref from `useAutoSave`. If a server save fired < 1s ago, skip the save-on-navigate server request to prevent doubled `PATCH` calls.

```typescript
// Modified save-on-navigate effect:
useEffect(() => {
  if (prevIndexRef.current === currentIndex) return;
  const prevQuestion = flatQuestions[prevIndexRef.current];
  if (prevQuestion && submissionId && answers[prevQuestion.id]) {
    // Skip if auto-save just sent a server save
    if (Date.now() - lastServerSaveTimestamp.current < 1000) {
      prevIndexRef.current = currentIndex;
      return;
    }
    saveAnswers.mutate({ ... });
  }
  prevIndexRef.current = currentIndex;
}, [currentIndex]);
```

### Implementation Details: SubmissionHeader "Saved" Indicator

**New props:**
```typescript
interface SubmissionHeaderProps {
  // ... existing props
  saveStatus?: SaveStatus; // from use-auto-save.ts
}
```

**Indicator placement:** Add a new `<div className="flex items-center gap-1 shrink-0">` between the title/progress `<div className="flex-1 min-w-0">` (line 76) and the timer `<div>` (line 83). The `shrink-0` prevents the indicator from collapsing when the header is tight. The title section already has `min-w-0` + `truncate` so it will give space.

**Layout at 375px:** The header (h-14) contains: back button (40px) + gap + title (flex-1, truncates) + indicator (~60px) + timer (~70px). At 375px, title truncates to accommodate. Hide the text label on small screens: use `<span className="hidden sm:inline">Saving...</span>` so only the icon shows below 640px.

**Auto-hide logic for "saved" state:** Use a `useEffect` + `setTimeout` to set a local `displayStatus` from `saved` → `idle` after 2 seconds. Reset timer on every `saveStatus` change.

**Icons from lucide-react (already installed) — use canonical names:**
- Saving: `LoaderCircle` with `animate-spin` class (canonical name for `Loader2` alias). Note: UX spec calls for "Rotating Feather" animation — `LoaderCircle` is accepted for MVP. Future UX refinement can replace with a custom feather SVG animation.
- Saved: `Check` with `text-green-600`
- Error: `CircleAlert` with `text-destructive` (canonical name for `AlertCircle` alias)

**Extensibility for Story 4.3:** Implement the icon/text rendering as a `switch` statement or `Record<SaveStatus, { icon, text, className }>` map. Story 4.3 will add `"offline"` (amber `CloudOff` + "Offline") and `"syncing"` (blue `Upload` + "Syncing...") entries to this map without restructuring the component.

### Existing Code to Modify

| File | Change |
|------|--------|
| `apps/webapp/src/features/submissions/components/SubmissionPage.tsx` | Add `useAutoSave` hook, add IndexedDB restore on mount, pass `saveStatus` to header, call `clearAnswersLocal` on submit |
| `apps/webapp/src/features/submissions/components/SubmissionHeader.tsx` | Add `saveStatus` prop, render "Saved" indicator with 3 states |

### New Files to Create

| File | Purpose |
|------|---------|
| `apps/webapp/src/features/submissions/lib/submission-storage.ts` | IndexedDB operations via `idb-keyval` |
| `apps/webapp/src/features/submissions/lib/submission-storage.test.ts` | Unit tests for storage utility |
| `apps/webapp/src/features/submissions/hooks/use-auto-save.ts` | Auto-save hook with 3s interval |
| `apps/webapp/src/features/submissions/hooks/use-auto-save.test.ts` | Unit tests for auto-save hook |

### Existing Code to REUSE (Do NOT Reinvent)

| Component/Pattern | Location | Reuse How |
|-------------------|----------|-----------|
| `useSaveAnswers` mutation hook | `apps/webapp/src/features/submissions/hooks/use-save-answers.ts` | Call inside `useAutoSave` for server-side sync of changed answers |
| Save-on-navigate effect | `SubmissionPage.tsx` lines 138-150 | Keep as-is — provides immediate server save on navigation. Auto-save adds 3s local fallback |
| `LoaderCircle`, `Check`, `CircleAlert` icons | `lucide-react` (already in project) | Use canonical names for "Saved" indicator states (Loader2/AlertCircle are aliases that work but may be deprecated) |
| `idb-keyval` | New dependency — install via `pnpm --filter=webapp add idb-keyval` | Lightweight IndexedDB wrapper |
| Toast pattern | `sonner` — `toast.error()` | For critical storage errors only (e.g., IndexedDB blocked) |
| Timer/interval pattern | `SubmissionPage.tsx` lines 104-110 (elapsed tracker) | Same `setInterval` + cleanup pattern for auto-save |

### Previous Story Intelligence (Story 4.1)

**Key learnings from Story 4.1 implementation:**
- **Answer state is `Record<string, unknown>`** keyed by `questionId`. Each value is a JSON object matching the question type's answer schema (see table in 4-1 story Dev Notes).
- **Save-on-navigate already works** — saves to server when student navigates between questions. This story adds the local persistence layer underneath.
- **`useBeforeUnload` guard is active** — prevents accidental tab close. Keep as-is.
- **SubmissionPage.tsx is 337 lines** — keep modifications minimal. The `useAutoSave` hook encapsulates all new logic.
- **`startSubmission` creates the record on mount** — if the server already has a submission for this assignment (via `@@unique([assignmentId, studentId])`), it returns the existing one with its answers array. **Important:** the current frontend `onSuccess` handler only extracts `id` and `startedAt` — Task 4.2 fixes this to also parse and seed existing answers from the response.
- **Photo uploads are handled separately** via `pendingPhotos` ref — auto-save only handles JSON answers, not file uploads.
- **Prisma `$transaction` + `getTenantedClient` issue** — not relevant here (frontend-only story), but worth knowing for future backend work.

**Debug issues from 4.1 to watch for:**
- TypeScript strict mode: `idb-keyval` types should work out of the box
- Vitest mocking of `idb-keyval`: use `vi.mock("idb-keyval")` with mock implementations for `get`, `set`, `del`

### Git Intelligence (Recent Commits)

```
b056f99 fix(backend): update staging webapp domain
1e2657c feat: Story 4.1 — Mobile Submission Interface + code review fixes
```

Story 4.1 was the last feature commit. All submission infrastructure (routes, hooks, components) is in place and tested. This story builds directly on top.

### Error Handling & Logging Strategy

- **No `console.log` in production** — per project rules. All error paths use the `saveStatus` state to surface issues to the UI.
- **IndexedDB write failure:** Catch in `saveAnswersLocal`, return without throwing. `useAutoSave` sets `saveStatus = "error"`. Do NOT log to console.
- **IndexedDB unavailable (private browsing):** Detected once via `isStorageAvailable()`. Show `toast.error(...)` once. All subsequent interval ticks skip IndexedDB writes silently.
- **Server save failure:** Caught by TanStack Query's `onError`. `saveStatus` remains `"saved"` (IndexedDB succeeded). Server failures are expected when offline — Story 4.3 will add proper offline handling.
- **Toast usage:** Only for the one-time "IndexedDB unavailable" warning. All other save status feedback goes through the header indicator, not toasts.

### Testing Requirements

**Unit tests** (Vitest, co-located):
- `submission-storage.test.ts`: mock `idb-keyval` — verify `set`, `get`, `del` called with correct keys/data
- `use-auto-save.test.ts`: mock timers (`vi.useFakeTimers`) — verify 3s interval fires, verify change detection skips unchanged answers, verify server save called with only changed answers, verify status transitions
- `SubmissionHeader` test: verify "Saved" indicator renders for each status, verify auto-hide after 2s

**Run tests:** `pnpm --filter=webapp test`

**Mock pattern for `idb-keyval`:**
```typescript
vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));
```

### Out of Scope (Deferred)

| Feature | Deferred To |
|---------|-------------|
| Offline detection (`navigator.onLine`) | Story 4.3 |
| "Do Not Close Tab" warning banner (network-aware) | Story 4.3 |
| Offline submission queue and auto-retry | Story 4.3 |
| `networkMode: 'offlineFirst'` on mutations | Story 4.3 |
| Server confirmation celebration (only after server confirms) | Story 4.3 |
| `persistQueryClient` for TanStack Query cache | Story 4.3 (broader offline strategy) |
| Syncing indicator (pulsing blue upload icon) | Story 4.3 — extends `SaveStatus` type with `"syncing"` |
| Offline indicator (amber cloud-off icon) | Story 4.3 — extends `SaveStatus` type with `"offline"` |
| "Rotating Feather" branded animation for saving state | Future UX refinement — `LoaderCircle` is MVP placeholder |
| Stale data detection (local vs server conflict resolution) | Future |

### Known Limitations (v1)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Multi-tab conflict** | Student opens same assignment in 2 tabs; both auto-save to IndexedDB every 3s; last write wins, potentially losing data from the other tab | Acceptable for v1 — students rarely open the same assignment in multiple tabs. Future: implement cross-tab coordination via `BroadcastChannel` API or `storage` event listener |
| **IndexedDB cleared by OS/browser** | Mobile browsers may evict IndexedDB data under storage pressure; student returns to find answers gone | Server answers are seeded on mount (Task 4.2); only the most recent unsaved typing (up to 3s) would be lost. Save-on-navigate provides server backup |
| **No server answer loading on different device** | If student switches devices, IndexedDB is empty; only server-seeded answers load | Task 4.2 fixes this by parsing server answers from `startSubmission` response |

### Project Structure Notes

- All new code in `apps/webapp/src/features/submissions/` — consistent with Story 4.1 structure
- New `lib/` subdirectory for storage utility (not a hook, not a component)
- Tests co-located next to source files
- No changes to `packages/types`, `packages/db`, or `apps/backend` — this is purely frontend

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-4-Story-4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Offline-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#OfflineIndicator]
- [Source: project-context.md#Critical-Implementation-Rules]
- [Source: project-context.md#Development-Workflow]
- [Source: _bmad-output/implementation-artifacts/4-1-mobile-submission-interface.md — previous story intelligence]
- [Source: apps/webapp/src/features/submissions/components/SubmissionPage.tsx — answer state management]
- [Source: apps/webapp/src/features/submissions/hooks/use-save-answers.ts — server save mutation]
- [Source: apps/webapp/src/features/submissions/components/SubmissionHeader.tsx — indicator placement target]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed 2 test timing issues in `use-auto-save.test.ts` — fake timer advancement needed to cover both setInterval (3000ms) and setTimeout debounce (500ms) in a single `advanceTimersByTimeAsync(3500)` call

### Completion Notes List

- Installed `idb-keyval` (~600 bytes gzip) as IndexedDB wrapper per architecture spec
- Created `submission-storage.ts` with 5 functions: `getStorageKey`, `isStorageAvailable`, `saveAnswersLocal`, `loadAnswersLocal`, `clearAnswersLocal`
- Created `useAutoSave` hook with 3s interval, `JSON.stringify` change detection, dual save (IndexedDB + server), 500ms debounce for server saves
- `SaveStatus` type designed as extensible union (`"idle" | "saving" | "saved" | "error"`) with `Record<SaveStatus, config>` map in SubmissionHeader for easy Story 4.3 extension
- SubmissionPage: seeds server answers from `startSubmission` response, restores from IndexedDB on mount (local wins merge), clears IndexedDB on submit
- Save-on-navigate guards against doubled server saves using `lastServerSaveTimestamp` ref
- SaveIndicator component auto-hides "Saved" state after 2s, error state persists, text hidden on small screens (`hidden sm:inline`)
- 28 new tests across 3 test files, 586 total tests passing, zero regressions
- Frontend-only story — no backend changes

### Change Log

- 2026-02-14: Story 4.2 implemented — Local auto-save with IndexedDB persistence and saved indicator UI

### File List

**New files:**
- `apps/webapp/src/features/submissions/lib/submission-storage.ts` — IndexedDB storage utility via idb-keyval
- `apps/webapp/src/features/submissions/lib/submission-storage.test.ts` — 9 unit tests for storage utility
- `apps/webapp/src/features/submissions/hooks/use-auto-save.ts` — Auto-save hook with 3s interval + server debounce
- `apps/webapp/src/features/submissions/hooks/use-auto-save.test.ts` — 12 unit tests for auto-save hook
- `apps/webapp/src/features/submissions/components/SubmissionHeader.test.tsx` — 7 component tests for save indicator

**Modified files:**
- `apps/webapp/src/features/submissions/components/SubmissionPage.tsx` — Added useAutoSave, IndexedDB restore, server answer seeding, clearAnswersLocal on submit, save-on-navigate guard
- `apps/webapp/src/features/submissions/components/SubmissionHeader.tsx` — Added saveStatus prop, SaveIndicator component with 4 states
- `apps/webapp/package.json` — Added idb-keyval dependency
- `pnpm-lock.yaml` — Updated lockfile
