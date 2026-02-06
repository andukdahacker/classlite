# Story 3.2: Reading Question Types - Basic (R1-R8)

Status: ready-for-dev

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

- [ ] **Task 1: Update Question Zod Schemas for type-specific options/answers** (AC: #1-8)
  - [ ] 1.1 Add `MCQOptionSchema` to `packages/types/src/exercises.ts` — `{ label: string, text: string }` for MCQ options
  - [ ] 1.2 Add `WordBankSchema` — `{ words: string[], blanks: { index: number, correctWord: string }[] }` for R7
  - [ ] 1.3 Add `TextAnswerSchema` — `{ correctAnswer: string, acceptedVariants: string[], caseSensitive: boolean, wordLimit: number | null }` for R5/R6/R8
  - [ ] 1.4 Add `TFNGAnswerSchema` — `{ correctAnswer: "TRUE" | "FALSE" | "NOT_GIVEN" }` for R3/R4
  - [ ] 1.5 Create `QuestionOptionsSchema` discriminated union — branches by `questionType` to validate correct `options`/`correctAnswer` shapes per type
  - [ ] 1.6 Update `CreateQuestionSchema` to accept type-specific `options` and `correctAnswer` as `z.unknown()` (keep flexible) — validation happens at application level, not schema level, because the JSON column stores arbitrary shapes

- [ ] **Task 2: Add answer normalization utility** (AC: #5, 6, 8)
  - [ ] 2.1 Create `apps/backend/src/modules/exercises/answer-utils.ts` with `normalizeAnswer(text: string): string` — trims, lowercases, collapses whitespace
  - [ ] 2.2 Add `matchesAnswer(studentAnswer: string, correctAnswer: string, variants: string[], caseSensitive: boolean): boolean`
  - [ ] 2.3 Add `checkWordLimit(text: string, limit: number): boolean`
  - [ ] 2.4 Unit tests for answer-utils in `answer-utils.test.ts`

- [ ] **Task 3: Add question validation endpoint (OPTIONAL — can defer to Story 3.5)** (AC: #1-8)
  - [ ] 3.1 Add `POST /api/v1/exercises/:exerciseId/sections/:sectionId/questions/validate` route
  - [ ] 3.2 Validates that `options` and `correctAnswer` shapes match the section's `sectionType`
  - [ ] 3.3 Returns validation errors (e.g., "MCQ must have at least 2 options", "Correct answer must be one of the options")
  - Note: Frontend component-level validation is the priority. This server-side endpoint is a nice-to-have for data integrity.

### Frontend Tasks

- [ ] **Task 4: Create type-specific question editor components** (AC: #1-8)
  - [ ] 4.1 Create `apps/webapp/src/features/exercises/components/question-types/MCQEditor.tsx` — option list editor with add/remove, correct answer radio/checkbox selector. Shared by R1 (single) and R2 (multi).
  - [ ] 4.2 Create `TFNGEditor.tsx` — statement editor with fixed 3-option correct answer selector (TRUE/FALSE/NOT_GIVEN). Shared by R3 and R4 (labels change to YES/NO/NOT_GIVEN).
  - [ ] 4.3 Create `TextInputEditor.tsx` — question text + correct answer + variants list + word limit input + case sensitivity toggle. Shared by R5, R6, R8.
  - [ ] 4.4 Create `WordBankEditor.tsx` — summary text with blank markers + word bank editor (add/remove words including distractors) + blank-to-word assignment. For R7.
  - [ ] 4.5 Create `QuestionEditorFactory.tsx` — maps `sectionType` to the correct editor component, provides fallback to generic text editor for unimplemented types.

- [ ] **Task 5: Integrate type-specific editors into QuestionSectionEditor** (AC: #1-8)
  - [ ] 5.1 Add `onUpdateQuestion` callback prop to `QuestionSectionEditorProps` interface — currently only has `onCreateQuestion` and `onDeleteQuestion`. Wire to parent's `updateQuestion` from `useSections` hook (already exists in `use-sections.ts`).
  - [ ] 5.2 Replace generic text input in `QuestionSectionEditor.tsx` with `QuestionEditorFactory` component
  - [ ] 5.3 Pass `section.sectionType` to factory to render correct editor
  - [ ] 5.4 Each editor calls `onCreateQuestion` / `onUpdateQuestion` with properly structured `options` and `correctAnswer` JSON
  - [ ] 5.5 Add inline question editing (click question to expand editor, not just display text)

- [ ] **Task 6: Create type-specific question preview renderers** (AC: #1-8)
  - [ ] 6.1 Create `apps/webapp/src/features/exercises/components/question-types/MCQPreview.tsx` — renders radio buttons (R1) or checkboxes (R2) with options
  - [ ] 6.2 Create `TFNGPreview.tsx` — renders 3-option radio group per statement (R3: T/F/NG, R4: Y/N/NG)
  - [ ] 6.3 Create `TextInputPreview.tsx` — renders text input with word limit badge (R5, R6, R8)
  - [ ] 6.4 Create `WordBankPreview.tsx` — renders summary paragraph with dropdown selects populated from word bank (R7)
  - [ ] 6.5 Create `QuestionPreviewFactory.tsx` — maps `sectionType` to correct preview component
  - [ ] 6.6 Integrate into ExercisePreview component (replace plain text question display)

- [ ] **Task 7: Wire up question edit flow** (AC: #1-8)
  - [ ] 7.1 Wire up edit flow in ExerciseEditor: pass `useSections().updateQuestion` as `onUpdateQuestion` prop down to `QuestionSectionEditor` → editors. Note: `updateQuestion` mutation already exists in `use-sections.ts` (lines 100-123) — DO NOT recreate it.
  - [ ] 7.2 Implement expand-to-edit UX: click question row → expand inline editor pre-filled with current `options`/`correctAnswer` JSON → save changes → optimistic UI update via query invalidation

### Testing Tasks

- [ ] **Task 8: Backend Tests** (AC: #1-8)
  - [ ] 8.1 Unit tests for `answer-utils.ts` — normalization, variant matching, word limit checking
  - [ ] 8.2 Unit tests for question validation logic — each R1-R8 type validates correctly, rejects malformed data
  - [ ] 8.3 Run: `pnpm --filter=backend test`

- [ ] **Task 9: Frontend Tests** (AC: #1-8)
  - [ ] 9.1 Component tests for MCQEditor — add/remove options, select correct answer
  - [ ] 9.2 Component tests for TFNGEditor — correct answer selection
  - [ ] 9.3 Component tests for TextInputEditor — variant management, word limit
  - [ ] 9.4 Component tests for WordBankEditor — word bank management, blank assignment
  - [ ] 9.5 Component tests for QuestionEditorFactory — correct component rendering per type
  - [ ] 9.6 Run: `pnpm --filter=webapp test`

- [ ] **Task 10: Schema Sync** (AC: all)
  - [ ] 10.1 Run `pnpm --filter=webapp sync-schema-dev` if new endpoints added
  - [ ] 10.2 Verify new endpoints appear in `schema.d.ts`

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

### Debug Log References

### Completion Notes List

### File List
