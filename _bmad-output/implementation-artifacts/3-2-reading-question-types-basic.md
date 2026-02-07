# Story 3.2: Reading Question Types - Basic (R1-R8)

Status: done

## Story

As a Teacher,
I want to create reading exercises with type-specific question editors for basic IELTS Reading types (R1-R8),
so that my students can practice with realistic, auto-gradable question formats.

## Acceptance Criteria

1. **AC1: MCQ Single (R1)** - When section type is R1_MCQ_SINGLE, teacher can add questions with 3-4 options (A-D), mark one correct answer. Student UI renders radio buttons. Auto-grade: exact match.
2. **AC2: MCQ Multi (R2)** - When section type is R2_MCQ_MULTI, teacher can add questions with 4-5 options (A-E), mark 2-3 correct answers, set `maxSelections`. Student UI renders checkboxes with selection limit. Auto-grade: all correct = full marks.
3. **AC3: True/False/Not Given (R3)** - When section type is R3_TFNG, teacher adds statement questions. Each question has exactly 3 options: True, False, Not Given. Student UI renders 3-option radio group per statement. Auto-grade: exact match.
4. **AC4: Yes/No/Not Given (R4)** - When section type is R4_YNNG, teacher adds opinion-based statement questions. Identical UI to R3 but with labels: Yes, No, Not Given. Auto-grade: exact match.
5. **AC5: Sentence Completion (R5)** - When section type is R5_SENTENCE_COMPLETION, teacher enters sentence with blank (___), sets word limit (1-3 words), and defines correct answer + accepted variants. Student UI renders text input with word limit indicator. Auto-grade: normalized match.
6. **AC6: Short Answer (R6)** - When section type is R6_SHORT_ANSWER, teacher enters question text, sets word limit (1-3 words), and defines correct answer + accepted variants. Student UI renders text input with word limit. Auto-grade: normalized match.
7. **AC7: Summary Word Bank (R7)** - When section type is R7_SUMMARY_WORD_BANK, teacher enters summary text with numbered blanks, provides a word bank (list of options including distractors). Student UI renders dropdown per blank from the word bank. Auto-grade: exact match.
8. **AC8: Summary Passage (R8)** - When section type is R8_SUMMARY_PASSAGE, teacher enters summary text with blanks, sets word limit per blank. Student UI renders text inputs. Auto-grade: normalized match (same as R5/R6).

## Tasks / Subtasks

### Backend Tasks

- [x] **Task 1: Update Question Zod Schemas for type-specific options/answers** (AC: #1-8)
  - [x] 1.1 Add `MCQOptionSchema` to `packages/types/src/exercises.ts` — `{ label: string, text: string }` for MCQ options
  - [x] 1.2 Add `WordBankSchema` — `{ words: string[], blanks: { index: number, correctWord: string }[] }` for R7
  - [x] 1.3 Add `TextAnswerSchema` — `{ correctAnswer: string, acceptedVariants: string[], caseSensitive: boolean, wordLimit: number | null }` for R5/R6/R8
  - [x] 1.4 Add `TFNGAnswerSchema` — `{ correctAnswer: "TRUE" | "FALSE" | "NOT_GIVEN" }` for R3/R4
  - [x] 1.5 Create `QuestionOptionsSchema` discriminated union — branches by `questionType` to validate correct `options`/`correctAnswer` shapes per type
  - [x] 1.6 Verify existing `CreateQuestionSchema` and `UpdateQuestionSchema` — `options` and `correctAnswer` already use `z.unknown().nullable().optional()` which supports all R1-R8 JSON structures. NO CHANGE NEEDED to these schemas. The type-helper schemas from 1.1-1.5 are for editor-level type safety only, not API validation.

- [x] **Task 2: Add answer normalization utility** (AC: #5, 6, 8)
  - [x] 2.1 Create `apps/backend/src/modules/exercises/answer-utils.ts` with `normalizeAnswer(text: string): string` — trims, lowercases, collapses whitespace
  - [x] 2.2 Add `matchesAnswer(studentAnswer: string, correctAnswer: string, variants: string[], caseSensitive: boolean): boolean`
  - [x] 2.3 Add `checkWordLimit(text: string, limit: number): boolean`
  - [x] 2.4 Unit tests for answer-utils in `answer-utils.test.ts`

- [x] **Task 3: Add question validation endpoint (OPTIONAL — can defer to Story 3.5)** (AC: #1-8)
  - [x] 3.1-3.3 DEFERRED to Story 3.5 — Frontend component-level validation is the priority per story guidance.
  - Note: Frontend component-level validation is the priority. This server-side endpoint is a nice-to-have for data integrity.

### Frontend Tasks

- [x] **Task 4: Create type-specific question editor components** (AC: #1-8)
  - [x] 4.1 Create `apps/webapp/src/features/exercises/components/question-types/MCQEditor.tsx` — option list editor with add/remove, correct answer radio/checkbox selector. Shared by R1 (single) and R2 (multi).
  - [x] 4.2 Create `TFNGEditor.tsx` — statement editor with fixed 3-option correct answer selector (TRUE/FALSE/NOT_GIVEN). Shared by R3 and R4 (labels change to YES/NO/NOT_GIVEN).
  - [x] 4.3 Create `TextInputEditor.tsx` — question text + correct answer + variants list + word limit input + case sensitivity toggle. Shared by R5, R6, R8.
  - [x] 4.4 Create `WordBankEditor.tsx` — summary text with blank markers + word bank editor (add/remove words including distractors) + blank-to-word assignment. For R7.
  - [x] 4.5 Create `QuestionEditorFactory.tsx` — maps `sectionType` to the correct editor component, provides fallback to generic text editor for unimplemented types.

- [x] **Task 5: Integrate type-specific editors into QuestionSectionEditor** (AC: #1-8)
  - [x] 5.1 Add `onUpdateQuestion` callback prop to `QuestionSectionEditorProps` interface — currently only has `onCreateQuestion` and `onDeleteQuestion`. Wire to parent's `updateQuestion` from `useSections` hook (already exists in `use-sections.ts`).
  - [x] 5.2 Replace generic text input in `QuestionSectionEditor.tsx` with `QuestionEditorFactory` component
  - [x] 5.3 Pass `section.sectionType` to factory to render correct editor
  - [x] 5.4 Each editor calls `onCreateQuestion` / `onUpdateQuestion` with properly structured `options` and `correctAnswer` JSON
  - [x] 5.5 Add inline question editing (click question to expand editor, not just display text)

- [x] **Task 6: Create type-specific question preview renderers** (AC: #1-8)
  - [x] 6.1 Create `apps/webapp/src/features/exercises/components/question-types/MCQPreview.tsx` — renders radio buttons (R1) or checkboxes (R2) with options
  - [x] 6.2 Create `TFNGPreview.tsx` — renders 3-option radio group per statement (R3: T/F/NG, R4: Y/N/NG)
  - [x] 6.3 Create `TextInputPreview.tsx` — renders text input with word limit badge (R5, R6, R8)
  - [x] 6.4 Create `WordBankPreview.tsx` — renders summary paragraph with dropdown selects populated from word bank (R7)
  - [x] 6.5 Create `QuestionPreviewFactory.tsx` — maps `sectionType` to correct preview component
  - [x] 6.6 Integrate into ExercisePreview component (replace plain text question display)

- [x] **Task 7: Wire up question edit flow** (AC: #1-8)
  - [x] 7.1 Wire up edit flow in ExerciseEditor: pass `useSections().updateQuestion` as `onUpdateQuestion` prop down to `QuestionSectionEditor` → editors. Note: `updateQuestion` mutation already exists in `use-sections.ts` (lines 100-123) — DO NOT recreate it.
  - [x] 7.2 Implement expand-to-edit UX: click question row → expand inline editor pre-filled with current `options`/`correctAnswer` JSON → save changes → optimistic UI update via query invalidation

### Testing Tasks

- [x] **Task 8: Backend Tests** (AC: #1-8) — Target: >=80% line coverage for new files
  - [x] 8.1 Unit tests for `answer-utils.ts` — normalization, variant matching, word limit checking
  - [x] 8.2 Unit tests for question validation logic — each R1-R8 type validates correctly, rejects malformed data
  - [x] 8.3 Run: `pnpm --filter=backend test` — 321 tests pass (25 new)

- [x] **Task 9: Frontend Tests** (AC: #1-8) — Target: >=80% line coverage for all new `question-types/` components
  - [x] 9.1 Component tests for MCQEditor — add/remove options, select correct answer
  - [x] 9.2 Component tests for TFNGEditor — correct answer selection
  - [x] 9.3 Component tests for TextInputEditor — variant management, word limit
  - [x] 9.4 Component tests for WordBankEditor — word bank management, blank assignment
  - [x] 9.5 Component tests for QuestionEditorFactory — correct component rendering per type
  - [x] 9.6 Run: `pnpm --filter=webapp test` — 231 tests pass (26 new)

- [x] **Task 10: Schema Sync** (AC: all)
  - [x] 10.1 No new endpoints added (Task 3 deferred) — schema sync not required
  - [x] 10.2 N/A — no new endpoints to verify

## Dev Notes

### Architecture Compliance

**Backend Pattern (Route -> Controller -> Service):**
- Follow exact patterns from story 3.1: Routes define HTTP endpoints with Zod validation + `authMiddleware` + `requireRole(["OWNER", "ADMIN", "TEACHER"])`.
- Controllers extract `centerId` from `request.jwtPayload`, orchestrate service calls, return `{ data, message }`.
- Services use `getTenantedClient(this.prisma, centerId)` for ALL database operations.
- Error handling: `AppError.badRequest()`, `.notFound()` in services; `mapPrismaError()` in routes.

**Frontend Pattern (Feature-First):**
- Hooks: Use `client.PATCH` for question updates (follow `use-sections.ts` pattern).
- Components: Use `@workspace/ui` shadcn components (`Input`, `Select`, `RadioGroup`, `Checkbox`, `Badge`, `Label`).
- Feedback: `toast.success()` / `toast.error()` from `sonner`.
- Icons: `lucide-react` (`Plus`, `Trash2`, `GripVertical`, `Check`, `X`).

### Multi-Tenancy Requirements

- ALL database queries MUST go through `getTenantedClient(this.prisma, centerId)`.
- Questions inherit `centerId` from the exercise's center scope — already set in `sections.service.ts`.
- NO new Prisma models needed — `Question.options` and `Question.correctAnswer` are already `Json?` columns that accept arbitrary JSON shapes per question type.

### Database Schema — NO CHANGES NEEDED

The existing schema already supports this story:
- `Question.options Json?` — stores type-specific option structures (MCQ options array, word bank, etc.)
- `Question.correctAnswer Json?` — stores type-specific answer structures (single letter, multi-letter array, text with variants, etc.)
- `Question.wordLimit Int?` — already exists for R5/R6/R8 text input types
- `QuestionSection.sectionType IeltsQuestionType` — already has R1-R8 enum values

**NO Prisma schema changes. NO migration. NO `db:push` needed.**

### Legacy Question Handling

Existing questions from Story 3.1 may have `options: null` and `correctAnswer: null`. All editor components MUST handle null values gracefully:
- When `options` is `null`, render empty form state (e.g., MCQEditor shows zero options with an "Add Option" button).
- When `correctAnswer` is `null`, render without a pre-selected answer.
- DO NOT crash or show errors — treat null as "not yet configured" and let the teacher fill in the data.

### Question Type JSON Structures

Each question type stores structured JSON in `options` and `correctAnswer`:

**R1_MCQ_SINGLE:**
```json
{
  "options": { "items": [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, ...] },
  "correctAnswer": { "answer": "A" }
}
```

**R2_MCQ_MULTI:**
```json
{
  "options": { "items": [{"label": "A", "text": "..."}, ...], "maxSelections": 2 },
  "correctAnswer": { "answers": ["A", "C"] }
}
```

**R3_TFNG / R4_YNNG:**
```json
{
  "options": null,
  "correctAnswer": { "answer": "TRUE" }
}
```
(R4 uses "YES"/"NO"/"NOT_GIVEN" instead of "TRUE"/"FALSE"/"NOT_GIVEN")

**R5_SENTENCE_COMPLETION / R6_SHORT_ANSWER / R8_SUMMARY_PASSAGE:**
```json
{
  "options": null,
  "correctAnswer": {
    "answer": "the industrial revolution",
    "acceptedVariants": ["industrial revolution", "Industrial Revolution"],
    "caseSensitive": false
  }
}
```
`wordLimit` is stored in the `Question.wordLimit` column (not in JSON).

**R7_SUMMARY_WORD_BANK:**
```json
{
  "options": {
    "wordBank": ["climate", "population", "agriculture", "industry", "migration", "technology"],
    "summaryText": "The main factor affecting urban growth was ___1___. This led to increased ___2___ in cities."
  },
  "correctAnswer": {
    "blanks": { "1": "migration", "2": "population" }
  }
}
```

### Existing Code to Extend (DO NOT Reinvent)

| What | Location | Action |
|------|----------|--------|
| Question CRUD | `sections.service.ts` | Already handles `createQuestion()`, `updateQuestion()`, `deleteQuestion()` with `toJsonValue()` for Json fields |
| Section editor | `QuestionSectionEditor.tsx` | Replace generic text input with type-specific editor via factory |
| Exercise preview | `ExerciseEditor.tsx` (`ExercisePreview`) | Replace plain text display with type-specific preview renderers |
| Question schemas | `packages/types/src/exercises.ts` | Add type-helper schemas (not for API validation, for editor type safety) |
| Use-sections hook | `use-sections.ts` | `updateQuestion` already exists (lines 100-123) — wire it into new editor components via props. DO NOT recreate. |
| Prisma Json handling | `sections.service.ts:toJsonValue()` | Reuse for options/correctAnswer — already converts `null`/`undefined` to `Prisma.DbNull` |

### Previous Story Intelligence (Story 3.1)

**Key learnings from 3-1:**
- `createdById` FK resolution: Must resolve Firebase UID → Prisma User ID via `AuthAccount.findUnique()` (already handled in `exercises.service.ts`).
- Prisma `Json?` fields require `Prisma.DbNull` instead of `null` — use existing `toJsonValue()` helper in `sections.service.ts`.
- Tests: 276 backend tests + 205 frontend tests passing. Run `pnpm --filter=backend test` and `pnpm --filter=webapp test`.
- `TENANTED_MODELS` in `packages/db/src/tenanted-client.ts` already includes `Exercise`, `QuestionSection`, `Question`.
- Navigation config already includes Exercises entry (order: 4, icon: Library).
- Schema sync: Run `pnpm --filter=webapp sync-schema-dev` after adding new backend routes (backend must be running).

**Files established in 3-1 that this story extends:**
- `packages/types/src/exercises.ts` — Add type-helper schemas
- `apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx` — Replace generic editor
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Update preview
- `apps/webapp/src/features/exercises/hooks/use-sections.ts` — `updateQuestion` already exists, no changes needed
- `apps/backend/src/modules/exercises/sections.service.ts` — No changes needed (already handles arbitrary JSON)
- `apps/backend/src/modules/exercises/sections.routes.ts` — Add validation endpoint

### Git Intelligence

**Recent commits (relevant patterns):**
```
da9b2f8 feat(classes): inline schedule and roster management in class drawer
aab33da fix(exercises): resolve createdById FK error and broken navigation
4010823 feat(exercises): implement story 3.1 — exercise builder core & passage management
```

**Commit convention:** `feat(exercises): description` for new features, `fix(exercises): description` for fixes.

### Scope Boundaries (What NOT to Build)

- DO NOT implement answer key management UI (Story 3.5) — this story only stores answer data in JSON, not a dedicated management interface
- DO NOT implement auto-grading engine — just store answer structures; grading happens in Epic 5
- DO NOT implement student-facing question rendering — this story builds the **teacher editor** and **preview**; student submission UI is Story 4.1
- DO NOT implement drag-and-drop reordering of questions — basic add/edit/delete is sufficient
- DO NOT implement bulk question import — manual creation only
- DO NOT add new Prisma models or columns — existing `Json?` columns are sufficient
- DO NOT implement Matching types (R9-R12) — those are Story 3.3
- DO NOT implement Note/Table/Flowchart (R13) or Diagram (R14) — those are Story 3.4

### Technical Specifics

**Shadcn/UI components to use:**
- `RadioGroup` + `RadioGroupItem` — for MCQ single, TFNG/YNNG correct answer selection
- `Checkbox` — for MCQ multi correct answer selection
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` — for word bank dropdowns in preview
- `Input` — for text input answers (R5, R6, R8)
- `Badge` — for word limit indicator, word bank chips
- `Textarea` — for summary text with blanks (R7, R8)
- `Button` — for add/remove options, add/remove variants

**Blank marker format (R7/R8 summary types):**
- Canonical format: `___N___` (triple underscore + number + triple underscore)
- Parse with regex: `/___(\d+)___/g`
- Example: `"The main factor was ___1___. This led to ___2___ in cities."`
- Blanks are numbered sequentially starting from 1

**Answer normalization rules (for future auto-grading — implement utility now):**
- Trim leading/trailing whitespace
- Collapse multiple spaces to single space
- Lowercase comparison (when `caseSensitive: false`)
- Accept teacher-defined variants (e.g., "19" matches "nineteen")

### Component Tree

```
QuestionSectionEditor
├── QuestionEditorFactory (dispatches by sectionType)
│   ├── R1_MCQ_SINGLE / R2_MCQ_MULTI  → MCQEditor
│   ├── R3_TFNG / R4_YNNG             → TFNGEditor
│   ├── R5 / R6 / R8 (text-answer)    → TextInputEditor
│   └── R7_SUMMARY_WORD_BANK          → WordBankEditor
└── Question List (click row → expand inline editor)

ExercisePreview
└── QuestionPreviewFactory (dispatches by sectionType)
    ├── R1 / R2        → MCQPreview (radio / checkbox)
    ├── R3 / R4        → TFNGPreview (3-option radio)
    ├── R5 / R6 / R8   → TextInputPreview (text input + word limit badge)
    └── R7             → WordBankPreview (dropdown selects from word bank)
```

### Project Structure Notes

```
apps/webapp/src/features/exercises/
├── components/
│   ├── question-types/         # NEW — type-specific editors and previews
│   │   ├── MCQEditor.tsx       # R1 (single) + R2 (multi) editor
│   │   ├── MCQPreview.tsx      # R1 + R2 student preview
│   │   ├── TFNGEditor.tsx      # R3 (TFNG) + R4 (YNNG) editor
│   │   ├── TFNGPreview.tsx     # R3 + R4 student preview
│   │   ├── TextInputEditor.tsx # R5 + R6 + R8 editor
│   │   ├── TextInputPreview.tsx# R5 + R6 + R8 preview
│   │   ├── WordBankEditor.tsx  # R7 editor
│   │   ├── WordBankPreview.tsx # R7 preview
│   │   ├── QuestionEditorFactory.tsx  # Maps sectionType → editor
│   │   └── QuestionPreviewFactory.tsx # Maps sectionType → preview
│   ├── SkillSelector.tsx       # Existing
│   ├── ExerciseEditor.tsx      # MODIFY — integrate preview factory
│   ├── PassageEditor.tsx       # Existing (no change)
│   └── QuestionSectionEditor.tsx # MODIFY — integrate editor factory
├── hooks/
│   ├── use-exercises.ts        # Existing (no change)
│   └── use-sections.ts         # Existing (no change — updateQuestion already implemented)
├── exercises-page.tsx          # Existing (no change)
└── exercises-page.test.tsx     # Existing (no change)

apps/backend/src/modules/exercises/
├── exercises.service.ts        # Existing (no change)
├── exercises.controller.ts     # Existing (no change)
├── exercises.routes.ts         # Existing (no change)
├── sections.service.ts         # Existing (no change — already handles Json)
├── sections.controller.ts      # Existing (no change)
├── sections.routes.ts          # MODIFY — add validation endpoint
├── answer-utils.ts             # NEW — answer normalization utilities
├── answer-utils.test.ts        # NEW — tests for answer normalization
├── exercises.service.test.ts   # Existing
└── sections.service.test.ts    # Existing
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Section 3.1 IELTS Exercise Type Taxonomy — R1-R8 specifications]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- [Source: _bmad-output/implementation-artifacts/3-1-exercise-builder-core-passage-management.md#Dev Notes]
- [Source: project-context.md#Critical Implementation Rules]
- [Source: packages/types/src/exercises.ts — Current Zod schemas]
- [Source: apps/backend/src/modules/exercises/sections.service.ts — Current question CRUD]
- [Source: apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx — Current generic editor]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered. Task 3 (validation endpoint) deferred to Story 3.5 per story guidance.

### Completion Notes List

- Task 1: Added 12 type-helper Zod schemas (MCQOptionSchema, MCQOptionsSchema, MCQMultiOptionsSchema, MCQSingleAnswerSchema, MCQMultiAnswerSchema, TFNGAnswerSchema, YNNGAnswerSchema, TextAnswerSchema, WordBankOptionsSchema, WordBankAnswerSchema, QuestionOptionsSchema discriminated union) + 43 tests. Verified existing CreateQuestionSchema/UpdateQuestionSchema already support R1-R8 JSON via z.unknown().
- Task 2: Created answer-utils.ts with normalizeAnswer(), matchesAnswer(), checkWordLimit() + 25 unit tests. Handles case sensitivity, variant matching, whitespace normalization.
- Task 3: DEFERRED to Story 3.5 — server-side validation endpoint is optional; frontend component-level validation is priority.
- Task 4: Created 5 editor components — MCQEditor (R1/R2 with radio/checkbox), TFNGEditor (R3/R4 with T/F/NG or Y/N/NG), TextInputEditor (R5/R6/R8 with variants + word limit), WordBankEditor (R7 with summary text blanks + word bank + blank assignment), QuestionEditorFactory (dispatches by sectionType with fallback).
- Task 5: Added onUpdateQuestion prop to QuestionSectionEditor, integrated QuestionEditorFactory, added expand-to-edit UX (click question row → expand inline editor → edit options/correctAnswer → auto-save via query invalidation).
- Task 6: Created 5 preview components — MCQPreview (radio/checkbox), TFNGPreview (3-option radio), TextInputPreview (text input + word limit badge), WordBankPreview (summary with dropdown selects), QuestionPreviewFactory. Integrated into ExercisePreview.
- Task 7: Wired updateQuestion from useSections hook → ExerciseEditor → QuestionSectionEditor → editors. Did NOT recreate the mutation.
- Task 8: 321 backend tests pass (25 new answer-utils + schema validation tests).
- Task 9: 245 webapp tests pass (40 editor + preview component tests).
- Task 10: No schema sync needed — no new endpoints added.
- All editors handle null options/correctAnswer gracefully (legacy question support).
- Code Review: Fixed 8 issues — (1) MCQEditor: single RadioGroup wrapping all items, (2) answer remapping on option remove, (3) 500ms debounce for question edits, (4) runtime safeParse in QuestionEditorFactory using type-helper schemas, (5) word bank duplicate prevention, (6) scoped radio IDs in TFNGEditor, (7) 14 preview component tests added, (8) maxSelections derived from props.

### Change Log

- 2026-02-07: Implemented story 3.2 — type-specific question editors and previews for R1-R8 IELTS reading types
- 2026-02-07: Code review fixes (8 findings) — RadioGroup semantics, answer remapping on remove, debounced API calls, runtime safeParse validation, word bank dedup, scoped TFNGEditor radio IDs, preview component tests, maxSelections state drift

### File List

**New files:**
- packages/types/src/exercises.test.ts
- apps/backend/src/modules/exercises/answer-utils.ts
- apps/backend/src/modules/exercises/answer-utils.test.ts
- apps/webapp/src/features/exercises/components/question-types/MCQEditor.tsx
- apps/webapp/src/features/exercises/components/question-types/MCQPreview.tsx
- apps/webapp/src/features/exercises/components/question-types/TFNGEditor.tsx
- apps/webapp/src/features/exercises/components/question-types/TFNGPreview.tsx
- apps/webapp/src/features/exercises/components/question-types/TextInputEditor.tsx
- apps/webapp/src/features/exercises/components/question-types/TextInputPreview.tsx
- apps/webapp/src/features/exercises/components/question-types/WordBankEditor.tsx
- apps/webapp/src/features/exercises/components/question-types/WordBankPreview.tsx
- apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx
- apps/webapp/src/features/exercises/components/question-types/QuestionPreviewFactory.tsx
- apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx

**Modified files:**
- packages/types/src/exercises.ts (added type-helper schemas)
- apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx (added onUpdateQuestion, inline editing, factory integration)
- apps/webapp/src/features/exercises/components/ExerciseEditor.tsx (wired updateQuestion, integrated preview factory)
