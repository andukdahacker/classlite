# Story 3.8: Writing Task Builder

Status: done

## Story

As a Teacher,
I want to create IELTS Writing tasks with proper rubrics,
so that AI grading aligns with IELTS band descriptors.

## Acceptance Criteria

1. **AC1: Task 1 Academic (W1)** — Upload visual stimulus (chart/graph/table/diagram/map/process). Add task prompt. Set word count guidance (minimum 150 words).
2. **AC2: Task 1 General (W2)** — Create letter prompt with situation and bullet points. Specify tone (formal/informal/semi-formal).
3. **AC3: Task 2 Essay (W3)** — Create essay prompt. Set word count guidance (minimum 250 words).
4. **AC4: Rubric Display** — Show IELTS band descriptors (Task Achievement, Coherence, Lexical Resource, Grammar) in grading interface.
5. **AC5: Sample Response** — Teacher can add a model answer for reference (visible to teacher only during grading, optionally revealed to student after grading).
6. **AC6: Word Count Enforcement** — Display live word count to student. Optional hard limit or soft warning.

## Tasks / Subtasks

### Task 1: Prisma Schema — Add Writing-Specific Fields (AC: 1, 2, 3, 5, 6)

- [x] 1.1 Add `stimulusImageUrl` (String?, `@map("stimulus_image_url")`) to Exercise model — stores W1 chart/graph image
- [x] 1.2 Add `writingPrompt` (String? `@db.Text`, `@map("writing_prompt")`) to Exercise model — stores the task prompt text
- [x] 1.3 Add `letterTone` (String?, `@map("letter_tone")`) to Exercise model — stores W2 tone: "formal" | "informal" | "semi-formal"
- [x] 1.4 Add `wordCountMin` (Int?, `@map("word_count_min")`) to Exercise model — minimum word count guidance (150 for W1, 250 for W3)
- [x] 1.5 Add `wordCountMax` (Int?, `@map("word_count_max")`) to Exercise model — optional hard limit
- [x] 1.6 Add `wordCountMode` (String?, `@map("word_count_mode")`) to Exercise model — "soft" (warning) or "hard" (enforced)
- [x] 1.7 Add `sampleResponse` (String? `@db.Text`, `@map("sample_response")`) to Exercise model — teacher's model answer
- [x] 1.8 Add `showSampleAfterGrading` (Boolean, `@default(false)`, `@map("show_sample_after_grading")`) to Exercise model
- [x] 1.9 Run `npx prisma db push` to apply schema changes to dev database
- [x] 1.10 Verify migration applies cleanly to dev database

### Task 2: TypeScript Schemas — Writing Types (AC: 1, 2, 3, 4, 5, 6)

- [x] 2.1 In `packages/types/src/exercises.ts`, add `LetterToneSchema = z.enum(["formal", "informal", "semi-formal"])`
- [x] 2.2 Add `WordCountModeSchema = z.enum(["soft", "hard"])`
- [x] 2.3 Add `WritingRubricCriterionSchema` with fields: `name` (string), `band` (number 0-9, 0.5 step), `comment` (string optional)
- [x] 2.4 Add `WritingRubricSchema = z.object({ criteria: z.array(WritingRubricCriterionSchema).length(4) })`
- [x] 2.5 Add `WritingAnswerSchema = z.null()` — Writing tasks have no auto-gradable "correct answer" (grading is rubric-based in Epic 5)
- [x] 2.6 Add W1, W2, W3 entries to `QuestionOptionsSchema` discriminated union — all use `z.null()` for both options and correctAnswer because writing-specific settings (stimulus image, letter tone) are stored on the Exercise model, NOT per-question:
  ```
  z.object({ questionType: z.literal("W1_TASK1_ACADEMIC"), options: z.null(), correctAnswer: z.null() })
  z.object({ questionType: z.literal("W2_TASK1_GENERAL"), options: z.null(), correctAnswer: z.null() })
  z.object({ questionType: z.literal("W3_TASK2_ESSAY"), options: z.null(), correctAnswer: z.null() })
  ```
- [x] 2.7 Add writing fields to `ExerciseSchema`: `stimulusImageUrl`, `writingPrompt`, `letterTone`, `wordCountMin`, `wordCountMax`, `wordCountMode`, `sampleResponse`, `showSampleAfterGrading`
- [x] 2.8 Add writing fields to `CreateExerciseSchema` and `UpdateExerciseSchema` (all optional/nullable)
- [x] 2.9 Add writing fields to `AutosaveExerciseSchema` — include all EXCEPT `stimulusImageUrl` (uploaded via dedicated endpoint like audioUrl, not autosaved)
- [x] 2.10 Add `WRITING_RUBRIC_CRITERIA` constant with the 4 IELTS criteria names:
  ```
  Task 1: ["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"]
  Task 2: ["Task Response", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"]
  ```

### Task 3: Backend — Stimulus Image Upload + Service Layer Updates (AC: 1, 2, 3, 5, 6)

- [x] 3.1 Add `uploadStimulusImage` method to `exercises.service.ts` — follows `uploadAudio` pattern (NOT `uploadDiagram`):
  - Firebase Storage path: `exercises/{centerId}/{exerciseId}/stimulus-image/{Date.now()}.{ext}`
  - Allowed types: `image/png`, `image/jpeg`, `image/jpg`, `image/svg+xml`
  - Size limit: 5MB
  - Verify exercise is DRAFT via `verifyDraftExercise()` before upload
  - **Save URL directly to Exercise model** via `db.exercise.update({ data: { stimulusImageUrl } })` — like `uploadAudio` saves `audioUrl` (line 287-289), NOT like `uploadDiagram` which only returns URL
  - Return `{ stimulusImageUrl }` object
- [x] 3.2 Add `deleteStimulusImage` method to `exercises.service.ts` — deletes file from Firebase Storage, then sets `stimulusImageUrl = null` on Exercise (follows `deleteAudio` pattern)
- [x] 3.3 Add `uploadStimulusImage` and `deleteStimulusImage` methods to `exercises.controller.ts` — follow `uploadAudio`/`deleteAudio` controller pattern (lines 126-158)
- [x] 3.4 Add `POST /:exerciseId/stimulus-image` route to `exercises.routes.ts` — follows audio upload route pattern (lines 488-562), with 5MB size limit and image MIME types
- [x] 3.5 Add `DELETE /:exerciseId/stimulus-image` route to `exercises.routes.ts` — follows audio delete route pattern (lines 564-610)
- [x] 3.6 Update `createExercise` in `exercises.service.ts` — add explicit field assignments for all writing fields in the `db.exercise.create({ data: {...} })` call (lines 105-115):
  ```
  writingPrompt: input.writingPrompt ?? null,
  letterTone: input.letterTone ?? null,
  wordCountMin: input.wordCountMin ?? null,
  wordCountMax: input.wordCountMax ?? null,
  wordCountMode: input.wordCountMode ?? null,
  sampleResponse: input.sampleResponse ?? null,
  showSampleAfterGrading: input.showSampleAfterGrading ?? false,
  ```
  (NOT stimulusImageUrl — that's uploaded via dedicated endpoint)
- [x] 3.7 Update `updateDraftExercise` in `exercises.service.ts` — add conditional spread operators for writing fields in the `db.exercise.update({ data: {...} })` call (lines 134-170), following the existing pattern:
  ```
  ...("writingPrompt" in input && input.writingPrompt !== undefined && { writingPrompt: input.writingPrompt }),
  ...("letterTone" in input && input.letterTone !== undefined && { letterTone: input.letterTone }),
  // ... same for wordCountMin, wordCountMax, wordCountMode, sampleResponse, showSampleAfterGrading
  ```

### Task 4: Frontend — Stimulus Upload Hook (AC: 1)

- [x] 4.1 Create `apps/webapp/src/features/exercises/hooks/use-stimulus-upload.ts`
  - `useStimulusUpload()` — follows `useAudioUpload` pattern (NOT `useDiagramUpload`):
    - Uses `useQueryClient()` for cache invalidation
    - POST to `/api/v1/exercises/{exerciseId}/stimulus-image`
    - `onSuccess`: invalidates `exercisesKeys.detail(exerciseId)` and `exercisesKeys.lists()` — this ensures ExerciseEditor refetches the updated Exercise with the new `stimulusImageUrl`
  - `useStimulusDelete()` — follows `useAudioDelete` pattern with same cache invalidation

### Task 5: Frontend — WritingTaskEditor Component (AC: 1, 2, 3, 5, 6)

- [x] 5.1 Create `apps/webapp/src/features/exercises/components/WritingTaskEditor.tsx` — exercise-level editor (NOT in question-types/)
  - This is an **exercise-level** component like `AudioUploadEditor` or `PassageEditor`, shown when `skill === "WRITING"`
  - Contains:
    - **Writing Prompt** textarea (maps to `writingPrompt` field on Exercise)
    - **W1-specific**: Stimulus image upload area (reuses `useStimulusUpload` hook) with image preview and delete
    - **W2-specific**: Letter tone selector (formal/informal/semi-formal radio buttons or select)
    - **Word Count Settings**: min input (default 150 for W1, 250 for W3), optional max, mode toggle (soft/hard)
    - **Sample Response**: textarea for model answer with `showSampleAfterGrading` toggle
- [x] 5.2 The component receives the current exercise data + `sectionType` of the first section to determine W1/W2/W3 variant
- [x] 5.3 Stimulus image upload: file input with client-side type validation (PNG, JPG, SVG), upload progress, image preview, delete button

### Task 6: Frontend — Writing Question Editor/Preview (AC: 1, 2, 3)

- [x] 6.1 Writing questions are minimal — the "question" in IELTS Writing is essentially the prompt itself. Each section has exactly 1 question with `questionText` = task instruction text
- [x] 6.2 Add W1, W2, W3 cases to `QuestionEditorFactory.tsx`:
  - W1_TASK1_ACADEMIC, W2_TASK1_GENERAL, W3_TASK2_ESSAY all render a simple read-only notice: "Writing task prompt is configured above in the Writing Task Settings section"
  - No options or correctAnswer editing needed (writing is rubric-graded)
- [x] 6.3 Add W1, W2, W3 cases to `QuestionPreviewFactory.tsx`:
  - W1: Show stimulus image + prompt text + word count guidance
  - W2: Show tone indicator + prompt text
  - W3: Show prompt text + word count guidance
  - All show "This task is graded using IELTS band descriptors" note

### Task 7: Frontend — ExerciseEditor Integration (AC: 1, 2, 3, 4, 5, 6)

- [x] 7.1 In `ExerciseEditor.tsx`, add WRITING skill conditional block (follows LISTENING pattern):
  - When `skill === "WRITING"`, render `<WritingTaskEditor>` between title/instructions and sections
  - Hide `PassageEditor` for WRITING (writing prompt replaces passage)
  - Hide `AudioUploadEditor` for WRITING
- [x] 7.2 Writing exercises should auto-create 1 section with the selected W-type when skill is set to WRITING (like LISTENING creates 1 section)
- [x] 7.3 For WRITING, limit to exactly 1 section (no "Add Section" button) — each writing exercise = 1 task type

### Task 8: Frontend — Rubric Display Component (AC: 4)

- [x] 8.1 Create `apps/webapp/src/features/exercises/components/WritingRubricDisplay.tsx`
  - Read-only display of 4 IELTS Writing criteria with band descriptors
  - Accepts `taskType: "W1" | "W2" | "W3"` prop to show correct Criterion 1 label:
    - W1/W2: "Task Achievement"
    - W3: "Task Response"
  - Criteria 2-4 are identical across all types
  - Shows band scale 0-9 (informational only — actual scoring is Epic 5)
- [x] 8.2 Render `WritingRubricDisplay` in the internal `ExercisePreview` component (defined inside `ExerciseEditor.tsx` at lines 69-199, NOT a separate file) when `skill === "WRITING"`. Add writing-specific props to the `ExercisePreviewProps` interface: `writingPrompt`, `stimulusImageUrl`, `letterTone`, `wordCountMin`, `sampleResponse`
- [x] 8.3 Add a collapsible "IELTS Band Descriptors" section in the `WritingTaskEditor` for teacher reference

### Task 9: Autosave — Writing Fields (AC: 2, 3, 5, 6)

- [x] 9.1 Writing fields are already handled in autosave via `AutosaveExerciseSchema` (Task 2.9) and `updateDraftExercise` service method (Task 3.7) — no separate route changes needed
- [x] 9.2 Frontend: add useState hooks for all writing fields in `ExerciseEditor.tsx`, load from exercise data in useEffect, include in `scheduleAutosave` payload and dependency array. Fields to autosave: `writingPrompt`, `letterTone`, `wordCountMin`, `wordCountMax`, `wordCountMode`, `sampleResponse`, `showSampleAfterGrading` (7 fields — NOT `stimulusImageUrl` which is uploaded via dedicated endpoint)

### Task 10: Tests (AC: all)

- [x] 10.1 `packages/types/src/exercises.test.ts` — Add tests for:
  - QuestionOptionsSchema discriminated union with W1, W2, W3 entries (all use null options + null correctAnswer)
  - Verify W1/W2/W3 reject non-null options (guards against dual-storage bugs)
  - LetterToneSchema validation (valid tones accepted, invalid rejected)
  - WordCountModeSchema validation ("soft"/"hard" accepted, others rejected)
  - WritingRubricSchema validation (exactly 4 criteria, band 0-9 range, 0.5 step)
  - ExerciseSchema with new writing fields (stimulusImageUrl, writingPrompt, letterTone, wordCountMin, wordCountMax, wordCountMode, sampleResponse, showSampleAfterGrading)
- [x] 10.2 `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add tests for:
  - uploadStimulusImage (valid image upload + URL return, MIME extension mapping, storage path structure, non-draft rejected, not-found rejected)
  - deleteStimulusImage (storage delete + DB clear, non-draft rejected, null URL graceful handling, storage failure resilience)
- [x] 10.3 Run full test suite: `pnpm --filter=types test && pnpm --filter=backend test && pnpm --filter=webapp test` — all green (194 + 383 + 352 = 929 tests passing)

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: Stimulus upload MUST follow the layered pattern. Route handles Fastify request/file parsing, controller orchestrates, service interacts with Firebase Storage + Prisma.
- **Multi-tenancy**: All queries MUST use `getTenantedClient(centerId)`. The stimulus upload path includes `centerId` for isolation.
- **Zod validation**: All new request/response schemas must use `fastify-type-provider-zod`. Writing fields in create/update/autosave schemas must be validated.

### Key Implementation Patterns (from Stories 3.5-3.7)

- **Upload pattern — CRITICAL**: Stimulus image upload follows `uploadAudio` (Story 3.6), NOT `uploadDiagram` (Story 3.4). The key difference:
  - `uploadDiagram`: Returns URL only, does NOT save to DB — caller stores URL in Question's `options` JSON (per-question resource)
  - `uploadAudio`: Saves URL to `Exercise.audioUrl` in DB, returns object — hook invalidates query cache (per-exercise resource)
  - Stimulus image is per-exercise (like audio), so: service saves to DB → hook invalidates cache → ExerciseEditor refetches
  - Firebase Storage path: `exercises/{centerId}/{exerciseId}/stimulus-image/{timestamp}.{ext}`. Make file public. Return `{ stimulusImageUrl }`.
- **Service layer field handling**: `createExercise()` uses explicit field assignment (each field named in `db.exercise.create({ data: {...} })`). `updateDraftExercise()` uses conditional spread pattern (`...("field" in input && input.field !== undefined && { field: input.field })`). Both MUST be updated with all 7 autosaveable writing fields.
- **Factory routing**: Add `case "W1_TASK1_ACADEMIC": case "W2_TASK1_GENERAL": case "W3_TASK2_ESSAY":` blocks to both `QuestionEditorFactory` and `QuestionPreviewFactory`. Writing types are minimal editors — the real editing happens in `WritingTaskEditor` at exercise level.
- **Schema discriminated union**: W1/W2/W3 all use `z.null()` for both options and correctAnswer — writing-specific settings (stimulus, tone, word count) live on the Exercise model, not per-question. Do NOT duplicate exercise-level data in question options.
- **Skill-conditional UI**: Follow the `isListening` conditional pattern in `ExerciseEditor.tsx` — add `const isWriting = skill === "WRITING"` and conditionally render `WritingTaskEditor`.
- **Enum pre-existence**: W1_TASK1_ACADEMIC, W2_TASK1_GENERAL, W3_TASK2_ESSAY are already defined in both Prisma and TypeScript enums since Story 3.1. QUESTION_TYPES_BY_SKILL already has WRITING entries. DEFAULT_SECTION_TYPE already maps WRITING to W1_TASK1_ACADEMIC.
- **Single-section constraint**: Writing exercises must be limited to exactly 1 section (1 task = 1 type). Hide the "Add Section" button when `skill === "WRITING"` — check how sections are rendered in ExerciseEditor.tsx and conditionally hide the add button.
- **ExercisePreview is internal**: The `ExercisePreview` component is defined INSIDE `ExerciseEditor.tsx` (lines 69-199), not as a separate file. Add writing-specific props to its interface and conditional rendering blocks for `skill === "WRITING"`.

### Writing Is NOT Auto-Gradable

Writing tasks have NO `correctAnswer` — they use rubric-based scoring via AI suggestions (Epic 5, Story 5.1). All W1/W2/W3 entries in QuestionOptionsSchema use `z.null()` for both options and correctAnswer. The rubric display in this story is **informational only** — a lightweight static reference card showing the 4 IELTS criteria and band scale. Actual rubric scoring UI comes in Epic 5.

### Word Count Scope

Word count fields (`wordCountMin`, `wordCountMax`, `wordCountMode`) are stored on the Exercise model and displayed to students. The **live word count display** during student submission is Epic 4 scope (Story 4.1 Mobile Submission Interface). This story only handles the teacher-side configuration.

### What NOT to Build

- No student submission UI (Epic 4)
- No AI grading integration (Epic 5)
- No rubric scoring interface (Epic 5)
- No rich text editor for student responses (Epic 4)
- No timer/test conditions (Story 3.10)
- No tagging (Story 3.11)

### Previous Story Learnings (Stories 3.5-3.7)

- **Story 3.5**: Case sensitivity is exercise-level. Variant bulk import works via CSV paste. `normalizeAnswerOnSave()` trims whitespace — not relevant for Writing but pattern is established.
- **Story 3.6**: Audio upload uses exact same Firebase Storage pattern as diagram. Client-side duration extraction via HTML5 Audio API. Two-step flow: upload → extract metadata → save. **Follow this same pattern for stimulus image upload.**
- **Story 3.7**: No new components needed for Listening types — all 6 reused existing R-type editors. MatchingEditor requires both type union AND config entry. Backend is type-agnostic (JSON storage). **Writing similarly needs minimal new question-type UI since the "question" is just the prompt.**
- **Code review pattern**: Stories 3.6 and 3.7 both had code review fixes applied. Common issues: unreachable logic, duplicate case blocks, missing `onBlur` for text inputs. Keep code minimal to avoid these issues.

### Git Intelligence

Recent commits show consistent patterns:
- Commit format: `feat(exercises): implement story 3.X <description>`
- All exercise stories committed as single cohesive commits
- Code review fixes committed separately: `fix(exercises): story 3.X code review fixes`

### File Changes Summary

**New files:**
- `apps/webapp/src/features/exercises/components/WritingTaskEditor.tsx`
- `apps/webapp/src/features/exercises/components/WritingRubricDisplay.tsx`
- `apps/webapp/src/features/exercises/hooks/use-stimulus-upload.ts`

**Modified files:**
- `packages/db/prisma/schema.prisma` — Add 8 writing fields to Exercise model
- `packages/types/src/exercises.ts` — Add Writing schemas, update ExerciseSchema/Create/Update/Autosave
- `packages/types/src/exercises.test.ts` — Add Writing type tests
- `apps/backend/src/modules/exercises/exercises.service.ts` — Add uploadStimulusImage, deleteStimulusImage + update createExercise/updateDraftExercise with writing fields
- `apps/backend/src/modules/exercises/exercises.controller.ts` — Add uploadStimulusImage, deleteStimulusImage controller methods
- `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add stimulus upload tests
- `apps/backend/src/modules/exercises/exercises.routes.ts` — Add stimulus-image upload/delete routes
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Add WRITING conditional rendering, writing state variables, autosave fields, update internal ExercisePreview with writing props
- `apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx` — Add W1/W2/W3 cases
- `apps/webapp/src/features/exercises/components/question-types/QuestionPreviewFactory.tsx` — Add W1/W2/W3 cases
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated OpenAPI types (updated by sync-schema-dev)

### Project Structure Notes

- All new components follow feature-first organization under `apps/webapp/src/features/exercises/components/`
- `WritingTaskEditor` is exercise-level (like `AudioUploadEditor`), NOT inside `question-types/` directory
- `WritingRubricDisplay` is exercise-level (informational display)
- Hook goes in `hooks/` directory following existing `use-diagram-upload.ts` and `use-audio-upload.ts` patterns
- No cross-app imports — types come from `@workspace/types`, DB from `@workspace/db`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.8 Writing Task Builder]
- [Source: _bmad-output/planning-artifacts/prd.md — Section 3.1 Writing Task Types, FR13, FR42]
- [Source: _bmad-output/planning-artifacts/architecture.md — Upload patterns, Project structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Design system, Component patterns]
- [Source: project-context.md — Multi-tenancy, Route-Controller-Service, Testing rules]
- [Source: 3-6-listening-exercise-builder.md — Audio upload pattern reference]
- [Source: 3-7-listening-question-types.md — Factory routing, code review learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed webapp test: `question-editors.test.tsx` — "unimplemented types" test was using W1_TASK1_ACADEMIC which now has a handler. Updated test to use `"UNKNOWN_TYPE" as never` for default fallback, added separate test for writing type read-only notice.

### Code Review Fixes Applied
- **HIGH**: Added `.refine()` cross-field validation to `CreateExerciseSchema` and `UpdateExerciseSchema` — rejects `wordCountMax < wordCountMin`
- **MEDIUM**: Fixed `letterTone` data pollution — now sends `null` for W1/W3 exercises (only W2 sends actual tone value) in both `scheduleAutosave` and `handleSaveDraft`
- **MEDIUM**: Removed dead `sampleResponse` prop from `ExercisePreviewProps` interface and call site (was declared but never destructured)
- **MEDIUM**: Fixed misleading test description in `question-editors.test.tsx` — changed "renders plain text fallback for unsupported types" to "renders writing preview with question text and rubric note for W1"
- **MEDIUM**: Added `schema.d.ts` to File List
- **MEDIUM**: Fixed story Task 1.9 to reference `prisma db push` (correct command) instead of `prisma migrate dev`
- **MEDIUM**: Removed 4 empty `onBlur={() => {}}` handlers in `WritingTaskEditor.tsx`
- **LOW**: Removed unnecessary `as string` casts on `letterTone` and `wordCountMode` in `ExerciseEditor.tsx` load-from-exercise useEffect
- Added 4 new tests for cross-field word count validation in `exercises.test.ts`

### Second Code Review Fixes Applied
- **M1**: Added `apps/webapp/src/schema/schema.d.ts` to File List (was claimed fixed but never applied)
- **M2**: Added service-level cross-field validation for `wordCountMax >= wordCountMin` in `updateDraftExercise` — merges incoming values with existing DB state before checking, prevents partial PATCH bypass
- **M3**: Added 8 tests for `UpdateExerciseSchema` writing fields and cross-field validation in `exercises.test.ts`
- **M4**: Added W2/W3 tests for `QuestionEditorFactory` in `question-editors.test.tsx`
- **M5**: Added W2/W3 tests for `QuestionPreviewFactory` in `question-editors.test.tsx`
- **M6**: Added `aria-label="Upload stimulus image"` to drag-and-drop zone in `WritingTaskEditor.tsx`
- **M2-svc**: Added 4 service-level tests for cross-field word count validation (both-in-request, partial-max, partial-min, valid-partial) in `exercises.service.test.ts`
- **L2**: Fixed `useCallback` dependencies in `WritingTaskEditor.tsx` — use stable `mutateAsync` instead of full mutation objects

### Completion Notes List
- All 10 tasks complete with all subtasks checked
- Full test suite green: types (206), backend (387), webapp (356) = 949 total
- use-stimulus-upload.ts has expected TS errors until `pnpm --filter=webapp sync-schema-dev` is run with backend running (new routes not yet in openapi-fetch schema)

### File List
**New files:**
- `apps/webapp/src/features/exercises/components/WritingTaskEditor.tsx`
- `apps/webapp/src/features/exercises/components/WritingRubricDisplay.tsx`
- `apps/webapp/src/features/exercises/hooks/use-stimulus-upload.ts`

**Modified files:**
- `packages/db/prisma/schema.prisma`
- `packages/types/src/exercises.ts`
- `packages/types/src/exercises.test.ts`
- `apps/backend/src/modules/exercises/exercises.service.ts`
- `apps/backend/src/modules/exercises/exercises.controller.ts`
- `apps/backend/src/modules/exercises/exercises.service.test.ts`
- `apps/backend/src/modules/exercises/exercises.routes.ts`
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx`
- `apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx`
- `apps/webapp/src/features/exercises/components/question-types/QuestionPreviewFactory.tsx`
- `apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx`
- `apps/webapp/src/schema/schema.d.ts`
