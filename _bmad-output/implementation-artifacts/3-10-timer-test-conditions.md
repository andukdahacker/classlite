# Story 3.10: Timer & Test Conditions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to set time limits on exercises with countdown timers, warning alerts, auto-submit, and optional pause/grace period,
so that students can practice under realistic IELTS test conditions.

## Acceptance Criteria

1. **AC1: Exercise Time Limit** — Set total time limit in minutes (e.g., 60 for Reading). Stored as seconds. Nullable (no limit = untimed).
2. **AC2: Section Time Limits** — Optionally set per-section time limits within an exercise. Each QuestionSection gets an optional `sectionTimeLimit` (seconds, nullable). When set, sections are sequential — student must complete one before proceeding.
3. **AC3: Timer Display** — Student sees countdown timer. Configurable position: `top-bar` (fixed top) or `floating` (draggable corner widget). Default: `top-bar`.
4. **AC4: Warning Alerts** — Alert at configurable thresholds stored as JSON array of seconds (e.g., `[600, 300]` for "10 min" and "5 min" warnings). Default: `[600, 300]`.
5. **AC5: Auto-Submit** — When time expires, exercise auto-submits with current answers. Student sees "Time's up" message. `autoSubmitOnExpiry` boolean (default: `true`).
6. **AC6: Grace Period** — Optional grace period in seconds (e.g., 60) to review before final submission. `gracePeriodSeconds` nullable int. Only applies when `autoSubmitOnExpiry` is true.
7. **AC7: Pause Option** — `enablePause` boolean (default: `false`). When enabled, student can pause timer. Paused time is logged (future Epic 4 concern — builder just stores the toggle).

## Scope Clarification — Teacher-Side Builder ONLY

**This story builds the TEACHER-SIDE exercise creation UI only.** The following are OUT OF SCOPE:

- **Student countdown timer rendering** — Epic 4 (Student Submission). The builder only stores timer configuration (time limit, position, warnings). The actual `setInterval`/`requestAnimationFrame` countdown is NOT in this story.
- **Auto-submit logic** — Epic 4. The builder stores `autoSubmitOnExpiry` and `gracePeriodSeconds`. The actual form submission on timer expiry is NOT in this story.
- **Pause/resume timer logic** — Epic 4. The builder stores `enablePause`. The actual pause state management is NOT in this story.
- **Sequential section enforcement** — Epic 4. When section time limits are set, the student UI should enforce section order. This story only stores `sectionTimeLimit` per section.
- **Timer warning UI** (toast/modal/flash) — Epic 4. The builder only stores `warningAlerts` thresholds.

**What IS built:** Prisma schema fields, TypeScript schemas, backend service updates, a `TimerSettingsEditor` component for exercise-level timer configuration, section-level time limit input in `QuestionSectionEditor`, `ExerciseEditor` integration, preview display, and tests.

## Tasks / Subtasks

### Task 1: Prisma Schema — Add Timer Fields (AC: 1, 3, 4, 5, 6, 7)

- [x] 1.1 Add `timeLimit` (Int?, `@map("time_limit")`) to Exercise model — total exercise time in seconds (null = untimed)
- [x] 1.2 Add `timerPosition` (String?, `@map("timer_position")`) to Exercise model — `"top-bar"` or `"floating"` (null defaults to `"top-bar"` in UI)
- [x] 1.3 Add `warningAlerts` (Json?, `@map("warning_alerts")`) to Exercise model — JSON array of seconds, e.g. `[600, 300]`
- [x] 1.4 Add `autoSubmitOnExpiry` (Boolean, `@default(true)`, `@map("auto_submit_on_expiry")`) to Exercise model
- [x] 1.5 Add `gracePeriodSeconds` (Int?, `@map("grace_period_seconds")`) to Exercise model — only meaningful when autoSubmit is true
- [x] 1.6 Add `enablePause` (Boolean, `@default(false)`, `@map("enable_pause")`) to Exercise model
- [x] 1.7 Add `sectionTimeLimit` (Int?, `@map("section_time_limit")`) to QuestionSection model — per-section override in seconds
- [x] 1.8 Run `npx prisma db push` to apply schema changes

### Task 2: TypeScript Schemas — Timer Types (AC: 1-7)

- [x] 2.1 In `packages/types/src/exercises.ts`, add timer position enum:
  ```ts
  export const TimerPositionSchema = z.enum(["top-bar", "floating"]);
  export type TimerPosition = z.infer<typeof TimerPositionSchema>;
  ```
- [x] 2.2 Add `WarningAlertsSchema`:
  ```ts
  export const WarningAlertsSchema = z.array(z.number().int().positive()).nullable().optional();
  ```
- [x] 2.3 Add timer fields to `ExerciseSchema` (RESPONSE schema — uses `z.unknown()` for Json fields, matching `audioSections` pattern at line 483):
  ```ts
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: z.string().nullable().optional(),
  warningAlerts: z.unknown().nullable().optional(),
  autoSubmitOnExpiry: z.boolean().optional().default(true),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional().default(false),
  ```
  **IMPORTANT:** `warningAlerts` MUST use `z.unknown().nullable().optional()` in ExerciseSchema (not the strict array type). Prisma returns Json fields as `unknown`. Strict array validation goes ONLY in input schemas (Create/Update/Autosave). This matches the existing `audioSections: z.unknown().nullable().optional()` pattern.
- [x] 2.4 Add timer fields to `CreateExerciseSchema`:
  ```ts
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: TimerPositionSchema.nullable().optional(),
  warningAlerts: WarningAlertsSchema,
  autoSubmitOnExpiry: z.boolean().optional(),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional(),
  ```
- [x] 2.5 Add timer fields to `UpdateExerciseSchema` (same as Create)
- [x] 2.6 Add timer fields to `AutosaveExerciseSchema`:
  ```ts
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: TimerPositionSchema.nullable().optional(),
  warningAlerts: z.array(z.number().int().positive()).nullable().optional(),
  autoSubmitOnExpiry: z.boolean().optional(),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional(),
  ```
- [x] 2.7 Add `sectionTimeLimit` to `QuestionSectionSchema`:
  ```ts
  sectionTimeLimit: z.number().int().positive().nullable().optional(),
  ```
- [x] 2.8 Add `sectionTimeLimit` to `CreateQuestionSectionSchema` and verify it flows through to `UpdateQuestionSectionSchema` (which uses `.partial()`)

### Task 3: Backend — Exercise Service Updates (AC: 1, 3, 4, 5, 6, 7)

- [x] 3.1 Update `createExercise` in `exercises.service.ts` — add explicit field assignments:
  ```ts
  timeLimit: input.timeLimit ?? null,
  timerPosition: input.timerPosition ?? null,
  warningAlerts: input.warningAlerts ?? Prisma.DbNull,
  autoSubmitOnExpiry: input.autoSubmitOnExpiry ?? true,
  gracePeriodSeconds: input.gracePeriodSeconds ?? null,
  enablePause: input.enablePause ?? false,
  ```
  **Note:** `warningAlerts` is a Json field — use `Prisma.DbNull` instead of `null` for Prisma optional Json fields. Follow existing `toJsonValue()` pattern from `sections.service.ts` if needed, OR use the direct `Prisma.DbNull` approach already used for Json fields in the Exercise model.
- [x] 3.2 Update `updateDraftExercise` in `exercises.service.ts` — add conditional spread operators:
  ```ts
  ...("timeLimit" in input && input.timeLimit !== undefined && { timeLimit: input.timeLimit }),
  ...("timerPosition" in input && input.timerPosition !== undefined && { timerPosition: input.timerPosition }),
  ...("warningAlerts" in input && input.warningAlerts !== undefined && { warningAlerts: input.warningAlerts === null ? Prisma.DbNull : input.warningAlerts }),
  ...("autoSubmitOnExpiry" in input && input.autoSubmitOnExpiry !== undefined && { autoSubmitOnExpiry: input.autoSubmitOnExpiry }),
  ...("gracePeriodSeconds" in input && input.gracePeriodSeconds !== undefined && { gracePeriodSeconds: input.gracePeriodSeconds }),
  ...("enablePause" in input && input.enablePause !== undefined && { enablePause: input.enablePause }),
  ```
- [x] 3.3 No new routes needed — timer fields persist via existing create/update/autosave endpoints.

### Task 4: Backend — Section Service Updates (AC: 2)

- [x] 4.1 Update `createSection` in `sections.service.ts` — add `sectionTimeLimit`:
  ```ts
  ...(input.sectionTimeLimit !== undefined && { sectionTimeLimit: input.sectionTimeLimit }),
  ```
- [x] 4.2 Update `updateSection` in `sections.service.ts` — add conditional spread:
  ```ts
  ...(input.sectionTimeLimit !== undefined && { sectionTimeLimit: input.sectionTimeLimit }),
  ```

### Task 5: Frontend — TimerSettingsEditor Component (AC: 1, 3, 4, 5, 6, 7)

- [x] 5.1 Create `apps/webapp/src/features/exercises/components/TimerSettingsEditor.tsx` — exercise-level editor (like `WritingTaskEditor`, `SpeakingTaskEditor`)
  - **Time Limit section:**
    - Toggle: "Enable Time Limit" (controls whether `timeLimit` is set or null)
    - When enabled: Number input for minutes (convert to/from seconds for storage). Validation: min 1 minute, max 240 minutes.
  - **Timer Display section** (shown when time limit enabled):
    - Radio group: "Top Bar" (default) | "Floating Widget"
  - **Warning Alerts section** (shown when time limit enabled):
    - List of warning thresholds in minutes (default: 10, 5). Add/remove buttons.
    - Each threshold is a number input (minutes, converted to seconds for storage).
    - Validation: warnings must be less than time limit, no duplicates, sorted descending.
  - **Auto-Submit section** (shown when time limit enabled):
    - Toggle: "Auto-submit when time expires" (default: on)
    - When auto-submit enabled: Optional grace period input in minutes (converted to seconds). "Give students X minute(s) to review before submitting."
  - **Pause section** (shown when time limit enabled):
    - Toggle: "Allow students to pause timer" (default: off)
    - Info text: "When enabled, students can pause and resume. Paused time is tracked."
- [x] 5.2 Props interface:
  ```ts
  interface TimerSettingsEditorProps {
    timeLimit: number | null;                    // seconds
    timerPosition: TimerPosition | null;
    warningAlerts: number[] | null;              // seconds
    autoSubmitOnExpiry: boolean;
    gracePeriodSeconds: number | null;
    enablePause: boolean;
    onTimeLimitChange: (v: number | null) => void;
    onTimerPositionChange: (v: TimerPosition | null) => void;
    onWarningAlertsChange: (v: number[] | null) => void;
    onAutoSubmitOnExpiryChange: (v: boolean) => void;
    onGracePeriodSecondsChange: (v: number | null) => void;
    onEnablePauseChange: (v: boolean) => void;
  }
  ```
- [x] 5.3 Use shadcn components: `Checkbox` for toggles (NOT Switch — matches WritingTaskEditor/SpeakingTaskEditor pattern), `Input` for numbers, `RadioGroup` for timer position, `Button` for add/remove warnings. Follow existing Checkbox + Label/description pattern from WritingTaskEditor lines 341-361.
- [x] 5.4 **Grace period auto-clear:** When `autoSubmitOnExpiry` is toggled OFF, auto-clear `gracePeriodSeconds` to null (call `onGracePeriodSecondsChange(null)`). Prevents stale config data.

### Task 6: Frontend — Section Time Limit in QuestionSectionEditor (AC: 2)

- [x] 6.1 **Update `onUpdateSection` inline type in TWO places** (compile error if missed):
  - In `QuestionSectionEditor.tsx` props interface (line 71): Add `sectionTimeLimit?: number | null` to the `data` parameter type:
    ```ts
    onUpdateSection: (sectionId: string, data: {
      sectionType?: IeltsQuestionType
      instructions?: string | null
      audioSectionIndex?: number | null
      sectionTimeLimit?: number | null  // NEW
    }) => void
    ```
  - In `ExerciseEditor.tsx` `handleUpdateSection` handler (line 517): Same inline type update:
    ```ts
    const handleUpdateSection = async (
      sectionId: string,
      data: {
        sectionType?: IeltsQuestionType
        instructions?: string | null
        audioSectionIndex?: number | null
        sectionTimeLimit?: number | null  // NEW
      },
    ) => { ... }
    ```
- [x] 6.2 In `QuestionSectionEditor.tsx`, add an optional "Section Time Limit" input field:
  - Only shown when the exercise has a time limit enabled (parent passes `exerciseHasTimeLimit` prop)
  - Number input for minutes (convert to/from seconds). Label: "Section Time Limit (optional)"
  - Help text: "Override exercise time limit for this section. Leave empty to use exercise total."
  - On change, call `onUpdateSection(section.id, { sectionTimeLimit: valueInSeconds })` — uses existing mutation path
- [x] 6.3 Add `sectionTimeLimit` to the section update API call in the frontend (wherever sections are updated — check the mutation hook)

### Task 7: Frontend — ExerciseEditor Integration (AC: 1-7)

- [x] 7.1 Add useState hooks for 6 timer fields:
  ```ts
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [timerPosition, setTimerPosition] = useState<TimerPosition | null>(null);
  const [warningAlerts, setWarningAlerts] = useState<number[] | null>(null);
  const [autoSubmitOnExpiry, setAutoSubmitOnExpiry] = useState(true);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState<number | null>(null);
  const [enablePause, setEnablePause] = useState(false);
  ```
- [x] 7.2 Load from exercise in the existing useEffect. **IMPORTANT: `warningAlerts` is `unknown` from the response schema (Json field) — must cast like `audioSections` at line 346:**
  ```ts
  setTimeLimit(exercise.timeLimit ?? null);
  setTimerPosition((exercise.timerPosition as TimerPosition) ?? null);
  setWarningAlerts(
    Array.isArray(exercise.warningAlerts)
      ? (exercise.warningAlerts as number[])
      : null
  );
  setAutoSubmitOnExpiry(exercise.autoSubmitOnExpiry ?? true);
  setGracePeriodSeconds(exercise.gracePeriodSeconds ?? null);
  setEnablePause(exercise.enablePause ?? false);
  ```
- [x] 7.3 Render `TimerSettingsEditor` in the editor — this applies to ALL skills. **Exact placement: AFTER PassageEditor (line 838) and BEFORE the Question Sections div (line 901).** Current render order: AudioUploadEditor (757) > WritingTaskEditor (798) > SpeakingTaskEditor (823) > PassageEditor (838) > **[INSERT TimerSettingsEditor HERE]** > Question Sections (901). Wrap in `isEditing && id` guard:
  ```tsx
  {isEditing && id && (
    <div className="max-w-3xl">
      <TimerSettingsEditor
        timeLimit={timeLimit}
        timerPosition={timerPosition}
        warningAlerts={warningAlerts}
        autoSubmitOnExpiry={autoSubmitOnExpiry}
        gracePeriodSeconds={gracePeriodSeconds}
        enablePause={enablePause}
        onTimeLimitChange={(v) => { setTimeLimit(v); userHasEdited.current = true; }}
        onTimerPositionChange={(v) => { setTimerPosition(v); userHasEdited.current = true; }}
        onWarningAlertsChange={(v) => { setWarningAlerts(v); userHasEdited.current = true; }}
        onAutoSubmitOnExpiryChange={(v) => { setAutoSubmitOnExpiry(v); userHasEdited.current = true; }}
        onGracePeriodSecondsChange={(v) => { setGracePeriodSeconds(v); userHasEdited.current = true; }}
        onEnablePauseChange={(v) => { setEnablePause(v); userHasEdited.current = true; }}
      />
    </div>
  )}
  ```
- [x] 7.4 Include timer fields in `scheduleAutosave` payload AND add all 6 timer state variables to the `useCallback` dependency array (line ~406 — missing a dependency causes stale autosave payloads):
  ```ts
  // In autosave payload:
  timeLimit,
  timerPosition,
  warningAlerts,
  autoSubmitOnExpiry,
  gracePeriodSeconds,
  enablePause,
  // In useCallback dependency array:
  // ..., timeLimit, timerPosition, warningAlerts, autoSubmitOnExpiry, gracePeriodSeconds, enablePause]
  ```
- [x] 7.5 **Note:** `handleSaveDraft` (line 458) calls the same `autosave()` function with the same payload as `scheduleAutosave`. They share the same payload construction — updating the payload in Task 7.4 covers both. Verify `handleSaveDraft` includes all 6 timer fields after your edit.
- [x] 7.6 Update `ExercisePreview` — add timer info display:
  - If `timeLimit` is set: Show "Time Limit: X minutes" in preview header
  - If `warningAlerts`: Show "Warnings at: 10 min, 5 min"
  - If `autoSubmitOnExpiry`: Show "Auto-submit: Yes/No"
  - If `gracePeriodSeconds`: Show "Grace period: X min"
  - If `enablePause`: Show "Pause allowed: Yes"
  - Add timer props to `ExercisePreviewProps` interface
- [x] 7.7 Pass `exerciseHasTimeLimit={timeLimit !== null && timeLimit > 0}` prop to each `QuestionSectionEditor` instance so section time limit UI can conditionally display.

### Task 8: Tests (AC: all)

- [x] 8.1 `packages/types/src/exercises.test.ts` — Add tests for:
  - `TimerPositionSchema` validation (accepts `"top-bar"`, `"floating"`, rejects invalid)
  - `WarningAlertsSchema` validation (accepts array of positive ints, accepts null)
  - `ExerciseSchema` with all 6 timer fields
  - `CreateExerciseSchema` / `UpdateExerciseSchema` with timer fields
  - `AutosaveExerciseSchema` with timer fields
  - `CreateQuestionSectionSchema` with `sectionTimeLimit`
- [x] 8.2 `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add tests for:
  - `createExercise` with timer fields (verifies fields are passed through to Prisma)
  - `updateDraftExercise` with timer fields (conditional spread pattern)
  - `updateDraftExercise` with `warningAlerts` as null (should use `Prisma.DbNull`)
- [x] 8.3 `apps/backend/src/modules/exercises/sections.service.test.ts` — Add tests for:
  - `createSection` with `sectionTimeLimit`
  - `updateSection` with `sectionTimeLimit`
- [x] 8.4 `apps/webapp/src/features/exercises/components/TimerSettingsEditor.test.tsx` — Add tests for:
  - Renders with time limit disabled (no sub-sections visible)
  - Enables time limit — shows timer position, warnings, auto-submit, pause
  - Warning alert add/remove
  - Auto-submit toggle shows/hides grace period
  - Grace period auto-clears when auto-submit is toggled off
  - Pause toggle
  - **Minute-to-second conversion:** Verify `onTimeLimitChange` receives seconds (e.g., user enters 60 minutes -> callback receives 3600). Same for `onWarningAlertsChange` and `onGracePeriodSecondsChange`. This is the primary point of failure.
- [x] 8.5 Run full test suite: `pnpm --filter=types test && pnpm --filter=backend test && pnpm --filter=webapp test` — all green

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: No new routes needed. Timer fields use existing create/update/autosave endpoints for exercises. Section time limit uses existing section update endpoint.
- **Multi-tenancy**: All queries use `getTenantedClient(centerId)`. No new storage paths.
- **Zod validation**: All new fields validated via type schemas. `warningAlerts` validated as array of positive integers.

### Key Implementation Patterns (from Stories 3.6-3.9)

- **Exercise-level settings editor**: Follow `WritingTaskEditor`/`SpeakingTaskEditor` pattern. `TimerSettingsEditor` lives in `apps/webapp/src/features/exercises/components/` (NOT in `question-types/`).
- **State management**: useState per field, load from exercise in useEffect, include in autosave payload, wire onChange with `userHasEdited.current = true`.
- **Conditional spread in service**: `updateDraftExercise` uses `"fieldName" in input && input.fieldName !== undefined && { ... }` pattern.
- **Json fields in Prisma**: `warningAlerts` is `Json?`. When setting to null, use `Prisma.DbNull` not `null`. For non-null values, pass directly as `Prisma.InputJsonValue`. See `toJsonValue()` in `sections.service.ts` for reference pattern.
- **Schema `.partial()`**: `UpdateQuestionSectionSchema = CreateQuestionSectionSchema.partial()` — adding `sectionTimeLimit` to Create automatically includes it in Update.

### Timer Applies to ALL Skills

Unlike skill-specific editors (Writing, Listening, Speaking), the timer settings are universal — a Reading, Listening, Writing, or Speaking exercise can all have time limits. The `TimerSettingsEditor` should NOT be gated behind `isWriting`/`isListening`/`isSpeaking` — it renders for all exercises.

### Unit Conversion — Minutes vs Seconds

All timer values are stored in the database as **seconds** for precision. The frontend editor converts between minutes (user-facing) and seconds (storage). Key conversions:
- `timeLimit`: User enters minutes, stored as seconds (multiply by 60)
- `warningAlerts`: User enters minutes, stored as seconds
- `gracePeriodSeconds`: User enters minutes, stored as seconds
- `sectionTimeLimit`: User enters minutes, stored as seconds

### Warning Alerts Default Behavior

When time limit is first enabled, pre-populate `warningAlerts` with `[600, 300]` (10 min, 5 min). If the user sets a time limit < 10 minutes, auto-remove warnings that exceed the time limit. The frontend should validate that all warning values are less than `timeLimit`.

### Prisma Json Field Handling

The `warningAlerts` field uses Prisma's `Json?` type. Important patterns:
- **Read**: Comes back as `unknown` — cast/parse with Zod schema on the frontend
- **Write null**: Use `Prisma.DbNull` (not `null`) — this is a Prisma requirement for optional Json fields
- **Write value**: Pass array directly: `[600, 300]`
- **Autosave**: The existing autosave endpoint already handles Json fields — just include in payload

### What NOT to Build

- No countdown timer UI (Epic 4 — Student Submission)
- No auto-submit form submission logic (Epic 4)
- No pause/resume state management (Epic 4)
- No sequential section enforcement UI (Epic 4)
- No timer warning toast/modal/notification (Epic 4)
- No tagging (Story 3.11)
- No exercise library (Story 3.14)

### Previous Story Learnings (Stories 3.6-3.9)

- **Story 3.8 (Writing)**: Exercise-level settings editor pattern is the closest model. Single component, receives all settings as props with onChange callbacks. Card-based layout with Label and descriptions.
- **Story 3.9 (Speaking)**: Confirmed the pattern for adding Prisma fields (Int?, Boolean with default), TypeScript schemas, service field handling, and ExerciseEditor integration. No new routes were needed — same approach here.
- **Common code review issues from 3.6-3.9**: Empty `onBlur` handlers, dead props, missing test coverage for all variants, unreachable logic, duplicate case blocks. Keep code minimal, test every branch.
- **ExercisePreview is internal**: Defined INSIDE `ExerciseEditor.tsx` (~line 100). Add timer props to `ExercisePreviewProps` interface.

### Git Intelligence

Recent commits follow:
- Commit format: `feat(exercises): implement story 3.X <description>`
- Single cohesive commits per story
- Code review fixes committed separately
- Last commit: `617a11d feat(exercises): implement story 3.9 speaking exercise builder with code review fixes`

### File Changes Summary

**New files:**
- `apps/webapp/src/features/exercises/components/TimerSettingsEditor.tsx`
- `apps/webapp/src/features/exercises/components/TimerSettingsEditor.test.tsx`

**Modified files:**
- `packages/db/prisma/schema.prisma` — Add 6 timer fields to Exercise model + 1 to QuestionSection model
- `packages/types/src/exercises.ts` — Add TimerPositionSchema, WarningAlertsSchema, timer fields to ExerciseSchema/Create/Update/Autosave, sectionTimeLimit to QuestionSectionSchema/Create
- `packages/types/src/exercises.test.ts` — Add timer type tests
- `apps/backend/src/modules/exercises/exercises.service.ts` — Update createExercise/updateDraftExercise with timer fields
- `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add timer field tests
- `apps/backend/src/modules/exercises/sections.service.ts` — Update createSection/updateSection with sectionTimeLimit
- `apps/backend/src/modules/exercises/sections.service.test.ts` — Add sectionTimeLimit tests
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Add timer state variables, render TimerSettingsEditor, autosave fields, update ExercisePreview, pass exerciseHasTimeLimit to sections
- `apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx` — Add optional section time limit input
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated (updated by sync-schema-dev)

### Project Structure Notes

- `TimerSettingsEditor` is exercise-level — lives in `apps/webapp/src/features/exercises/components/`, NOT inside `question-types/`
- Section time limit is section-level — integrated directly into existing `QuestionSectionEditor.tsx`
- No cross-app imports — types from `@workspace/types`, DB from `@workspace/db`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.10 Timer & Test Conditions]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project structure, API patterns]
- [Source: project-context.md — Multi-tenancy, Route-Controller-Service, Testing rules]
- [Source: 3-9-speaking-exercise-builder.md — Exercise-level settings pattern, service field handling, code review learnings]
- [Source: packages/types/src/exercises.ts — Existing schemas and field patterns]
- [Source: packages/db/prisma/schema.prisma — Exercise model, QuestionSection model]
- [Source: apps/webapp/src/features/exercises/components/ExerciseEditor.tsx — State management, autosave, preview patterns]
- [Source: apps/backend/src/modules/exercises/sections.service.ts — Section update conditional spread pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No halts or errors encountered.

### Completion Notes List

- Task 1: Added 6 timer fields to Exercise model (`timeLimit`, `timerPosition`, `warningAlerts`, `autoSubmitOnExpiry`, `gracePeriodSeconds`, `enablePause`) and 1 field to QuestionSection model (`sectionTimeLimit`). Pushed schema and regenerated client.
- Task 2: Created `TimerPositionSchema` enum and `WarningAlertsSchema`. Added timer fields to `ExerciseSchema` (with `z.unknown()` for Json), `CreateExerciseSchema`, `UpdateExerciseSchema`, `AutosaveExerciseSchema`, `QuestionSectionSchema`, and `CreateQuestionSectionSchema`.
- Task 3: Updated `createExercise` with explicit timer field assignments (using `Prisma.DbNull` for `warningAlerts`). Updated `updateDraftExercise` with conditional spread for all 6 timer fields, with `Prisma.DbNull` handling for null `warningAlerts`.
- Task 4: Added `sectionTimeLimit` conditional spread to both `createSection` and `updateSection` in sections.service.ts.
- Task 5: Created `TimerSettingsEditor.tsx` — controlled component with Checkbox toggles, RadioGroup for timer position, dynamic warning alerts list, auto-submit with grace period, and pause toggle. Minute-to-second conversion for all inputs.
- Task 6: Updated `onUpdateSection` type in both `QuestionSectionEditor.tsx` and `ExerciseEditor.tsx` to include `sectionTimeLimit`. Added conditional section time limit input shown only when exercise has a time limit.
- Task 7: Added 6 timer useState hooks to ExerciseEditor, loaded from exercise in useEffect with proper `warningAlerts` Json cast. Rendered `TimerSettingsEditor` after PassageEditor for ALL skill types. Added timer fields to autosave payload and dependency array. Updated `handleSaveDraft` payload. Added timer display to `ExercisePreview`. Passed `exerciseHasTimeLimit` to each `QuestionSectionEditor`.
- Task 8: All tests written and passing — 254 types tests, 402 backend tests, 394 webapp tests (including 12 new TimerSettingsEditor tests). All green, zero regressions.
- Also updated `project-context.md` with database command patterns per user request.

### Change Log

- 2026-02-09: Implemented Story 3.10 — Timer & Test Conditions (all 8 tasks, all ACs satisfied)
- 2026-02-09: Code review fixes — H1: Added caseSensitive/partialCredit to AutosaveExerciseSchema; H2/H3: Strengthened Prisma.DbNull test assertions; M2: Fixed handleAddWarning duplicate handling; M3: Fixed unstable key={index} to key={seconds}; L1: Removed conditional test assertions; L2: Added timerPosition to ExercisePreview

### File List

**New files:**
- `apps/webapp/src/features/exercises/components/TimerSettingsEditor.tsx`
- `apps/webapp/src/features/exercises/components/TimerSettingsEditor.test.tsx`

**Modified files:**
- `packages/db/prisma/schema.prisma`
- `packages/types/src/exercises.ts`
- `packages/types/src/exercises.test.ts`
- `apps/backend/src/modules/exercises/exercises.service.ts`
- `apps/backend/src/modules/exercises/exercises.service.test.ts`
- `apps/backend/src/modules/exercises/sections.service.ts`
- `apps/backend/src/modules/exercises/sections.service.test.ts`
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx`
- `apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx`
- `project-context.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (sprint tracking)
- `apps/website/.astro/data-store.json` (auto-generated)
- `apps/website/.astro/types.d.ts` (auto-generated)
