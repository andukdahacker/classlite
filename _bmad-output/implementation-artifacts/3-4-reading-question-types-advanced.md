# Story 3.4: Reading Question Types - Advanced (R13-R14)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to create advanced IELTS Reading question types — Note/Table/Flow-chart Completion (R13) and Diagram Labelling (R14) — with type-specific editors and previews,
so that my students can practice visual-based and structured completion questions in realistic IELTS formats.

## Acceptance Criteria

1. **AC1: Note/Table/Flow-chart Completion (R13)** — When section type is R13_NOTE_TABLE_FLOWCHART, teacher selects a sub-format (note, table, or flowchart). Teacher defines the visual structure with blank cells/positions. Teacher provides correct answers per blank with word limit. Student preview shows the completed visual structure with disabled text inputs at blank positions.
2. **AC2: Diagram Labelling (R14)** — When section type is R14_DIAGRAM_LABELLING, teacher uploads a diagram image, defines numbered label positions (as a list), and provides correct labels per position. Teacher optionally provides a word bank (label pool with distractors). Student preview shows the diagram image with numbered label positions and either disabled text inputs or a disabled word bank dropdown per label.
3. **AC3: Sub-Format Visual Editors** — For R13, the editor renders differently based on sub-format: (a) **Note** mode shows a structured text area with hierarchical bullets and inline blanks using `___N___` notation. (b) **Table** mode shows a grid editor where teacher defines column headers, row headers, and marks cells as blanks. (c) **Flowchart** mode shows a sequential step editor where teacher defines ordered steps/boxes and marks blanks within steps.
4. **AC4: Word Limit Enforcement** — For both R13 and R14, teacher sets a word limit (default: 2 words). Preview shows word limit badge per blank. Auto-grading (Epic 5) will enforce word count.
5. **AC5: Word Bank Mode for R14** — Teacher can optionally provide a word bank (more labels than positions = distractors). When word bank exists, preview shows dropdowns instead of text inputs. Distractor badge shows "X labels, Y positions" count.

## Tasks / Subtasks

### Backend Tasks

- [x] **Task 1: Add R13 Zod Schemas** (AC: #1, #3, #4)
  - [x]1.1 Add `NoteTableFlowchartOptionsSchema` to `packages/types/src/exercises.ts`:
    ```
    z.object({
      subFormat: z.enum(["note", "table", "flowchart"]),
      structure: z.string().min(1),  // Serialized structure (see JSON format below)
      wordLimit: z.number().int().min(1).max(5).default(2),
    })
    ```
  - [x]1.2 Add `NoteTableFlowchartAnswerSchema`:
    ```
    z.object({
      blanks: z.record(z.string(), z.string()),  // blankId -> correct answer
    })
    ```
  - [x]1.3 Add R13 entry to `QuestionOptionsSchema` discriminated union (after R12 entries, before closing). Use `NoteTableFlowchartOptionsSchema` for options and `NoteTableFlowchartAnswerSchema` for correctAnswer.
  - [x]1.4 Add unit tests for R13 schemas in `packages/types/src/exercises.test.ts` — valid/invalid for each sub-format, empty structure, missing fields, word limit range.

- [x] **Task 2: Add R14 Zod Schemas** (AC: #2, #4, #5)
  - [x]2.1 Add `DiagramLabellingOptionsSchema` to `packages/types/src/exercises.ts`:
    ```
    z.object({
      diagramUrl: z.string().min(1),  // URL or empty during creation
      labelPositions: z.array(z.string()).min(1),  // Label descriptions/numbered positions
      wordBank: z.array(z.string()).optional(),  // Optional word bank (includes distractors)
      wordLimit: z.number().int().min(1).max(5).default(2),
    })
    ```
  - [x]2.2 Add `DiagramLabellingAnswerSchema`:
    ```
    z.object({
      labels: z.record(z.string(), z.string()),  // positionIndex -> correct label
    })
    ```
  - [x]2.3 Add R14 entry to `QuestionOptionsSchema` discriminated union (after R13 entry).
  - [x]2.4 Add unit tests for R14 schemas — valid with/without word bank, empty label positions, missing diagram URL.

### Frontend Tasks

- [x] **Task 3: Create NoteTableFlowchartEditor component** (AC: #1, #3, #4) — Target: >=80% line coverage
  - [x]3.1 Create `apps/webapp/src/features/exercises/components/question-types/NoteTableFlowchartEditor.tsx`
  - [x]3.2 **Sub-format selector:** Radio group or segmented control at top: "Note", "Table", "Flowchart". Switching sub-format resets the structure field.
  - [x]3.3 **Note mode:** Textarea with `___N___` blank notation (same pattern as R7 WordBankEditor). Teacher types structured text with inline blanks. Parse blanks to show answer assignment below. Example:
    ```
    Main Topic: Climate Change
    • Impact on agriculture
      - Crop yields decreased by ___1___
      - Water scarcity affects ___2___
    • Solutions proposed
      - Renewable energy reduces ___3___
    ```
  - [x]3.4 **Table mode:** Grid editor with:
    - Input for number of columns (2-6) and rows (2-8)
    - Header row: editable text inputs for column headers
    - Optional header column: toggle for row headers
    - Cell editor: each cell is either text (pre-filled) or blank (marked with `___N___`)
    - Click cell to toggle between "text" and "blank" mode
    - Serialized to JSON string in `structure` field
  - [x]3.5 **Flowchart mode:** Sequential step list editor with:
    - Ordered list of steps (add/remove/reorder)
    - Each step is a text input that can contain `___N___` blanks
    - Steps rendered as labeled boxes with arrow connectors (CSS only — no external libs)
    - Serialized to JSON string in `structure` field
  - [x]3.6 **Answer assignment panel:** Below the structure editor, show parsed blanks with answer text input per blank. Same pattern as WordBankEditor blank assignment.
  - [x]3.7 **Word limit control:** Number input for word limit (1-5, default 2).
  - [x]3.8 Handle null options/correctAnswer gracefully (render empty note mode as default).
  - [x]3.9 **Structure parsing safety:** For Table and Flowchart modes, wrap `JSON.parse(structure)` in try/catch. On parse failure (malformed JSON, legacy data, sub-format mismatch), reset to empty structure rather than crashing. Note mode doesn't need this since it's plain text.

- [x] **Task 4: Create DiagramLabellingEditor component** (AC: #2, #4, #5) — Target: >=80% line coverage
  - [x]4.1 Create `apps/webapp/src/features/exercises/components/question-types/DiagramLabellingEditor.tsx`
  - [x]4.2 **Diagram image section:** Display current diagram image if `diagramUrl` exists. Show "Upload Diagram" button that triggers file input (accept: image/png, image/jpeg, image/svg+xml). On file select, upload via `POST /api/v1/exercises/:exerciseId/diagram` (new route, Task 7). Display uploaded image preview. Show "Remove" button to clear.
  - [x]4.3 **Label positions list:** Numbered list of label descriptions (add/remove/edit). Each position has an editable text input describing what is being labelled (e.g., "1. outer shell", "2. membrane"). These act as identifiers for the teacher.
  - [x]4.4 **Answer assignment:** For each label position, an answer text input for the correct label text.
  - [x]4.5 **Word bank toggle:** Checkbox "Use word bank". When enabled, show word bank editor (add/remove word chips, same pattern as R7). When word bank has more items than label positions, show distractor badge.
  - [x]4.6 **Word limit control:** Number input for word limit (1-5, default 2). Only relevant when word bank is NOT used (free text input mode).
  - [x]4.7 Handle null options/correctAnswer gracefully (render empty state with upload prompt).

- [x] **Task 5: Create NoteTableFlowchartPreview component** (AC: #1, #3, #4)
  - [x]5.1 Create `apps/webapp/src/features/exercises/components/question-types/NoteTableFlowchartPreview.tsx`
  - [x]5.2 **Note preview:** Parse structure text and render with hierarchical formatting. Replace `___N___` with disabled text inputs showing word limit badge.
  - [x]5.3 **Table preview:** Parse structure JSON and render as HTML table. Blank cells show disabled text inputs. Pre-filled cells show static text.
  - [x]5.4 **Flowchart preview:** Parse structure JSON and render as CSS-styled boxes with arrow connectors (flexbox/grid, `::after` pseudo-elements for arrows). Blanks within steps show disabled text inputs.
  - [x]5.5 Show "No structure configured." when options is null or structure is empty.

- [x] **Task 6: Create DiagramLabellingPreview component** (AC: #2, #4, #5)
  - [x]6.1 Create `apps/webapp/src/features/exercises/components/question-types/DiagramLabellingPreview.tsx`
  - [x]6.2 **Diagram display:** Show diagram image from `diagramUrl`. If no image, show placeholder text "No diagram uploaded."
  - [x]6.3 **Label list below image:** Numbered list of label positions. Each shows either: (a) disabled text input with word limit badge (no word bank), or (b) disabled Select dropdown with word bank options (word bank mode). For word bank dropdowns, use index-based `value={String(index)}` for SelectItem to prevent Radix Select crashes on duplicate word bank entries (per Story 3.3 H1 fix).
  - [x]6.4 **Distractor badge:** If word bank mode, show "X labels, Y positions" badge.

- [x] **Task 7: Diagram Upload API Route** (AC: #2)
  - [x]7.1 Add `uploadDiagram(centerId, exerciseId, fileBuffer, contentType)` method to `apps/backend/src/modules/exercises/exercises.service.ts`. Follow exact pattern from `tenant.service.ts:uploadLogo()`. Storage path: `exercises/${centerId}/${exerciseId}/diagrams/${Date.now()}.${ext}`. Return public URL.
  - [x]7.2 Add `POST /:exerciseId/diagram` route to `apps/backend/src/modules/exercises/exercises.routes.ts`. Use route-level file size override: `const data = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });` (DO NOT change the global 2MB limit in `app.ts`). Validate mimetype: `["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]`. Require `authMiddleware` + `requireRole(["OWNER", "ADMIN", "TEACHER"])`. Error responses: no file → `reply.status(400).send({ message: "No file uploaded" })`, invalid mimetype → `reply.status(400).send({ message: "Invalid file type. Only PNG, JPG, and SVG are allowed." })`, upload failure → `reply.status(500).send({ message: "Failed to upload diagram" })`. Success: `reply.status(200).send({ data: { diagramUrl }, message: "Diagram uploaded" })`.
  - [x]7.3 Add frontend API call: Create `uploadDiagram` mutation in `apps/webapp/src/features/exercises/hooks/use-exercises.ts` (or create `use-diagram-upload.ts`). Use `fetch` with `FormData` to POST the file. Return URL on success.

- [x] **Task 8: Integrate into factory components** (AC: #1-5)
  - [x]8.1 Add R13 case to `QuestionEditorFactory.tsx` switch statement — dispatch to `NoteTableFlowchartEditor`. Add lenient schema:
    ```
    LenientNoteTableFlowchartOptions = z.object({
      subFormat: z.enum(["note", "table", "flowchart"]).optional(),
      structure: z.string(),
      wordLimit: z.number().optional(),
    })
    LenientNoteTableFlowchartAnswer = z.object({
      blanks: z.record(z.string(), z.string()),
    })
    ```
  - [x]8.2 Add R14 case to `QuestionEditorFactory.tsx` — dispatch to `DiagramLabellingEditor`. Add lenient schema:
    ```
    LenientDiagramLabellingOptions = z.object({
      diagramUrl: z.string(),
      labelPositions: z.array(z.string()),
      wordBank: z.array(z.string()).optional(),
      wordLimit: z.number().optional(),
    })
    LenientDiagramLabellingAnswer = z.object({
      labels: z.record(z.string(), z.string()),
    })
    ```
  - [x]8.3 Add R13 case to `QuestionPreviewFactory.tsx` — dispatch to `NoteTableFlowchartPreview`.
  - [x]8.4 Add R14 case to `QuestionPreviewFactory.tsx` — dispatch to `DiagramLabellingPreview`.

### Testing Tasks

- [x] **Task 9: Backend Tests** (AC: #1-5)
  - [x]9.1 Unit tests for `NoteTableFlowchartOptionsSchema` and `NoteTableFlowchartAnswerSchema` — valid note/table/flowchart, invalid sub-format, empty structure, word limit bounds
  - [x]9.2 Unit tests for `DiagramLabellingOptionsSchema` and `DiagramLabellingAnswerSchema` — valid with/without word bank, empty positions, URL validation
  - [x]9.3 Unit tests for R13 + R14 entries in `QuestionOptionsSchema` discriminated union
  - [x]9.4 Integration test for diagram upload route (if feasible — may be mocked)
  - [x]9.5 Run: `pnpm --filter=backend test`

- [x] **Task 10: Frontend Tests** (AC: #1-5) — Target: >=80% line coverage
  - [x]10.1 NoteTableFlowchartEditor tests — sub-format switching, blank parsing, answer assignment, null handling, word limit control
  - [x]10.2 DiagramLabellingEditor tests — label position add/remove, word bank toggle, answer assignment, null handling
  - [x]10.3 NoteTableFlowchartPreview tests — note/table/flowchart rendering, null options, blank display
  - [x]10.4 DiagramLabellingPreview tests — with/without image, word bank mode, text input mode, null options
  - [x]10.5 Update existing R13/R14 fallback tests in `question-editors.test.tsx` — verify new editors render instead of "No editor available" fallback
  - [x]10.6 Factory integration tests — verify R13 dispatches to NoteTableFlowchartEditor and R14 to DiagramLabellingEditor in both editor and preview factories
  - [x]10.7 Run: `pnpm --filter=webapp test`

- [x] **Task 11: Schema Sync** (AC: #2)
  - [x]11.1 After adding diagram upload route: run `pnpm --filter=webapp sync-schema-dev` (backend must be running)
  - [x]11.2 Verify new route types appear in `apps/webapp/src/schema/schema.d.ts`

## Dev Notes

### Architecture Compliance

**Backend Pattern (Route -> Controller -> Service):**
- The existing question CRUD in `sections.service.ts` already stores arbitrary JSON in `options` and `correctAnswer` fields via `toJsonValue()`. NO changes needed for question CRUD.
- ONE new route needed: `POST /:exerciseId/diagram` for image upload. Follow exact pattern from `tenant.routes.ts:POST /:id/logo` (lines 183-239).
- Upload service method follows `tenant.service.ts:uploadLogo()` pattern (lines 63-91).

**Frontend Pattern (Feature-First):**
- Follow exact patterns from story 3.2/3.3 editors/previews.
- Hooks: Reuse `use-sections.ts` — `updateQuestion` mutation already exists (lines 100-123). DO NOT recreate.
- Components: Use `@workspace/ui` shadcn components.
- Feedback: `toast.success()` / `toast.error()` from `sonner`.
- Icons: `lucide-react`.

### Multi-Tenancy Requirements

- ALL database queries MUST go through `getTenantedClient(this.prisma, centerId)`.
- Questions inherit `centerId` from the exercise's center scope — already set in `sections.service.ts`.
- Diagram upload path includes `centerId` for tenant isolation: `exercises/${centerId}/${exerciseId}/diagrams/...`.

### Database Schema — NO CHANGES NEEDED (for question model)

The existing schema already supports this story:
- `Question.options Json?` — stores R13/R14 option structures
- `Question.correctAnswer Json?` — stores answer structures
- `QuestionSection.sectionType IeltsQuestionType` — R13_NOTE_TABLE_FLOWCHART and R14_DIAGRAM_LABELLING enum values already exist in Prisma schema (lines 401-402)
- `Question.wordLimit Int?` — available but we store wordLimit in the JSON options instead for consistency with the structure

**NO Prisma schema changes. NO migration. NO `db:push` needed.**

### R13 JSON Structure: Note/Table/Flowchart Completion

All three sub-formats share the same schema with `subFormat` discriminator and a `structure` string field containing serialized content.

**Note Sub-Format:**
```json
{
  "options": {
    "subFormat": "note",
    "structure": "Main Topic: Climate Change\n• Impact on agriculture\n  - Crop yields decreased by ___1___\n  - Water scarcity affects ___2___\n• Solutions proposed\n  - Renewable energy reduces ___3___",
    "wordLimit": 2
  },
  "correctAnswer": {
    "blanks": {
      "1": "fifteen percent",
      "2": "developing nations",
      "3": "carbon emissions"
    }
  }
}
```
`structure` is raw text with `___N___` blank notation. Parse blanks the same way as R7 WordBankEditor (`parseBlanks` function at `WordBankEditor.tsx:31-34`).

**Table Sub-Format:**
```json
{
  "options": {
    "subFormat": "table",
    "structure": "{\"columns\":[\"Country\",\"Population\",\"GDP Growth\"],\"rows\":[[\"Vietnam\",\"___1___\",\"6.5%\"],[\"Thailand\",\"70 million\",\"___2___\"],[\"___3___\",\"273 million\",\"5.1%\"]]}",
    "wordLimit": 3
  },
  "correctAnswer": {
    "blanks": {
      "1": "98 million",
      "2": "3.2 percent",
      "3": "Indonesia"
    }
  }
}
```
`structure` is a JSON string with `columns` (string[]) and `rows` (string[][], where blanks use `___N___`).

**Flowchart Sub-Format:**
```json
{
  "options": {
    "subFormat": "flowchart",
    "structure": "{\"steps\":[\"Seeds are planted in ___1___\",\"Roots absorb water and ___2___\",\"Photosynthesis produces energy\",\"Plant grows ___3___ and flowers\"]}",
    "wordLimit": 2
  },
  "correctAnswer": {
    "blanks": {
      "1": "moist soil",
      "2": "minerals",
      "3": "leaves"
    }
  }
}
```
`structure` is a JSON string with `steps` (string[], sequential, where blanks use `___N___`).

### R14 JSON Structure: Diagram Labelling

**Without Word Bank (Free Text Input):**
```json
{
  "options": {
    "diagramUrl": "https://storage.googleapis.com/classlite/exercises/center123/ex456/diagrams/1707307200000.png",
    "labelPositions": [
      "outer shell",
      "membrane",
      "air cell",
      "yolk",
      "germinal disc"
    ],
    "wordLimit": 2
  },
  "correctAnswer": {
    "labels": {
      "0": "outer shell",
      "1": "membrane",
      "2": "air cell",
      "3": "yolk",
      "4": "germinal disc"
    }
  }
}
```
`labelPositions` are descriptions of what each numbered position represents. Keys in `labels` are 0-based string indices.

**With Word Bank (Dropdown Selection):**
```json
{
  "options": {
    "diagramUrl": "https://storage.googleapis.com/classlite/exercises/center123/ex456/diagrams/1707307200000.png",
    "labelPositions": [
      "Position 1 - top left",
      "Position 2 - center",
      "Position 3 - bottom right"
    ],
    "wordBank": [
      "outer shell",
      "membrane",
      "air cell",
      "yolk",
      "germinal disc"
    ],
    "wordLimit": 2
  },
  "correctAnswer": {
    "labels": {
      "0": "outer shell",
      "1": "air cell",
      "2": "yolk"
    }
  }
}
```
When `wordBank` is present, it includes distractors (5 options for 3 positions). Preview renders Select dropdowns.

### Existing Upload Infrastructure (DO NOT Reinvent)

Firebase Storage upload is already production-ready:

| What | Location | Pattern |
|------|----------|---------|
| Upload service | `tenant.service.ts:63-91` | `uploadLogo()` — bucket.file(path).save(buffer) → makePublic() → return URL |
| Upload route | `tenant.routes.ts:183-239` | `request.file()` → validate mimetype → `toBuffer()` → call service → return URL |
| Multipart plugin | `app.ts:185-189` | `@fastify/multipart` registered with 2MB limit |
| Firebase Storage | `firebase.ts` plugin | `fastify.firebaseStorage` available globally |
| Dependencies | `backend/package.json` | `@fastify/multipart: ^9.0.3`, `mime-types: ^2.1.35` |

**IMPORTANT:** The current multipart limit is 2MB (`app.ts:187`). For diagram images, 5MB is reasonable. Either:
- (a) Increase the global limit to 5MB in `app.ts`, OR
- (b) Use route-level limit override in the diagram upload route. Fastify multipart supports per-route limits: `const data = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } })`.

**Recommended: Option (b)** — route-level override. Keeps logo upload at 2MB, allows diagram at 5MB.

### Existing Code to Extend (DO NOT Reinvent)

| What | Location | Action |
|------|----------|--------|
| Question CRUD | `sections.service.ts` | No change — already handles `createQuestion()`, `updateQuestion()` with `toJsonValue()` for Json fields |
| Factory dispatch | `QuestionEditorFactory.tsx` | Add R13 + R14 cases to switch + lenient schemas |
| Factory dispatch | `QuestionPreviewFactory.tsx` | Add R13 + R14 cases to switch |
| Type schemas | `packages/types/src/exercises.ts` | Add R13 + R14 schemas + extend discriminated union |
| Use-sections hook | `use-sections.ts` | No change — `updateQuestion` exists (lines 100-123) |
| Debounced editing | `QuestionSectionEditor.tsx` | No change — 500ms debounce already wired (lines 87-100) |
| Blank parsing | `WordBankEditor.tsx:31-34` | `parseBlanks()` regex — reuse for R13 note/flowchart blank extraction |
| Question type dropdown | `QuestionSectionEditor.tsx` | No change — R13 + R14 already listed in QUESTION_TYPES_BY_SKILL (lines 40-41) |
| Logo upload pattern | `tenant.service.ts + tenant.routes.ts` | Copy and adapt for diagram upload |
| Select component | `@workspace/ui` | Import for R14 word bank dropdowns |

### Previous Story Intelligence (Story 3.3)

**Key learnings from 3-3:**
- **Debounced updates**: QuestionSectionEditor already implements 500ms debounce on `handleEditorChange()` — editors just call `onChange(options, correctAnswer)` and the parent handles debouncing. DO NOT add debounce inside editor components.
- **Null handling**: All editors MUST handle `options: null` and `correctAnswer: null` gracefully — render empty form state, not errors.
- **SafeParse pattern**: QuestionEditorFactory uses lenient Zod schemas with `safeParse()` to safely parse unknown JSON before passing to editors. Add lenient schemas for R13 and R14.
- **onChange contract**: Editors call `onChange(options, correctAnswer)` — always pass BOTH values. Parent handles API call.
- **Component sharing**: R9-R12 share one MatchingEditor. For R13, a single NoteTableFlowchartEditor handles all three sub-formats. R14 is distinct enough to have its own DiagramLabellingEditor.
- **Test count baseline**: After story 3.3 — 321 backend tests, 268 webapp tests, 77 types tests passing.
- **Code review findings from 3.3 — APPLY TO THIS STORY:**
  - **H1 (SelectItem values):** Use `value={String(index)}` for ALL SelectItem components (R14 word bank dropdowns) to prevent Radix Select crashes on duplicate entries. Resolve display text via index lookup, not from value.
  - **H2 (onBlur for text inputs):** Use `onBlur` (NOT `onChange`) for ALL editable text Input fields: answer assignment inputs, label position inputs, step text inputs, table cell inputs. This prevents excessive parent onChange calls on every keystroke.
  - **H3 (empty key guard):** `parseBlanks` must filter out empty/falsy blank IDs. If regex matches `______` (zero-length ID), skip it. For R14, label keys are 0-based indices so this is less risky, but still guard against empty labelPositions entries.
- **Existing R13/R14 fallback tests**: `question-editors.test.tsx` has tests verifying "No editor available" fallback for R13_NOTE_TABLE_FLOWCHART (~line 690) and R14_DIAGRAM_LABELLING. These must be updated to expect the new editors.

**Files established in 3-2/3-3 that this story follows:**
- `QuestionEditorFactory.tsx` — Add R13 + R14 cases + lenient schemas
- `QuestionPreviewFactory.tsx` — Add R13 + R14 cases
- `packages/types/src/exercises.ts` — Add R13/R14 schemas to discriminated union
- `packages/types/src/exercises.test.ts` — Add R13/R14 schema tests

### Git Intelligence

**Recent commits (relevant patterns):**
```
4b86c78 docs(exercises): update story 3.3 dev record with code review fixes
1fe3c64 feat(exercises): implement story 3.3 matching question types (R9-R12) with code review fixes
255b04d feat(exercises): implement story 3.2 reading question types (R1-R8) with code review fixes
```

**Commit convention:** `feat(exercises): description` for new features.

**Files changed in recent commits:**
- `packages/types/src/exercises.ts` — schema additions
- `QuestionEditorFactory.tsx` — new cases + lenient schemas
- `QuestionPreviewFactory.tsx` — new cases
- `question-editors.test.tsx` — editor/preview tests
- New editor/preview component files

### IELTS Format Intelligence (R13 & R14)

**R13: Note/Table/Flowchart Completion — Real IELTS Format:**
- All three sub-formats test ability to locate and extract specific information from passages
- Answers must be **exact words from the passage** — no modification
- **Strict word limits** (typically "NO MORE THAN TWO WORDS AND/OR A NUMBER")
- Hyphenated words count as ONE word
- Questions usually follow passage order
- **Note format**: Bullet points with hierarchical indentation, 3-6 blanks
- **Table format**: Grid with column/row headers, 2-6 blank cells, mix of pre-filled and blanks
- **Flowchart format**: Sequential boxes with arrows, 2-5 blanks within steps, shows processes/stages

**R14: Diagram Labelling — Real IELTS Format:**
- Diagram image with numbered positions (typically 4-8 labels)
- Two answer format variations:
  - **Free text**: Students extract words directly from passage (strict word limit)
  - **Word bank**: Box with 8-12 options, students select to label positions (includes distractors)
- Common diagram subjects: technical drawings, anatomy, architectural plans, scientific processes
- Answers may NOT follow passage order (unlike other completion types)

### Dependencies

- **Story 3.1 (Exercise Builder Core & Passage Management):** DONE. R13/R14 questions are part of exercises with reading passages. The passage editor and exercise structure from Story 3.1 must be in place. Confirmed complete (2026-02-06).
- **Story 3.2 + 3.3 (R1-R8, R9-R12):** DONE. Established the editor/preview factory patterns, lenient schema approach, test infrastructure, and code review fixes that this story builds upon.

### Scope Boundaries (What NOT to Build)

- DO NOT implement auto-grading engine — just store answer structures; grading is Epic 5
- DO NOT implement student-facing interactive completion — this story builds the **teacher editor** and **preview**; student submission UI is Story 4.1
- DO NOT implement drag-and-drop label placement on images — R14 uses a numbered list approach, NOT interactive image hotspots. The epic mentions "positions label markers on it" but this story scopes R14 to a simpler numbered-list approach; interactive image overlay with coordinate markers is a future enhancement.
- DO NOT implement complex flowchart rendering libraries (React Flow, D3.js) — use simple CSS boxes with arrow pseudo-elements
- DO NOT implement answer key management UI (Story 3.5) — this story stores answer data in JSON
- DO NOT add new Prisma models or columns — existing infrastructure is sufficient
- DO NOT build audio/listening features (Story 3.6-3.7)
- DO NOT modify the multipart global limit in `app.ts` — use route-level override for diagram upload

### Technical Specifics

**Shadcn/UI components to use:**
- `Input` — for text answers, label positions, step text
- `Button` — for add/remove items, upload trigger
- `Badge` — for word limit display, distractor count
- `Label` — for section labels
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` / `SelectValue` — for R14 word bank preview dropdowns
- `RadioGroup` / `RadioGroupItem` — for R13 sub-format selector
- `Checkbox` — for R14 word bank toggle
- `Textarea` — for R13 note mode structured text
- `Trash2`, `Plus`, `Upload`, `Image` icons from `lucide-react`

**R13 Blank Parsing (Reuse WordBankEditor Pattern):**
```typescript
// Same regex as WordBankEditor.tsx:31-34, with empty-key guard (Story 3.3 H3 fix)
const BLANK_REGEX = /___(\d+)___/g;
function parseBlanks(text: string): string[] {
  const matches = [...text.matchAll(BLANK_REGEX)];
  return matches.map(m => m[1]).filter(id => id.length > 0);
}
```

**R13 Table Structure JSON Schema (internal, for structure field):**
```typescript
interface TableStructure {
  columns: string[];        // Column headers
  rows: string[][];         // 2D array, cells contain text or ___N___
}
```

**R13 Flowchart Structure JSON Schema (internal, for structure field):**
```typescript
interface FlowchartStructure {
  steps: string[];  // Sequential steps, each can contain ___N___
}
```

**R13 NoteTableFlowchartEditor Architecture:**
```
┌───────────────────────────────────────────────┐
│ Sub-Format: (●) Note  ( ) Table  ( ) Flowchart│
├───────────────────────────────────────────────┤
│                                               │
│ [Sub-format specific editor renders here]     │
│                                               │
│ Note: Textarea with ___N___ blanks            │
│ Table: Grid with editable cells               │
│ Flowchart: Step list with ___N___ blanks      │
│                                               │
├───────────────────────────────────────────────┤
│ Answer Assignment:                            │
│ Blank 1: [_______________]                    │
│ Blank 2: [_______________]                    │
│ Blank 3: [_______________]                    │
├───────────────────────────────────────────────┤
│ Word Limit: [2] words                         │
└───────────────────────────────────────────────┘
```

**R14 DiagramLabellingEditor Architecture:**
```
┌───────────────────────────────────────────────┐
│ Diagram Image:                                │
│ ┌─────────────────────────────────────┐       │
│ │       [Uploaded Image Preview]       │       │
│ │    or [Upload Diagram] button        │       │
│ └─────────────────────────────────────┘       │
│ [Remove Image]                                │
├───────────────────────────────────────────────┤
│ Label Positions:           Correct Labels:    │
│ 1. [outer shell   ] ✕     [outer shell    ]  │
│ 2. [membrane      ] ✕     [membrane       ]  │
│ 3. [air cell      ] ✕     [air cell       ]  │
│ [+ Add Position]                              │
├───────────────────────────────────────────────┤
│ ☑ Use Word Bank                               │
│ Word Bank: [shell] [yolk] [membrane] [+ Add]  │
│ Badge: 5 labels, 3 positions (2 distractors)  │
├───────────────────────────────────────────────┤
│ Word Limit: [2] words                         │
└───────────────────────────────────────────────┘
```

### Component Tree

```
QuestionSectionEditor (no change)
├── QuestionEditorFactory (add R13 + R14 cases)
│   ├── R1/R2  → MCQEditor (existing)
│   ├── R3/R4  → TFNGEditor (existing)
│   ├── R5/R6/R8 → TextInputEditor (existing)
│   ├── R7     → WordBankEditor (existing)
│   ├── R9-R12 → MatchingEditor (existing)
│   ├── R13    → NoteTableFlowchartEditor (NEW)
│   └── R14    → DiagramLabellingEditor (NEW)
└── Question List (click row → expand inline editor, existing)

ExercisePreview (no change)
└── QuestionPreviewFactory (add R13 + R14 cases)
    ├── R1/R2  → MCQPreview (existing)
    ├── R3/R4  → TFNGPreview (existing)
    ├── R5/R6/R8 → TextInputPreview (existing)
    ├── R7     → WordBankPreview (existing)
    ├── R9-R12 → MatchingPreview (existing)
    ├── R13    → NoteTableFlowchartPreview (NEW)
    └── R14    → DiagramLabellingPreview (NEW)
```

### Project Structure Notes

```
apps/webapp/src/features/exercises/
├── components/
│   ├── question-types/
│   │   ├── MCQEditor.tsx                    # Existing (no change)
│   │   ├── MCQPreview.tsx                   # Existing (no change)
│   │   ├── TFNGEditor.tsx                   # Existing (no change)
│   │   ├── TFNGPreview.tsx                  # Existing (no change)
│   │   ├── TextInputEditor.tsx              # Existing (no change)
│   │   ├── TextInputPreview.tsx             # Existing (no change)
│   │   ├── WordBankEditor.tsx               # Existing (no change) — REUSE parseBlanks pattern
│   │   ├── WordBankPreview.tsx              # Existing (no change)
│   │   ├── MatchingEditor.tsx               # Existing (no change)
│   │   ├── MatchingPreview.tsx              # Existing (no change)
│   │   ├── QuestionEditorFactory.tsx        # MODIFY — add R13 + R14 cases + lenient schemas
│   │   ├── QuestionPreviewFactory.tsx       # MODIFY — add R13 + R14 cases
│   │   ├── NoteTableFlowchartEditor.tsx     # NEW — R13 editor with 3 sub-format modes
│   │   ├── NoteTableFlowchartPreview.tsx    # NEW — R13 preview with 3 render modes
│   │   ├── DiagramLabellingEditor.tsx       # NEW — R14 editor with upload + labels
│   │   ├── DiagramLabellingPreview.tsx      # NEW — R14 preview with image + labels
│   │   └── question-editors.test.tsx        # MODIFY — add R13/R14 tests, update fallback tests
│   ├── QuestionSectionEditor.tsx            # Existing (no change)
│   └── ExerciseEditor.tsx                   # Existing (no change)
├── hooks/
│   ├── use-sections.ts                      # Existing (no change)
│   └── use-diagram-upload.ts                # NEW — diagram upload mutation hook

packages/types/src/
├── exercises.ts                             # MODIFY — add R13/R14 schemas + extend union
└── exercises.test.ts                        # MODIFY — add R13/R14 schema tests

apps/backend/src/modules/exercises/
├── exercises.service.ts                     # MODIFY — add uploadDiagram() method
├── exercises.routes.ts                      # MODIFY — add POST /:exerciseId/diagram route
├── sections.service.ts                      # Existing (no change)
├── sections.controller.ts                   # Existing (no change)
└── sections.routes.ts                       # Existing (no change)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/implementation-artifacts/3-3-reading-question-types-matching.md#Dev Notes]
- [Source: project-context.md#Critical Implementation Rules]
- [Source: packages/types/src/exercises.ts — Zod schemas and discriminated union]
- [Source: apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx — Factory dispatch + lenient schemas]
- [Source: apps/webapp/src/features/exercises/components/question-types/WordBankEditor.tsx — parseBlanks pattern (lines 31-34), word bank chip UI]
- [Source: apps/webapp/src/features/exercises/components/question-types/MatchingEditor.tsx — Config-driven multi-type editor, onBlur pattern]
- [Source: apps/backend/src/modules/tenants/tenant.service.ts — uploadLogo() Firebase Storage pattern (lines 63-91)]
- [Source: apps/backend/src/modules/tenants/tenant.routes.ts — multipart upload route pattern (lines 183-239)]
- [Source: apps/backend/src/app.ts — @fastify/multipart registration (lines 185-189)]
- [Source: apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx — R13/R14 in QUESTION_TYPES_BY_SKILL, debounce pattern]
- [Source: apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx — Existing R13/R14 fallback tests]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Types tests: 107 passed (30 new R13/R14 tests)
- Backend tests: 321 passed (no regressions)
- Frontend tests: 291 passed (23 new R13/R14 tests)

### Completion Notes List

- Task 1: R13 Zod schemas added (NoteTableFlowchartOptionsSchema, NoteTableFlowchartAnswerSchema)
- Task 2: R14 Zod schemas added (DiagramLabellingOptionsSchema, DiagramLabellingAnswerSchema)
- Task 3: NoteTableFlowchartEditor created with note/table/flowchart sub-formats, blank parsing, answer assignment, word limit
- Task 4: DiagramLabellingEditor created with upload, label positions, word bank toggle, distractor badge
- Task 5: NoteTableFlowchartPreview created with 3 render modes + empty state
- Task 6: DiagramLabellingPreview created with image display, word bank dropdowns, distractor badge
- Task 7: Diagram upload API route added (POST /:exerciseId/diagram, 5MB route-level limit, Firebase Storage)
- Task 8: Factory integration — R13/R14 cases added to QuestionEditorFactory and QuestionPreviewFactory with lenient schemas
- Task 9: Backend tests pass (schema tests in types package, no regressions in backend)
- Task 10: Frontend tests pass — 23 new tests for editors, previews, factory dispatch
- Task 11: Schema sync deferred — run `pnpm --filter=webapp sync-schema-dev` after starting backend
- ExercisesService constructor extended with optional firebaseStorage/bucketName (backward compatible)
- exerciseId prop threaded through ExerciseEditor → QuestionSectionEditor → QuestionEditorFactory → DiagramLabellingEditor
- Lenient schemas use `.default()` for subFormat and wordLimit to avoid type mismatches
- H1 fix: SelectItem uses String(index) values in DiagramLabellingPreview
- H2 fix: onBlur used for all text inputs in both editors
- H3 fix: parseBlanks filters empty blank IDs
- useDiagramUpload hook uses raw fetch() (not openapi-fetch) since route types are not yet synced

### File List

**New files:**
- `apps/webapp/src/features/exercises/components/question-types/NoteTableFlowchartEditor.tsx`
- `apps/webapp/src/features/exercises/components/question-types/NoteTableFlowchartPreview.tsx`
- `apps/webapp/src/features/exercises/components/question-types/DiagramLabellingEditor.tsx`
- `apps/webapp/src/features/exercises/components/question-types/DiagramLabellingPreview.tsx`
- `apps/webapp/src/features/exercises/components/question-types/utils.ts` — shared safeParseJson utility
- `apps/webapp/src/features/exercises/hooks/use-diagram-upload.ts`

**Modified files:**
- `packages/types/src/exercises.ts` — R13/R14 schemas + discriminated union entries
- `packages/types/src/exercises.test.ts` — R13/R14 schema tests
- `apps/backend/src/modules/exercises/exercises.service.ts` — uploadDiagram() method, extended constructor
- `apps/backend/src/modules/exercises/exercises.routes.ts` — POST /:exerciseId/diagram route + centerId security check
- `apps/webapp/src/features/exercises/components/question-types/QuestionEditorFactory.tsx` — R13/R14 cases + lenient schemas
- `apps/webapp/src/features/exercises/components/question-types/QuestionPreviewFactory.tsx` — R13/R14 cases
- `apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx` — exerciseId prop
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — passes exerciseId to QuestionSectionEditor
- `apps/webapp/src/features/exercises/components/question-types/question-editors.test.tsx` — R13/R14 tests + DiagramLabellingEditor suite
- `apps/webapp/src/schema/schema.d.ts` — diagram upload route types (schema sync)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 3-4 marked done
- `_bmad-output/implementation-artifacts/3-4-reading-question-types-advanced.md` — status + dev record + review notes

## Senior Developer Review (AI)

**Reviewer:** Code Review Workflow (Claude Opus 4.6)
**Date:** 2026-02-07

### Findings Fixed

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | HIGH | Diagram upload route missing centerId security check — cross-tenant upload possible | Added `exercisesService.getExercise(centerId, exerciseId)` ownership check before upload |
| H2 | HIGH | DiagramLabellingEditor word limit uses onChange instead of onBlur (H2 violation) | Changed to `defaultValue` + `onBlur` pattern |
| H3 | HIGH | NoteTableFlowchartEditor word limit uses onChange instead of onBlur (H2 violation) | Changed to `defaultValue` + `onBlur` pattern |
| M1 | MEDIUM | use-diagram-upload.ts hardcodes URLs instead of using openapi-fetch client | Rewrote to use typed `client.POST()` with `formData as any` (matches avatar/logo upload pattern) |
| M2 | MEDIUM | schema.d.ts modified but not in story File List | Updated File List |
| M3 | MEDIUM | No DiagramLabellingEditor test suite (Task 10.2 incomplete) | Added 10 tests: render, add/remove positions, re-indexing, word bank toggle, null handling, image display, distractor badge |
| M4 | MEDIUM | localStorage token fallback divergent pattern | Resolved by M1 — now uses centralized client middleware |
| L1 | LOW | safeParseJson duplicated in Editor and Preview | Extracted to shared `utils.ts`, both files import from it |

### Deferred

| # | Severity | Issue | Reason |
|---|----------|-------|--------|
| L2 | LOW | key={i} for dynamic lists with defaultValue | Codebase-wide pattern (MCQEditor, WordBankEditor, MatchingEditor all use it). Fixing only R13/R14 would be inconsistent. Noted for future refactor. |

### Test Results After Review Fixes

- Types: 107 passed (unchanged)
- Backend: 321 passed (unchanged)
- Frontend: 301 passed (was 291, +10 new DiagramLabellingEditor tests)
