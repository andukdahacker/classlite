# Story 3.9: Speaking Exercise Builder

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to create IELTS Speaking exercises with structured parts (Part 1 Q&A, Part 2 Cue Card, Part 3 Discussion),
so that students can practice realistic speaking test formats with configurable recording limits and timers.

## Acceptance Criteria

1. **AC1: Part 1 Questions (S1)** — Create a list of short questions (4-5 questions, ~1 min each). Student records answer per question.
2. **AC2: Part 2 Cue Card (S2)** — Create cue card with topic and bullet points. Configure 1-min prep timer + 1-2 min speaking timer. Single recording.
3. **AC3: Part 3 Discussion (S3)** — Create follow-up discussion questions (4-5 questions). Student records per question.
4. **AC4: Audio Recording** — Student interface has record/stop/playback. Recordings saved as MP3.
5. **AC5: Recording Limits** — Set maximum recording duration per question. Auto-stop at limit.
6. **AC6: Transcript Generation** — Optional AI transcription of recordings for grading assistance.

## Scope Clarification — Teacher-Side Builder ONLY

**This story builds the TEACHER-SIDE exercise creation UI only.** The following are OUT OF SCOPE:

- **Student audio recording UI** (AC4) — This is Epic 4 (Student Submission). The builder only configures recording parameters (max duration, limits). The actual MediaRecorder/recording implementation is NOT in this story.
- **AI transcription** (AC6) — This is Epic 5 (AI Grading). The builder adds a `enableTranscription` toggle but the actual transcription pipeline is NOT in this story.
- **Timer countdown UI** — Story 3.10 (Timer & Test Conditions). The builder only stores prep/speaking timer durations.
- **Student submission interface** — Epic 4.
- **AI grading/rubric scoring** — Epic 5.
- **Tagging** — Story 3.11.

**What IS built:** Question editors for S1/S2/S3, speaking-specific exercise settings (recording limits, prep timer, speaking timer), Prisma schema fields, TypeScript schemas, factory routing, ExerciseEditor integration, preview components, and tests.

## Tasks / Subtasks

### Task 1: Prisma Schema — Add Speaking-Specific Fields (AC: 1, 2, 3, 5, 6)

- [x] 1.1 Add `speakingPrepTime` (Int?, `@map("speaking_prep_time")`) to Exercise model — S2 cue card prep time in seconds (default 60)
- [x] 1.2 Add `speakingTime` (Int?, `@map("speaking_time")`) to Exercise model — S2 cue card speaking duration in seconds (default 120)
- [x] 1.3 Add `maxRecordingDuration` (Int?, `@map("max_recording_duration")`) to Exercise model — max seconds per question recording (applies to S1/S3)
- [x] 1.4 Add `enableTranscription` (Boolean, `@default(false)`, `@map("enable_transcription")`) to Exercise model — future AI transcription toggle
- [x] 1.5 Run `npx prisma db push` to apply schema changes to dev database
- [x] 1.6 Verify migration applies cleanly

### Task 2: TypeScript Schemas — Speaking Types (AC: 1, 2, 3, 5, 6)

- [x] 2.1 In `packages/types/src/exercises.ts`, add `SpeakingCueCardSchema = z.object({ topic: z.string().min(1), bulletPoints: z.array(z.string().min(1)).min(1).max(6) })` — S2 cue card structured data stored in Question `options` JSON
- [x] 2.2 Add S1, S2, S3 entries to `QuestionOptionsSchema` discriminated union:
  ```
  // S1: Part 1 Q&A — no structured options, questions are individual Question rows with questionText
  z.object({ questionType: z.literal("S1_PART1_QA"), options: z.null(), correctAnswer: z.null() })
  // S2: Cue Card — options hold the cue card structure (topic + bullet points)
  z.object({ questionType: z.literal("S2_PART2_CUE_CARD"), options: SpeakingCueCardSchema, correctAnswer: z.null() })
  // S3: Discussion — no structured options, questions are individual Question rows with questionText
  z.object({ questionType: z.literal("S3_PART3_DISCUSSION"), options: z.null(), correctAnswer: z.null() })
  ```
- [x] 2.3 Add speaking fields to `ExerciseSchema`: `speakingPrepTime`, `speakingTime`, `maxRecordingDuration`, `enableTranscription`
- [x] 2.4 Add speaking fields to `CreateExerciseSchema` (all optional/nullable except `enableTranscription` which is optional boolean)
- [x] 2.5 Add speaking fields to `UpdateExerciseSchema` (same pattern)
- [x] 2.6 Add speaking fields to `AutosaveExerciseSchema` — `speakingPrepTime`, `speakingTime`, `maxRecordingDuration`, `enableTranscription` (4 fields)

### Task 3: Backend — Service & Route Updates (AC: 1, 2, 3, 5, 6)

- [x] 3.1 Update `createExercise` in `exercises.service.ts` — add explicit field assignments for 4 speaking fields in `db.exercise.create({ data: {...} })`:
  ```
  speakingPrepTime: input.speakingPrepTime ?? null,
  speakingTime: input.speakingTime ?? null,
  maxRecordingDuration: input.maxRecordingDuration ?? null,
  enableTranscription: input.enableTranscription ?? false,
  ```
- [x] 3.2 Update `updateDraftExercise` in `exercises.service.ts` — add conditional spread operators for speaking fields:
  ```
  ...("speakingPrepTime" in input && input.speakingPrepTime !== undefined && { speakingPrepTime: input.speakingPrepTime }),
  ...("speakingTime" in input && input.speakingTime !== undefined && { speakingTime: input.speakingTime }),
  ...("maxRecordingDuration" in input && input.maxRecordingDuration !== undefined && { maxRecordingDuration: input.maxRecordingDuration }),
  ...("enableTranscription" in input && input.enableTranscription !== undefined && { enableTranscription: input.enableTranscription }),
  ```
- [x] 3.3 No new routes needed — speaking fields are persisted via existing create/update/autosave endpoints. No file upload required for speaking (unlike audio/stimulus image).

### Task 4: Frontend — SpeakingTaskEditor Component (AC: 1, 2, 3, 5, 6)

- [x] 4.1 Create `apps/webapp/src/features/exercises/components/SpeakingTaskEditor.tsx` — exercise-level editor (like `WritingTaskEditor`, NOT in `question-types/`)
  - Contains:
    - **S2 Cue Card Settings** (shown when first section is S2): Prep timer input (default 60s), Speaking timer input (default 120s)
    - **Recording Settings** (shown for all S-types): Max recording duration per question (default 60s for S1/S3, 120s for S2), Enable transcription toggle
    - **Info banner**: "Speaking exercises allow students to record audio responses. Recording playback and AI transcription are configured here."
  - The component receives exercise data + first section type to determine variant
- [x] 4.2 Props interface: `exerciseId`, `sectionType` (first section type for S1/S2/S3 detection), `speakingPrepTime`, `speakingTime`, `maxRecordingDuration`, `enableTranscription`, and `onChange` callbacks for each field

### Task 5: Frontend — Speaking Question Editors (AC: 1, 2, 3)

- [x] 5.1 Create `apps/webapp/src/features/exercises/components/question-types/SpeakingCueCardEditor.tsx` — S2 cue card editor:
  - Topic text input
  - Bullet point list with add/remove/reorder (1-6 items)
  - Saves structured data to Question `options` field as `{ topic, bulletPoints }`
- [x] 5.2 Add S1, S2, S3 cases to `QuestionEditorFactory.tsx`:
  - S1_PART1_QA: Simple read-only notice "Part 1 questions are individual items. Add questions below using the question text field." (like Writing, the questions are just `questionText` rows)
  - S2_PART2_CUE_CARD: Render `<SpeakingCueCardEditor>` — edits the cue card topic + bullet points stored in `options`
  - S3_PART3_DISCUSSION: Same as S1 — simple notice "Discussion questions are individual items."
- [x] 5.3 Add S1, S2, S3 cases to `QuestionPreviewFactory.tsx`:
  - S1: Display question text with "Record your answer (~1 minute)" note
  - S2: Display cue card layout (topic bold, bullet points indented) with "Preparation: X min | Speaking: Y min" from exercise settings
  - S3: Display question text with "Record your answer" note

### Task 6: Frontend — ExerciseEditor Integration (AC: 1, 2, 3, 5, 6)

- [x] 6.1 In `ExerciseEditor.tsx`, add `const isSpeaking = selectedSkill === "SPEAKING"` alongside existing `isListening`/`isWriting`
- [x] 6.2 Add useState hooks for 4 speaking fields: `speakingPrepTime`, `speakingTime`, `maxRecordingDuration`, `enableTranscription`. Load from exercise data in the existing useEffect that loads fields from `exercise`.
- [x] 6.3 Add SPEAKING conditional block between the WRITING block and Passage Editor:
  ```tsx
  {isSpeaking && isEditing && id && (
    <div className="max-w-3xl">
      <SpeakingTaskEditor
        exerciseId={id}
        sectionType={exercise?.sections?.[0]?.sectionType ?? null}
        speakingPrepTime={speakingPrepTime}
        speakingTime={speakingTime}
        maxRecordingDuration={maxRecordingDuration}
        enableTranscription={enableTranscription}
        onSpeakingPrepTimeChange={(v) => { setSpeakingPrepTime(v); userHasEdited.current = true; }}
        onSpeakingTimeChange={(v) => { setSpeakingTime(v); userHasEdited.current = true; }}
        onMaxRecordingDurationChange={(v) => { setMaxRecordingDuration(v); userHasEdited.current = true; }}
        onEnableTranscriptionChange={(v) => { setEnableTranscription(v); userHasEdited.current = true; }}
      />
    </div>
  )}
  ```
- [x] 6.4 Hide PassageEditor for SPEAKING: Update `showPassage` to `selectedSkill === "READING" || selectedSkill === "LISTENING"` (already excludes SPEAKING — verify this is still the case)
- [x] 6.5 Hide AudioUploadEditor for SPEAKING (teacher doesn't upload pre-recorded audio for speaking exercises)
- [x] 6.6 For SPEAKING, limit to exactly 1 section: Hide "Add Section" button when `isSpeaking` (same pattern as `isWriting`). Update line 826: `{!isWriting && !isSpeaking && (`
- [x] 6.7 Include speaking fields in `scheduleAutosave` payload and the `handleSaveDraft` function:
  ```
  speakingPrepTime: speakingPrepTime,
  speakingTime: speakingTime,
  maxRecordingDuration: maxRecordingDuration,
  enableTranscription: enableTranscription,
  ```
- [x] 6.8 Update `ExercisePreview` to handle SPEAKING: Add `isSpeaking` check, display speaking-specific metadata (prep time, speaking time, recording limit) in preview header. Add speaking props to `ExercisePreviewProps`.
- [x] 6.9 Extend the auto-create section `useEffect` (currently WRITING-only at ~line 387) to also trigger for `exercise.skill === "SPEAKING"`, using `DEFAULT_SECTION_TYPE["SPEAKING"]` (`S1_PART1_QA`) as the initial section type. The `DEFAULT_SECTION_TYPE` mapping already exists at line 66, but the useEffect condition must be updated to include SPEAKING alongside WRITING.

### Task 7: Frontend — Answer Key Settings for Speaking (AC: 1, 2, 3)

- [x] 7.1 Hide Answer Key Settings for SPEAKING exercises (speaking is rubric-graded like writing — no case sensitivity or partial credit applies). Add `!isSpeaking` guard similar to `!isWriting` if not already excluded.

### Task 8: Tests (AC: all)

- [x] 8.1 `packages/types/src/exercises.test.ts` — Add tests for:
  - QuestionOptionsSchema with S1, S2, S3 entries (S1/S3 null options+null correctAnswer, S2 with SpeakingCueCardSchema options+null correctAnswer)
  - SpeakingCueCardSchema validation (valid topic+bullets accepted, empty rejected, >6 bullets rejected)
  - ExerciseSchema with new speaking fields
  - CreateExerciseSchema/UpdateExerciseSchema with speaking fields
- [x] 8.2 `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add tests for:
  - createExercise with speaking fields (verifies fields are passed through to Prisma)
  - updateDraftExercise with speaking fields (conditional spread pattern)
- [x] 8.3 `apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx` — Add tests for:
  - S1 renders read-only notice
  - S2 renders SpeakingCueCardEditor
  - S3 renders read-only notice
  - S2 preview renders cue card layout
- [x] 8.4 Run full test suite: `pnpm --filter=types test && pnpm --filter=backend test && pnpm --filter=webapp test` — all green

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: No new routes needed. Speaking fields use existing create/update/autosave endpoints. No file upload for speaking builder.
- **Multi-tenancy**: All queries use `getTenantedClient(centerId)`. No new storage paths.
- **Zod validation**: All new fields validated via type schemas. S2 cue card options validated via `SpeakingCueCardSchema`.

### Key Implementation Patterns (from Stories 3.6-3.8)

- **Skill-conditional UI**: Follow the `isListening`/`isWriting` pattern in `ExerciseEditor.tsx`. Add `const isSpeaking = selectedSkill === "SPEAKING"` and conditionally render `SpeakingTaskEditor`.
- **Single-section constraint**: Speaking exercises must be limited to exactly 1 section (1 speaking part per exercise). Hide "Add Section" when `isSpeaking` — update line 826 from `{!isWriting && (` to `{!isWriting && !isSpeaking && (`.
- **Factory routing**: Add `case "S1_PART1_QA": case "S2_PART2_CUE_CARD": case "S3_PART3_DISCUSSION":` blocks to both `QuestionEditorFactory` and `QuestionPreviewFactory`. S1 and S3 are minimal editors (like Writing). S2 is the only type needing a custom editor component.
- **Schema discriminated union**: S1/S3 use `z.null()` for both options and correctAnswer (like W1/W2/W3). S2 uses `SpeakingCueCardSchema` for options (structured cue card data stored in Question's `options` JSON column) and `z.null()` for correctAnswer. Speaking is rubric-graded, not auto-graded.
- **Enum pre-existence**: S1_PART1_QA, S2_PART2_CUE_CARD, S3_PART3_DISCUSSION already exist in both Prisma `IeltsQuestionType` enum (lines 415-417) and TypeScript `IeltsQuestionTypeSchema` (lines 69-71). `QUESTION_TYPES_BY_SKILL` already has SPEAKING entries in `QuestionSectionEditor.tsx` (lines 59-61). `DEFAULT_SECTION_TYPE` already maps `SPEAKING: "S1_PART1_QA"` (line 66).
- **Service layer field handling**: `createExercise()` uses explicit field assignment. `updateDraftExercise()` uses conditional spread pattern. Both MUST be updated with all 4 speaking fields.
- **ExercisePreview is internal**: Defined INSIDE `ExerciseEditor.tsx` (starting ~line 95). Add speaking props to `ExercisePreviewProps` interface.
- **Upload pattern NOT needed**: Unlike Listening (audio upload) and Writing (stimulus image upload), Speaking builder has NO file upload. All configuration is text/number fields persisted via autosave.

### S2 Cue Card Data Architecture

The S2 cue card has structured data (topic + bullet points) that must be stored somewhere. Architecture decision:
- **Store in Question `options` JSON column** — This is consistent with how R7 word bank, R9-R12 matching options, R13 note/table, and R14 diagram labels store structured data per-question.
- The S2 section has exactly 1 question. That question's `options` field holds `{ topic: string, bulletPoints: string[] }`.
- The `SpeakingCueCardEditor` component reads/writes to this `options` field via `handleUpdateQuestion`.

### Speaking Is NOT Auto-Gradable

Like Writing, Speaking tasks have NO `correctAnswer` — they use rubric-based scoring via AI suggestions (Epic 5). All S1/S2/S3 entries use `z.null()` for correctAnswer. Answer Key Settings (case sensitivity, partial credit) should be hidden for SPEAKING exercises.

### What NOT to Build

- No student audio recording/MediaRecorder (Epic 4 — Student Submission)
- No AI transcription pipeline (Epic 5 — AI Grading)
- No timer countdown UI (Story 3.10 — Timer & Test Conditions)
- No band descriptor rubric display (unlike Writing 3.8 — Speaking rubrics come in Epic 5)
- No tagging (Story 3.11)
- No exercise library management (Story 3.14)

### Previous Story Learnings (Stories 3.6-3.8)

- **Story 3.6**: Audio upload follows Firebase Storage pattern. Not relevant for Speaking builder (no file upload), but student recordings in Epic 4 will follow this pattern.
- **Story 3.7**: Listening types L1-L6 all reused existing R-type editors. Backend is type-agnostic (JSON storage). **Speaking similarly needs minimal new question-type UI** — S1/S3 are just `questionText` rows (no custom editor), only S2 needs a custom cue card editor.
- **Story 3.8**: Writing pattern is the closest model for Speaking:
  - Single-section constraint ✓
  - Exercise-level settings editor ✓
  - Null options + null correctAnswer for most types ✓
  - Factory routing with simple read-only notices ✓
  - Hide PassageEditor/AudioUploadEditor ✓
  - Code review caught: empty `onBlur` handlers, dead props, missing tests for all variants. **Avoid these issues.**
- **Common code review issues from 3.6-3.8**: Unreachable logic, duplicate case blocks, missing `onBlur`, dead props declared but not destructured, missing test coverage for all type variants. Keep code minimal.

### Git Intelligence

Recent commits show consistent patterns:
- Commit format: `feat(exercises): implement story 3.X <description>`
- Single cohesive commits per story
- Code review fixes committed separately: `fix(exercises): story 3.X code review fixes`

### File Changes Summary

**New files:**
- `apps/webapp/src/features/exercises/components/SpeakingTaskEditor.tsx`
- `apps/webapp/src/features/exercises/components/question-types/SpeakingCueCardEditor.tsx`

**Modified files:**
- `packages/db/prisma/schema.prisma` — Add 4 speaking fields to Exercise model
- `packages/types/src/exercises.ts` — Add SpeakingCueCardSchema, S1/S2/S3 to QuestionOptionsSchema, update ExerciseSchema/Create/Update/Autosave
- `packages/types/src/exercises.test.ts` — Add Speaking type tests
- `apps/backend/src/modules/exercises/exercises.service.ts` — Update createExercise/updateDraftExercise with speaking fields
- `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add speaking field tests
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Add SPEAKING conditional rendering, speaking state variables, autosave fields, update ExercisePreview
- `apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx` — Add S1/S2/S3 cases
- `apps/webapp/src/features/exercises/components/question-types/QuestionPreviewFactory.tsx` — Add S1/S2/S3 cases
- `apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx` — Add S1/S2/S3 tests
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated (updated by sync-schema-dev)

### Project Structure Notes

- `SpeakingTaskEditor` is exercise-level (like `WritingTaskEditor`, `AudioUploadEditor`) — lives in `apps/webapp/src/features/exercises/components/`, NOT inside `question-types/`
- `SpeakingCueCardEditor` is a question-type editor — lives in `apps/webapp/src/features/exercises/components/question-types/`
- No cross-app imports — types from `@workspace/types`, DB from `@workspace/db`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.9 Speaking Exercise Builder]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project structure, API patterns]
- [Source: project-context.md — Multi-tenancy, Route-Controller-Service, Testing rules]
- [Source: 3-8-writing-task-builder.md — Single-section pattern, factory routing, code review learnings]
- [Source: packages/types/src/exercises.ts — Existing enums and schema patterns]
- [Source: packages/db/prisma/schema.prisma — Exercise model, IeltsQuestionType enum]
- [Source: apps/webapp/src/features/exercises/components/ExerciseEditor.tsx — Skill-conditional rendering patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- All 8 tasks completed successfully
- All tests green: types (231 passed), backend (391 passed), webapp (364 passed)
- Followed Writing (3.8) pattern for single-section constraint, factory routing, and exercise-level settings
- S1/S3 use minimal read-only notices (like W1/W2/W3); S2 has custom SpeakingCueCardEditor
- Speaking fields persist via existing create/update/autosave endpoints — no new routes needed
- No file upload required for speaking builder (unlike Listening audio upload)

### File List

**New files:**
- `apps/webapp/src/features/exercises/components/SpeakingTaskEditor.tsx`
- `apps/webapp/src/features/exercises/components/question-types/SpeakingCueCardEditor.tsx`

**Modified files:**
- `packages/db/prisma/schema.prisma`
- `packages/types/src/exercises.ts`
- `packages/types/src/exercises.test.ts`
- `apps/backend/src/modules/exercises/exercises.service.ts`
- `apps/backend/src/modules/exercises/exercises.service.test.ts`
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx`
- `apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx`
- `apps/webapp/src/features/exercises/components/question-types/QuestionPreviewFactory.tsx`
- `apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx`
