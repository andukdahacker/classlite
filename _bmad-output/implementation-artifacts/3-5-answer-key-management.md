# Story 3.5: Answer Key Management

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to define flexible answer keys with acceptable variants,
so that auto-grading handles spelling differences and synonyms fairly.

## Acceptance Criteria

1. **AC1: Primary Answer** — Each blank/question has one primary correct answer. This is already stored in the `correctAnswer` JSON field. The answer key management UI must surface and make editable the primary answer for all question types that support text-based answers (R5, R6, R8, R13, R14 without word bank).
2. **AC2: Accepted Variants** — Teacher can add alternative accepted answers (e.g., "19" also accepts "nineteen", "UK" also accepts "United Kingdom"). Variants are stored in the `acceptedVariants` array within `correctAnswer`. The UI must allow adding/removing variants for each answer blank. This applies to Reading question types R5, R6, R8, and R13 (note/table/flowchart blanks). R14 without word bank also supports variants. MCQ (R1, R2), TFNG (R3, R4), word bank (R7), matching (R9-R12), and R14 with word bank use exact match and do NOT need variants. **Listening scope note:** Listening types L1 (Form Completion), L5 (Sentence Completion), and L6 (Short Answer) also use normalized matching per PRD — variant support for Listening is deferred to Stories 3.6-3.7 when Listening infrastructure is built. The AnswerVariantManager component created here will be reusable for those stories.
3. **AC3: Case Sensitivity** — Toggle per exercise: case-sensitive or case-insensitive matching. Default: insensitive. A new `caseSensitive` boolean field is added to the Exercise model. **Precedence rule:** The exercise-level `caseSensitive` is the single source of truth for grading. The per-question `caseSensitive` field that currently exists in `TextAnswerSchema` is **deprecated** — remove it from the schema and from TextInputEditor. The grading engine reads `Exercise.caseSensitive` and passes it to `matchesAnswer()`. This eliminates conflicting settings between exercise-level and question-level.
4. **AC4: Whitespace Handling** — Leading/trailing spaces automatically trimmed. Internal spacing normalized. The backend `normalizeAnswer()` function already implements this. This AC is already satisfied by existing code — this story documents the behavior in the UI with a help tooltip and ensures all answer storage normalizes on save.
5. **AC5: Word Order** — For multi-word answers, toggle for strict order vs any order. A new `strictWordOrder` boolean field is added per answer (within the `correctAnswer` JSON). Default: true (strict). When false, the grading function splits the answer into words and checks that all words are present regardless of order.
6. **AC6: Partial Credit** — Optional partial credit for multi-answer questions (e.g., 2/3 correct = 66%). A new `partialCredit` boolean field is added to the Exercise model. Default: false. The flag applies only to question types with multiple scorable items: MCQ Multi (R2), matching types (R9-R12), word bank blanks (R7), and NTF blanks (R13). Single-answer types (R1, R3-R6, R8, R14) are always all-or-nothing regardless of this flag. **Scoring formula:** Linear proportional — `score = correct_items / total_items` (e.g., 2/3 correct = 66.7%). **This story only stores the toggle.** The actual grading engine that reads this flag and applies partial scoring is implemented in Epic 5 (Story 5.1). The `matchesExactMapping()` utility (Task 5.2) provides the scoring infrastructure that Epic 5 will consume.
7. **AC7: Bulk Variant Import** — Paste comma-separated variants for quick entry. A "Paste variants" button opens a textarea where teacher pastes comma-separated values. On confirm, values are parsed, trimmed, deduplicated, and appended to `acceptedVariants`. Available on all text-answer editors (R5, R6, R8, R13, R14 without word bank).

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Add exercise-level answer key settings to Prisma schema** (AC: #3, #6)
  - [ ] 1.1 Add to `Exercise` model in `packages/db/prisma/schema.prisma`:
    ```prisma
    caseSensitive  Boolean @default(false) @map("case_sensitive")
    partialCredit  Boolean @default(false) @map("partial_credit")
    ```
  - [ ] 1.2 Run `pnpm --filter=db db:push` to sync schema (development mode, no migration needed).
  - [ ] 1.3 Update ALL three exercise Zod schemas in `packages/types/src/exercises.ts`:
    - `ExerciseSchema` (lines 273-293): Add `caseSensitive: z.boolean().default(false)` and `partialCredit: z.boolean().default(false)`.
    - `CreateExerciseSchema` (lines 295-302): Add both fields as optional with defaults.
    - `UpdateExerciseSchema` (lines 304-310): Add both fields as optional.
  - [ ] 1.4 Verify exercises service CRUD handles the new fields (Prisma passes through automatically — no service changes needed unless explicit field filtering exists).

- [ ] **Task 2: Update TextAnswerSchema — remove per-question caseSensitive, add strictWordOrder** (AC: #3, #5)
  - [ ] 2.1 Update `TextAnswerSchema` in `packages/types/src/exercises.ts`:
    ```typescript
    export const TextAnswerSchema = z.object({
      answer: z.string().min(1),
      acceptedVariants: z.array(z.string()).default([]),
      strictWordOrder: z.boolean().default(true),  // NEW
      // REMOVED: caseSensitive — now exercise-level only (Exercise.caseSensitive)
    });
    ```
    **IMPORTANT:** The existing `caseSensitive: z.boolean()` field is removed from the per-question schema. Case sensitivity is now controlled exclusively at the exercise level via `Exercise.caseSensitive`. Existing stored JSON with `caseSensitive` field will be safely ignored by the new schema (Zod strips unknown keys by default with `.strip()`).
  - [ ] 2.2 Update lenient schemas in `QuestionEditorFactory.tsx`: add optional `strictWordOrder`, remove `caseSensitive` from `LenientTextAnswer`.
  - [ ] 2.3 Remove the case sensitivity checkbox from `TextInputEditor.tsx` (lines 108-118). Case sensitivity is now managed in the exercise-level Answer Key Settings (Task 7).
  - [ ] 2.4 Add unit tests for `TextAnswerSchema` with `strictWordOrder` in `packages/types/src/exercises.test.ts`. Test that old JSON with `caseSensitive` field still parses (stripped, not rejected).

- [ ] **Task 3: Define NoteTableFlowchart answer schema WITH variant support** (AC: #1, #2) — **Blocked by: Story 3.4 implementation status**
  - [ ] 3.1 **If Story 3.4 is NOT yet implemented (current state as of 2026-02-07):** Coordinate with Story 3.4 to adopt the variant-aware schema from the start. Update the Story 3.4 spec's `NoteTableFlowchartAnswerSchema` to use the structured format:
    ```typescript
    export const NoteTableFlowchartAnswerSchema = z.object({
      blanks: z.record(z.string(), z.object({
        answer: z.string(),
        acceptedVariants: z.array(z.string()).default([]),
        strictWordOrder: z.boolean().default(true),
      })),
    });
    ```
    This schema does NOT exist yet in the codebase — it will be created by Story 3.4. Ensure 3.4 uses this format instead of the simpler `z.record(z.string(), z.string())` originally proposed.
  - [ ] 3.2 **If Story 3.4 IS already implemented by dev start:** Add a runtime migration utility `migrateNtfAnswer(oldAnswer)` in `sections.service.ts` that converts the flat format `{ "1": "answer" }` to `{ "1": { answer: "answer", acceptedVariants: [], strictWordOrder: true } }`. Apply during question read if old format detected (check `typeof value === 'string'`).
  - [ ] 3.3 Update lenient schema for R13 in `QuestionEditorFactory.tsx` (only if 3.4 is implemented — otherwise 3.4 handles this).
  - [ ] 3.4 Add unit tests for the structured schema.

- [ ] **Task 4: Define DiagramLabelling answer schema WITH variant support** (AC: #1, #2) — **Blocked by: Story 3.4 implementation status**
  - [ ] 4.1 **If Story 3.4 is NOT yet implemented:** Coordinate with Story 3.4 to adopt this union schema from the start:
    ```typescript
    export const DiagramLabellingAnswerSchema = z.object({
      labels: z.record(z.string(), z.union([
        z.string(),  // Simple string for word-bank mode (exact match)
        z.object({   // Structured for free-text mode (with variants)
          answer: z.string(),
          acceptedVariants: z.array(z.string()).default([]),
          strictWordOrder: z.boolean().default(true),
        }),
      ])),
    });
    ```
    **Grading dispatch rule:** During grading, if `labels[positionId]` is a `string`, use exact match. If it's an `object`, use `matchesAnswer()` with the object's `answer`, `acceptedVariants`, and `strictWordOrder` fields.
  - [ ] 4.2 **If Story 3.4 IS already implemented:** Same runtime migration approach as Task 3.2 — detect `typeof value === 'string'` and wrap in structured object on read.
  - [ ] 4.3 Update lenient schema for R14 in `QuestionEditorFactory.tsx` (only if 3.4 is implemented).
  - [ ] 4.4 Add unit tests for union type — both string and structured object variants.

- [ ] **Task 5: Enhance answer-utils with word order matching** (AC: #5)
  - [ ] 5.1 Update `matchesAnswer()` in `apps/backend/src/modules/exercises/answer-utils.ts`:
    ```typescript
    export function matchesAnswer(
      studentAnswer: string,
      correctAnswer: string,
      variants: string[] = [],
      caseSensitive: boolean = false,
      strictWordOrder: boolean = true,  // NEW parameter
    ): boolean {
      if (strictWordOrder) {
        // Existing logic: normalize and compare
      } else {
        // New logic: split both into word sets, check all correct words present
        // Uses whitespace splitting — suitable for IELTS answers which are
        // typically short English phrases (1-5 words from passage).
        // Vietnamese compound words like "thành phố" will split into separate
        // tokens — this is acceptable for IELTS Reading answers which are
        // extracted verbatim from English passages.
        const studentWords = new Set(normalizeAnswer(studentAnswer).split(/\s+/));
        const correctWords = normalizeAnswer(correctAnswer).split(/\s+/);
        const matches = correctWords.every(w => studentWords.has(w));
        if (matches) return true;
        // Also check against variants with same word-order-independent logic
        return variants.some(v => {
          const variantWords = normalizeAnswer(v).split(/\s+/);
          return variantWords.every(w => studentWords.has(w));
        });
      }
    }
    ```
    **Vietnamese language note:** IELTS Reading/Listening exercises use English passages, so answers are English words extracted from text. Whitespace splitting (`/\s+/`) is correct for this context. If the platform later supports Vietnamese-language exercises (non-IELTS), a Vietnamese tokenizer would be needed — but that is out of scope for this story. Add a code comment documenting this assumption.
  - [ ] 5.2 Add `matchesExactMapping()` utility for matching types (R9-R12) grading:
    ```typescript
    export function matchesExactMapping(
      studentMatches: Record<string, string>,
      correctMatches: Record<string, string>,
    ): { correct: number; total: number; score: number } {
      const total = Object.keys(correctMatches).length;
      let correct = 0;
      for (const [key, value] of Object.entries(correctMatches)) {
        if (studentMatches[key] === value) correct++;
      }
      return { correct, total, score: total > 0 ? correct / total : 0 };
    }
    ```
  - [ ] 5.3 Add comprehensive unit tests for word order matching and exact mapping in `answer-utils.test.ts`. Include:
    - Standard English: "carbon dioxide" vs "dioxide carbon" (should match when strict=false)
    - Single word: "cat" with strict=false (should still match "cat")
    - Empty string edge case
    - Variant with different word order: correctAnswer="industrial revolution", variant="the revolution industrial" with strict=false
    - IELTS-realistic: "fifteen percent" vs "percent fifteen"

- [ ] **Task 6: Add save-time normalization** (AC: #4)
  - [ ] 6.1 Create `normalizeAnswerOnSave()` in `apps/backend/src/modules/exercises/answer-utils.ts`:
    ```typescript
    export function normalizeAnswerOnSave(answer: string): string {
      return answer.trim().replace(/\s+/g, ' ');
    }
    ```
    **Design note:** This function intentionally does NOT lowercase. The existing `normalizeAnswer()` lowercases for match-time comparison. `normalizeAnswerOnSave()` preserves the teacher's original casing so that:
    - When `caseSensitive: true`, the stored answer retains exact case for display and strict matching.
    - When `caseSensitive: false`, `matchesAnswer()` applies its own lowercasing at match time.
    This separation ensures clean whitespace storage without destroying case information.
  - [ ] 6.2 Apply normalization in `sections.service.ts` `updateQuestion()` method (lines 202-239). Specifically, when `input.correctAnswer` is provided, recursively walk the JSON structure and apply `normalizeAnswerOnSave()` to all string values that represent answers (the `answer` field and each entry in `acceptedVariants` arrays). Add the import at the top of the file. Example integration point:
    ```typescript
    ...(input.correctAnswer !== undefined && {
      correctAnswer: toJsonValue(normalizeCorrectAnswer(input.correctAnswer))
    }),
    ```
    Create a helper `normalizeCorrectAnswer(answer: unknown): unknown` that recursively normalizes string answer values within the JSON structure.
  - [ ] 6.3 Add unit tests for `normalizeAnswerOnSave()` — trim, collapse whitespace, preserve case, empty string, tab characters, non-breaking spaces (U+00A0 → regular space).
  - [ ] 6.4 Add integration test: save a question with `correctAnswer: { answer: "  carbon   dioxide  " }`, verify stored as `{ answer: "carbon dioxide" }` with case preserved.

### Frontend Tasks

- [ ] **Task 7: Add exercise-level answer key settings UI** (AC: #3, #6)
  - [ ] 7.1 Add an "Answer Key Settings" collapsible section to `ExerciseEditor.tsx` (below passage editor, above question sections):
    ```
    ┌─────────────────────────────────────────────┐
    │ ▼ Answer Key Settings                       │
    │                                             │
    │ ☐ Case-sensitive matching                   │
    │   (Default: case-insensitive. Enable for    │
    │    exact capitalization matching.)           │
    │                                             │
    │ ☐ Enable partial credit                     │
    │   (Award proportional marks for partially   │
    │    correct multi-answer questions.)          │
    │                                             │
    │ ℹ️ Whitespace is automatically normalized:   │
    │   leading/trailing spaces trimmed, internal  │
    │   spacing collapsed.                        │
    └─────────────────────────────────────────────┘
    ```
  - [ ] 7.2 Wire toggles to exercise update mutation (PATCH exercise with `caseSensitive` and `partialCredit` fields).
  - [ ] 7.3 Load current values from exercise data on editor mount.
  - [ ] 7.4 Use `Collapsible` from `@workspace/ui` (or simple disclosure with `ChevronDown`/`ChevronUp` icons).

- [ ] **Task 8: Enhance TextInputEditor — add bulk import, word order toggle, fix onBlur** (AC: #1, #2, #5, #7)
  - [ ] 8.1 `TextInputEditor.tsx` already has: variant Badge chips with X remove (lines 123-137), add variant Input with Enter key (lines 138-161), and caseSensitive checkbox (lines 108-118). **Changes needed:**
    - **Remove** the caseSensitive checkbox (moved to exercise-level per AC3/Task 2.3)
    - **Replace** the existing inline variant list with the new `AnswerVariantManager` component (Task 9)
    - **Add** "Paste variants" bulk import button (delegates to AnswerVariantManager)
    - **Add** word order toggle: `☐ Allow any word order` checkbox (only shown when primary answer contains 2+ words)
  - [ ] 8.2 Bulk import handler (lives in AnswerVariantManager, Task 9):
    ```typescript
    function handleBulkImport(csv: string): string[] {
      return csv
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate
    }
    ```
  - [ ] 8.3 Update `onChange` call to include `strictWordOrder` in the correctAnswer object. The current onChange signature is `onChange(options: null, correctAnswer: {...}, wordLimit: number | null)` — add `strictWordOrder` to the correctAnswer type.
  - [ ] 8.4 **Fix onBlur pattern**: The current variant add Input (line 141) uses `onChange` — change to `onBlur` per Story 3.3 H2 fix. The primary answer Input (line 79) also uses `onChange` — change to `onBlur` with local state for the input value. This prevents excessive parent onChange calls on every keystroke.

- [ ] **Task 9: Create AnswerVariantManager shared component** (AC: #2, #7)
  - [ ] 9.1 Create `apps/webapp/src/features/exercises/components/question-types/AnswerVariantManager.tsx`:
    - A reusable component for managing variants on any text answer
    - Props: `variants: string[]`, `onVariantsChange: (variants: string[]) => void`, `disabled?: boolean`
    - Features:
      - Chip display with remove buttons
      - Inline add input (Enter to add, onBlur to add)
      - Reject empty strings and duplicates on ALL add paths (inline + bulk)
      - "Paste variants" button → textarea popover for CSV paste
      - Deduplication on every add operation (check `variants.includes(newVariant)` before appending)
      - Sorting (alphabetical) for readability
    - Use `Badge` for variant chips, `Input` for add field, `Button` for paste trigger
  - [ ] 9.2 Wire into `TextInputEditor.tsx` — replace current manual variant list with `AnswerVariantManager`.
  - [ ] 9.3 Wire into `NoteTableFlowchartEditor.tsx` (if Story 3.4 is implemented) — add variant manager per blank in the answer assignment panel.
  - [ ] 9.4 Wire into `DiagramLabellingEditor.tsx` (if Story 3.4 is implemented) — add variant manager per label position when NOT in word bank mode.

- [ ] **Task 10: Add word order toggle to text answer editors** (AC: #5)
  - [ ] 10.1 In `TextInputEditor.tsx`, add a `Checkbox` for "Allow any word order" below the primary answer input. Only show when the primary answer contains 2+ words.
  - [ ] 10.2 Store as `strictWordOrder: boolean` in correctAnswer JSON. When checkbox is checked, `strictWordOrder = false`.
  - [ ] 10.3 Show tooltip: "When enabled, 'carbon dioxide' also accepts 'dioxide carbon'."

### Testing Tasks

- [ ] **Task 11: Backend Tests** (AC: #1-7) — Estimated: +45 new test cases
  - [ ] 11.1 Unit tests for updated `TextAnswerSchema`: `strictWordOrder` valid/default, backwards-compat with old JSON containing `caseSensitive` (should be stripped, not rejected).
  - [ ] 11.2 Unit tests for `NoteTableFlowchartAnswerSchema` with per-blank variants — valid/invalid structures (only if 3.4 implemented; otherwise deferred to 3.4).
  - [ ] 11.3 Unit tests for `DiagramLabellingAnswerSchema` with union type — simple string and structured object variants (only if 3.4 implemented).
  - [ ] 11.4 Unit tests for `matchesAnswer()` with `strictWordOrder: false`:
    - "carbon dioxide" matches "dioxide carbon" (strict=false) ✓
    - "carbon dioxide" does NOT match "dioxide carbon" (strict=true) ✓
    - Single word "cat" matches "cat" (strict=false) ✓
    - Empty string edge case ✓
    - Variant with different word order ✓
    - IELTS-realistic: "fifteen percent" vs "percent fifteen" ✓
  - [ ] 11.5 Unit tests for `matchesExactMapping()` — full match, partial match (2/3), empty mappings, mismatched keys, score calculation.
  - [ ] 11.6 Unit tests for `normalizeAnswerOnSave()` — trim, collapse whitespace, preserve case, empty string, tab characters (`\t` → space), non-breaking spaces (U+00A0 → regular space).
  - [ ] 11.7 Integration test: create exercise with `caseSensitive: true` and `partialCredit: true`, verify stored and returned correctly via GET.
  - [ ] 11.8 Integration test: save question with `correctAnswer: { answer: "  carbon   dioxide  " }`, verify stored as `{ answer: "carbon dioxide" }` with case preserved.
  - [ ] 11.9 Run: `pnpm --filter=backend test`

- [ ] **Task 12: Frontend Tests** (AC: #1-7) — Target: >=80% line coverage, estimated +35 new test cases
  - [ ] 12.1 `AnswerVariantManager` tests — render variants as chips, add variant via input, remove variant, paste bulk CSV, deduplication on ALL add paths (inline + bulk), reject empty input, empty state.
  - [ ] 12.2 `TextInputEditor` tests — verify AnswerVariantManager integration, caseSensitive checkbox REMOVED, word order toggle visibility (only when answer has 2+ words), toggle state change, onBlur behavior (not onChange).
  - [ ] 12.3 `ExerciseEditor` tests — answer key settings section renders, caseSensitive toggle updates exercise mutation, partialCredit toggle updates exercise mutation, values load from exercise data on mount.
  - [ ] 12.4 Run: `pnpm --filter=webapp test`

- [ ] **Task 13: Schema Sync** (AC: #3, #6)
  - [ ] 13.1 After adding `caseSensitive` and `partialCredit` to exercise model: run `pnpm --filter=webapp sync-schema-dev` (backend must be running).
  - [ ] 13.2 Verify new fields appear in `apps/webapp/src/schema/schema.d.ts`.

## Dev Notes

### Architecture Compliance

**Backend Pattern (Route -> Controller -> Service):**
- Exercise CRUD already exists in `exercises.service.ts`, `exercises.controller.ts`, `exercises.routes.ts`. The new `caseSensitive` and `partialCredit` fields are simple boolean columns that Prisma passes through automatically. No new routes needed — existing `PATCH /exercises/:id` handles the update.
- `answer-utils.ts` is a pure utility module with no HTTP/DB dependencies — easy to extend and test.
- `sections.service.ts:updateQuestion()` needs a small modification to normalize correctAnswer strings on save.

**Frontend Pattern (Feature-First):**
- New `AnswerVariantManager` component lives in `question-types/` alongside other editors.
- Exercise-level settings go in `ExerciseEditor.tsx` which already handles exercise CRUD.
- Hooks: Reuse `use-exercises.ts` — `updateExercise` mutation already exists. DO NOT recreate.
- Debouncing: Exercise-level toggles save immediately via mutation (no debounce needed — boolean toggles).

### Multi-Tenancy Requirements

- ALL database queries MUST go through `getTenantedClient(this.prisma, centerId)`.
- Exercise-level settings inherit multi-tenancy from the Exercise model (already has `centerId`).
- No new models needed — just 2 new columns on existing Exercise model.

### Database Schema Changes

**Prisma changes needed:**
```prisma
model Exercise {
  // ... existing fields ...
  caseSensitive  Boolean @default(false) @map("case_sensitive")   // NEW
  partialCredit  Boolean @default(false) @map("partial_credit")   // NEW
}
```

Run `pnpm --filter=db db:push` after schema change (development mode).

**NO new models. NO new relations. 2 columns added to existing Exercise model.**

### Answer Type Schema Changes

**TextAnswerSchema evolution (R5, R6, R8):**
```
Before: { answer, acceptedVariants[], caseSensitive }
After:  { answer, acceptedVariants[], strictWordOrder }
```
Two changes: (1) `caseSensitive` removed (now exercise-level only), (2) `strictWordOrder` added with default `true`. Backwards-compatible — Zod strips the old `caseSensitive` field from stored JSON, and `strictWordOrder` defaults to `true` (matching current strict behavior). Existing stored data continues to parse correctly.

**Case sensitivity precedence rule:** Exercise.caseSensitive (DB column) is the single source of truth. The per-question `caseSensitive` in TextAnswerSchema is deprecated and removed. The grading engine (Epic 5) reads `Exercise.caseSensitive` and passes it to `matchesAnswer()`.

**NoteTableFlowchartAnswerSchema (R13) — does NOT exist yet:**
```
Target: { blanks: { "1": { answer: "answer text", acceptedVariants: [], strictWordOrder: true } } }
```
This schema will be created by Story 3.4. As of 2026-02-07, Story 3.4 is `ready-for-dev` but NOT implemented — no R13/R14 schemas, editors, or previews exist in the codebase. Coordinate with 3.4 to adopt the variant-aware format from the start, avoiding a migration step.

**DiagramLabellingAnswerSchema (R14) — does NOT exist yet:**
```
Target: { labels: { "0": "label text" | { answer, acceptedVariants[], strictWordOrder } } }
```
Same as R13 — schema will be created by Story 3.4. Uses `z.union([z.string(), z.object(...)])` to support both modes:
- Word bank mode: simple string (exact match, no variants needed)
- Free text mode: structured object (with variants and word order)
- **Grading dispatch:** `typeof labels[key] === 'string'` → exact match; otherwise → `matchesAnswer()` with structured fields.

### Existing Code to Extend (DO NOT Reinvent)

| What | Location | Action |
|------|----------|--------|
| Exercise CRUD | `exercises.service.ts` | No change — Prisma passes new columns through |
| Exercise update route | `exercises.routes.ts` | No change — UpdateExerciseSchema updated in types |
| Answer utilities | `answer-utils.ts` | Add `strictWordOrder` param + `matchesExactMapping()` + `normalizeAnswerOnSave()` |
| Answer utility tests | `answer-utils.test.ts` | Add new test cases |
| TextInputEditor | `TextInputEditor.tsx` | Remove caseSensitive checkbox (lines 108-118), replace variant list (lines 123-161) with AnswerVariantManager, add word order toggle, fix onBlur (lines 79, 141) |
| ExerciseEditor | `ExerciseEditor.tsx` | Add Answer Key Settings section |
| Exercise schemas | `packages/types/src/exercises.ts` | Add `caseSensitive`, `partialCredit` to ExerciseSchema + CreateExerciseSchema + UpdateExerciseSchema; remove `caseSensitive` from TextAnswerSchema; add `strictWordOrder` to TextAnswerSchema |
| Use-exercises hook | `use-exercises.ts` | No change — `updateExercise` mutation exists |
| Question debouncing | `QuestionSectionEditor.tsx` | No change — 500ms debounce already wired |

### Previous Story Intelligence (Story 3.4)

**Key learnings from 3-2/3-3 that apply:**
- **Debounced updates**: QuestionSectionEditor already implements 500ms debounce on `handleEditorChange()` — editors just call `onChange(options, correctAnswer)` and the parent handles debouncing. DO NOT add debounce inside editor components.
- **Null handling**: All editors MUST handle `options: null` and `correctAnswer: null` gracefully — render empty form state, not errors.
- **SafeParse pattern**: QuestionEditorFactory uses lenient Zod schemas with `safeParse()` to safely parse unknown JSON before passing to editors. Update lenient schemas to include `strictWordOrder`.
- **onChange contract**: Editors call `onChange(options, correctAnswer)` — always pass BOTH values.
- **onBlur for text inputs**: Use `onBlur` (NOT `onChange`) for ALL text Input fields per Story 3.3 H2 fix. **NOTE:** The current TextInputEditor.tsx does NOT follow this pattern — the variant add Input (line 141) and primary answer Input (line 79) both use `onChange`. This story MUST fix this as part of Task 8.4.
- **Test count baseline**: After story 3.3 — 321 backend tests, 268 webapp tests, 77 types tests passing.
- **Code review findings from 3.3 — APPLY TO THIS STORY:**
  - **H2 (onBlur for text inputs):** Fix existing `onChange` usage in TextInputEditor (lines 79, 141) to `onBlur`.

**Files established in 3-2/3-3 that this story modifies:**
- `TextInputEditor.tsx` — Remove caseSensitive checkbox, replace variant list with AnswerVariantManager, add word order toggle, fix onBlur
- `packages/types/src/exercises.ts` — Add `strictWordOrder` to TextAnswerSchema, update exercise schemas
- `answer-utils.ts` — Add `strictWordOrder` support + new utility functions
- `ExerciseEditor.tsx` — Add Answer Key Settings section

### Git Intelligence

**Recent commits (relevant patterns):**
```
33e6e5a fix(users): fix CSV template download by parsing response as blob
4b86c78 docs(exercises): update story 3.3 dev record with code review fixes
1fe3c64 feat(exercises): implement story 3.3 matching question types (R9-R12)
255b04d feat(exercises): implement story 3.2 reading question types (R1-R8)
```

**Commit convention:** `feat(exercises): description` for new features.

### Scope Boundaries (What NOT to Build)

- DO NOT implement the actual auto-grading engine — just store answer structures and settings; grading execution is Epic 5
- DO NOT implement student-facing answer submission — this story manages the **teacher's answer key definition**; student submission UI is Story 4.1
- DO NOT add answer variant management for MCQ (R1, R2), TFNG (R3, R4), word bank (R7), or matching (R9-R12) — these use exact selection and don't need text variants
- DO NOT build a dedicated "Answer Key Editor" page — all answer key management happens inline within the existing question type editors
- DO NOT implement scoring/grading preview — that's Epic 5 territory
- DO NOT add exercise-level word limit — word limits are per-question and already exist
- DO NOT build audio/listening features (Story 3.6-3.7) — Listening variant support (L1, L5, L6) deferred to those stories; the AnswerVariantManager will be reusable
- DO NOT modify the question CRUD routes or controllers — changes are limited to schemas, utilities, and frontend components
- DO NOT retroactively re-grade historical student submissions when case sensitivity is toggled — the toggle applies to future grading only

### Technical Specifics

**Shadcn/UI components to use:**
- `Checkbox` — for case sensitivity, partial credit, and word order toggles
- `Badge` — for variant chips with remove button
- `Input` — for variant add field
- `Button` — for "Paste variants" trigger, remove variant
- `Popover` / `Dialog` — for bulk variant import textarea
- `Textarea` — for bulk CSV paste area
- `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` — for Answer Key Settings section
- `Tooltip` / `TooltipTrigger` / `TooltipContent` — for whitespace handling info
- `Label` — for form field labels
- `X`, `Plus`, `ClipboardPaste`, `Settings`, `ChevronDown` icons from `lucide-react`

**AnswerVariantManager Component Architecture:**
```
┌───────────────────────────────────────────────┐
│ Accepted Variants:                            │
│ ┌──────┐ ┌────────────┐ ┌──────────────┐    │
│ │ 19 ✕ │ │ nineteen ✕ │ │ UK ✕         │    │
│ └──────┘ └────────────┘ └──────────────┘    │
│                                               │
│ [Add variant...          ] [+ Add]            │
│                                               │
│ [📋 Paste Variants]                           │
│                                               │
│ ┌─────────────────────────────────────────┐  │
│ │ Paste comma-separated variants:          │  │
│ │ ┌───────────────────────────────────┐    │  │
│ │ │ nineteen, 19, nineteen years old  │    │  │
│ │ └───────────────────────────────────┘    │  │
│ │ [Cancel] [Import 3 variants]             │  │
│ └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

**Exercise-Level Settings Layout:**
```
ExerciseEditor
├── Exercise Title & Skill Selector (existing)
├── Passage Editor (existing)
├── ▼ Answer Key Settings (NEW — collapsible, default closed)
│   ├── ☐ Case-sensitive matching (info tooltip)
│   ├── ☐ Enable partial credit (info tooltip)
│   └── ℹ Whitespace normalization info text
├── Question Sections (existing)
└── Preview Toggle (existing)
```

### Component Tree

```
ExerciseEditor (MODIFY — add Answer Key Settings section)
├── AnswerKeySettings (NEW — collapsible settings panel)
│   ├── Checkbox: caseSensitive
│   ├── Checkbox: partialCredit
│   └── Info text: whitespace normalization
├── QuestionSectionEditor (no change)
│   └── QuestionEditorFactory (minor change — update lenient schemas)
│       ├── TextInputEditor (MODIFY — integrate AnswerVariantManager + word order toggle)
│       │   └── AnswerVariantManager (NEW — reusable variant management)
│       ├── NoteTableFlowchartEditor (MODIFY if 3.4 implemented — add variant manager per blank)
│       │   └── AnswerVariantManager (reuse)
│       ├── DiagramLabellingEditor (MODIFY if 3.4 implemented — add variant manager for free-text labels)
│       │   └── AnswerVariantManager (reuse)
│       └── [All other editors — no change]
└── ExercisePreview (no change)
```

### Project Structure Notes

```
apps/webapp/src/features/exercises/
├── components/
│   ├── ExerciseEditor.tsx                    # MODIFY — add Answer Key Settings section
│   ├── question-types/
│   │   ├── TextInputEditor.tsx              # MODIFY — integrate AnswerVariantManager + word order
│   │   ├── AnswerVariantManager.tsx          # NEW — reusable variant management component
│   │   ├── AnswerVariantManager.test.tsx     # NEW — component tests
│   │   ├── QuestionEditorFactory.tsx        # MODIFY — update lenient schemas with strictWordOrder
│   │   ├── NoteTableFlowchartEditor.tsx     # MODIFY (if 3.4 done) — add variant manager per blank
│   │   ├── DiagramLabellingEditor.tsx       # MODIFY (if 3.4 done) — add variant manager for labels
│   │   └── question-editors.test.tsx        # MODIFY — add new test cases
│   └── QuestionSectionEditor.tsx            # No change

packages/types/src/
├── exercises.ts                             # MODIFY — add strictWordOrder, update exercise schemas,
│                                            #           update R13/R14 answer schemas
└── exercises.test.ts                        # MODIFY — add new schema tests

packages/db/prisma/
└── schema.prisma                            # MODIFY — add caseSensitive + partialCredit to Exercise

apps/backend/src/modules/exercises/
├── answer-utils.ts                          # MODIFY — add strictWordOrder, matchesExactMapping, normalizeOnSave
├── answer-utils.test.ts                     # MODIFY — add new test cases
├── sections.service.ts                      # MODIFY — add save-time normalization
├── exercises.service.ts                     # No change
├── exercises.controller.ts                  # No change
└── exercises.routes.ts                      # No change
```

### Dependencies

- **Story 3.1 (Exercise Builder Core):** DONE. Exercise CRUD, question sections, and passage management are in place.
- **Story 3.2 (R1-R8):** DONE. TextInputEditor with variant chips, add input, and caseSensitive toggle exists (lines 108-161). answer-utils.ts with normalizeAnswer/matchesAnswer/checkWordLimit exists. This story removes caseSensitive from per-question level, adds word order toggle, replaces variant list with AnswerVariantManager, and fixes onBlur.
- **Story 3.3 (R9-R12):** DONE. MatchingEditor and matching schemas in place. This story adds matchesExactMapping() utility for matching type scoring.
- **Story 3.4 (R13-R14):** `ready-for-dev` — **NOT YET IMPLEMENTED as of 2026-02-07**. No R13/R14 schemas, editors, or previews exist in the codebase.
  - **Tasks 3, 4 (schema definitions):** Coordinate with Story 3.4 to adopt variant-aware schemas from the start. If 3.4 is implemented before 3.5 starts, use runtime migration instead.
  - **Tasks 9.3, 9.4 (AnswerVariantManager integration into NTF/Diagram editors):** Blocked by Story 3.4 completion. If 3.4 is not done, defer these subtasks to Story 3.4's dev record.
  - **Recommended execution order:** Implement 3.4 first, then 3.5 — this avoids schema coordination complexity.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5: Answer Key Management (FR40)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR40 — Answer keys with acceptable variants]
- [Source: _bmad-output/planning-artifacts/architecture.md#Zod Validation, Fastify Type Provider]
- [Source: project-context.md#Critical Implementation Rules — Multi-tenancy, Type Safety, Layered Architecture]
- [Source: packages/types/src/exercises.ts — TextAnswerSchema (lines 102-106), discriminated union]
- [Source: apps/backend/src/modules/exercises/answer-utils.ts — normalizeAnswer, matchesAnswer, checkWordLimit]
- [Source: apps/backend/src/modules/exercises/answer-utils.test.ts — existing 40 test cases]
- [Source: apps/webapp/src/features/exercises/components/question-types/TextInputEditor.tsx — current variant list UI]
- [Source: apps/webapp/src/features/exercises/components/ExerciseEditor.tsx — exercise editing layout]
- [Source: apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx — 500ms debounce pattern]
- [Source: packages/db/prisma/schema.prisma — Exercise model, Question model]
- [Source: _bmad-output/implementation-artifacts/3-3-reading-question-types-matching.md#Code Review Fixes — H2 onBlur pattern]
- [Source: _bmad-output/implementation-artifacts/3-4-reading-question-types-advanced.md#Dev Notes — factory patterns, lenient schemas]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
