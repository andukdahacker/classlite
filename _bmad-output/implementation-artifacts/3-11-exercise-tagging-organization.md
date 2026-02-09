# Story 3.11: Exercise Tagging & Organization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to tag and categorize exercises by band level and topic,
so that I can organize my content library and track student progress by skill.

## Acceptance Criteria

1. **AC1: Skill Tag (Required)** — Every exercise must be tagged with a skill: Reading, Listening, Writing, or Speaking. **Already implemented** — the `skill` field on Exercise is required and set at creation time (see `ExerciseSkillSchema`). No work needed.
2. **AC2: Band Level Tag** — Optional target band level per exercise: `"4-5"`, `"5-6"`, `"6-7"`, `"7-8"`, `"8-9"`. Stored as a nullable string enum on the Exercise model. Only one band level per exercise.
3. **AC3: Topic Tags** — Free-form topic tags (e.g., "Environment", "Technology", "Health"). An exercise can have zero or many topic tags. Tags are center-scoped (each center has its own tag vocabulary). Stored via a many-to-many join.
4. **AC4: Question Type Tags** — Auto-generated based on question types used in the exercise's sections. **Already available** — `QuestionSection.sectionType` stores the `IeltsQuestionType` for each section. The frontend can derive these from loaded sections (no DB field needed). Display only.
5. **AC5: Filter by Tags** — Exercise list page (`/:centerId/exercises`) can filter by band level and topic tags in addition to existing skill/status filters.
6. **AC6: Tag Management** — Settings page for managing custom topic tags (add, rename, merge, delete) at `/:centerId/settings/tags`.

## Scope Clarification

**What IS built in this story:**
- Prisma schema for `ExerciseTag` model and `bandLevel` field on Exercise
- TypeScript Zod schemas for band levels, tags, and tag operations
- Backend service + controller + routes for tag CRUD and exercise-tag assignment
- Frontend `TagsSettingsPage` for center-wide tag management
- Frontend `TagSelector` component in ExerciseEditor for assigning tags and band level
- Frontend filter additions on the exercises list page
- Tests for all layers

**What is NOT built (out of scope):**
- Exercise library management (Story 3.14) — we add filtering but not grid view, archive/restore, bulk actions, or usage analytics
- Exercise assignment (Story 3.15) — no assignment features
- Student-facing views (Story 3.16) — no student dashboard
- AI content generation (Story 3.12) — no AI features

## Tasks / Subtasks

### Task 1: Prisma Schema — Band Level & Topic Tags (AC: 2, 3)

- [x] 1.1 Add `bandLevel` field to Exercise model:
  ```prisma
  bandLevel String? @map("band_level")
  ```
  No default — null means untagged. Validated by Zod enum on input.

- [x] 1.2 Create `ExerciseTag` model for center-scoped topic tags:
  ```prisma
  model ExerciseTag {
    id        String   @id @default(cuid())
    centerId  String   @map("center_id")
    name      String
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")

    tagAssignments ExerciseTagAssignment[]

    @@unique([centerId, name])
    @@index([centerId])
    @@map("exercise_tag")
  }
  ```

- [x] 1.3 Create `ExerciseTagAssignment` join table:
  ```prisma
  model ExerciseTagAssignment {
    id         String   @id @default(cuid())
    exerciseId String   @map("exercise_id")
    tagId      String   @map("tag_id")
    centerId   String   @map("center_id")
    createdAt  DateTime @default(now()) @map("created_at")

    exercise Exercise    @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
    tag      ExerciseTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

    @@unique([exerciseId, tagId])
    @@index([exerciseId])
    @@index([tagId])
    @@index([centerId])
    @@map("exercise_tag_assignment")
  }
  ```

- [x] 1.4 Add relations and field to Exercise model:
  ```prisma
  // In Exercise model, add:
  bandLevel      String?                @map("band_level")
  tagAssignments ExerciseTagAssignment[]
  ```

- [x] 1.5 Add index for band level filtering:
  ```prisma
  // In Exercise model, add index:
  @@index([centerId, bandLevel])
  ```

- [x] 1.6 **CRITICAL: Register new models in TENANTED_MODELS** — In `packages/db/src/tenanted-client.ts`, add `"ExerciseTag"` and `"ExerciseTagAssignment"` to the `TENANTED_MODELS` array (currently at lines 9-23). Without this, `getTenantedClient()` will NOT auto-inject `centerId` filters, breaking multi-tenancy isolation.
  ```ts
  const TENANTED_MODELS = [
    // ... existing models ...
    "Exercise",
    "QuestionSection",
    "Question",
    "ExerciseTag",           // NEW
    "ExerciseTagAssignment", // NEW
  ];
  ```

- [x] 1.7 Run `pnpm --filter=db db:generate && pnpm --filter=db db:push` to apply schema changes.

### Task 2: TypeScript Schemas — Tag Types (AC: 2, 3, 4, 5)

- [x] 2.1 In `packages/types/src/exercises.ts`, add `BandLevelSchema`:
  ```ts
  export const BandLevelSchema = z.enum(["4-5", "5-6", "6-7", "7-8", "8-9"]);
  export type BandLevel = z.infer<typeof BandLevelSchema>;
  ```

- [x] 2.2 Add `ExerciseTagSchema` (include optional `_count` for tag management page):
  ```ts
  export const ExerciseTagSchema = z.object({
    id: z.string(),
    centerId: z.string(),
    name: z.string(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
    _count: z.object({
      tagAssignments: z.number(),
    }).optional(),
  });
  export type ExerciseTag = z.infer<typeof ExerciseTagSchema>;
  ```

- [x] 2.3 Add `CreateExerciseTagSchema` and `UpdateExerciseTagSchema`:
  ```ts
  export const CreateExerciseTagSchema = z.object({
    name: z.string().min(1).max(50).trim(),
  });
  export type CreateExerciseTagInput = z.infer<typeof CreateExerciseTagSchema>;

  export const UpdateExerciseTagSchema = z.object({
    name: z.string().min(1).max(50).trim(),
  });
  export type UpdateExerciseTagInput = z.infer<typeof UpdateExerciseTagSchema>;
  ```

- [x] 2.4 Add `MergeExerciseTagsSchema` and `SetExerciseTagsSchema`:
  ```ts
  export const MergeExerciseTagsSchema = z.object({
    sourceTagId: z.string(),
    targetTagId: z.string(),
  });
  export type MergeExerciseTagsInput = z.infer<typeof MergeExerciseTagsSchema>;

  export const SetExerciseTagsSchema = z.object({
    tagIds: z.array(z.string()),
  });
  export type SetExerciseTagsInput = z.infer<typeof SetExerciseTagsSchema>;
  ```

- [x] 2.5 Add `bandLevel` and `tags` to `ExerciseSchema` (response schema). Add these fields alongside the existing fields:
  ```ts
  bandLevel: z.string().nullable().optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  ```
  **Note:** `tags` is a flat array of `{ id, name }` — the controller transforms the nested Prisma `tagAssignments` into this flat shape (see Task 4).

- [x] 2.6 Add `bandLevel` to `CreateExerciseSchema`:
  ```ts
  bandLevel: BandLevelSchema.nullable().optional(),
  ```

- [x] 2.7 Add `bandLevel` to `UpdateExerciseSchema`:
  ```ts
  bandLevel: BandLevelSchema.nullable().optional(),
  ```

- [x] 2.8 Add `bandLevel` to `AutosaveExerciseSchema`:
  ```ts
  bandLevel: BandLevelSchema.nullable().optional(),
  ```

- [x] 2.9 Add response schemas using the project's `createResponseSchema` pattern (from `packages/types/src/response.ts`):
  ```ts
  export const ExerciseTagResponseSchema = createResponseSchema(ExerciseTagSchema);
  export const ExerciseTagListResponseSchema = createResponseSchema(z.array(ExerciseTagSchema));
  ```
  **IMPORTANT:** `createResponseSchema` produces `{ data: T | null, message: string }` — `message` is REQUIRED, not optional. Do NOT hand-roll response schemas.

- [x] 2.10 No changes needed to `ExerciseListResponseSchema` — it wraps `ExerciseSchema` via `createResponseSchema(z.array(ExerciseSchema))`, and since we added `tags` to `ExerciseSchema` in 2.5, it's automatically included.

### Task 3: Backend — Tag Service (AC: 3, 6)

- [x] 3.1 Create `apps/backend/src/modules/exercises/tags.service.ts` with methods:

  ```ts
  export class TagsService {
    constructor(private readonly prisma: PrismaClient) {}

    // List all tags for a center (with exercise counts for tag management)
    async listTags(centerId: string): Promise<ExerciseTag[]>

    // Create a new tag (catch Prisma P2002 for duplicate → AppError.conflict("Tag already exists"))
    async createTag(centerId: string, input: CreateExerciseTagInput): Promise<ExerciseTag>

    // Rename a tag (catch P2002 for duplicate name)
    async updateTag(centerId: string, tagId: string, input: UpdateExerciseTagInput): Promise<ExerciseTag>

    // Delete a tag (cascades to assignments via onDelete: Cascade)
    async deleteTag(centerId: string, tagId: string): Promise<void>

    // Merge source tag into target (reassign all exercises, then delete source)
    async mergeTags(centerId: string, input: MergeExerciseTagsInput): Promise<ExerciseTag>

    // Assign tags to an exercise (batch — accepts array of tagIds)
    async setExerciseTags(centerId: string, exerciseId: string, tagIds: string[]): Promise<void>

    // Get tags for an exercise
    async getExerciseTags(centerId: string, exerciseId: string): Promise<ExerciseTag[]>
  }
  ```

- [x] 3.2 Constructor pattern — inject `PrismaClient` only (tags don't need Firebase Storage):
  ```ts
  constructor(private readonly prisma: PrismaClient) {}
  ```
  Use `getTenantedClient(this.prisma, centerId)` for ALL queries.

- [x] 3.3 `listTags` — include exercise counts for the tag management page:
  ```ts
  return db.exerciseTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tagAssignments: true } } },
  });
  ```

- [x] 3.4 For `mergeTags`: In a `this.prisma.$transaction()`, first delete assignments from source that would be duplicates (exercise already has target tag), then update remaining source assignments to point to target, then delete the source tag. Return the target tag.

- [x] 3.5 For `setExerciseTags`: Use a "delete all + create new" pattern inside a transaction — `deleteMany({ exerciseId })` then `createMany(tagIds.map(tagId => ({ exerciseId, tagId, centerId })))`. This is simpler and atomic.

### Task 4: Backend — Tag Controller (AC: 3, 6)

- [x] 4.1 Create `apps/backend/src/modules/exercises/tags.controller.ts` following the `ExercisesController` pattern:
  ```ts
  export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    async listTags(user: JwtPayload): Promise<{ data: ExerciseTag[]; message: string }> {
      const centerId = user.centerId;
      if (!centerId) throw AppError.unauthorized("Center ID missing from token");
      const tags = await this.tagsService.listTags(centerId);
      return { data: tags, message: "Tags retrieved successfully" };
    }

    async createTag(input: CreateExerciseTagInput, user: JwtPayload): Promise<{ data: ExerciseTag; message: string }> { ... }
    async updateTag(tagId: string, input: UpdateExerciseTagInput, user: JwtPayload): Promise<{ data: ExerciseTag; message: string }> { ... }
    async deleteTag(tagId: string, user: JwtPayload): Promise<{ data: null; message: string }> { ... }
    async mergeTags(input: MergeExerciseTagsInput, user: JwtPayload): Promise<{ data: ExerciseTag; message: string }> { ... }
  }
  ```
  **CRITICAL:** Every method wraps the service result in `{ data, message }` format. This is the project's standard response pattern — do NOT return raw service results from routes.

### Task 5: Backend — Tag Routes (AC: 3, 6)

- [x] 5.1 Create `apps/backend/src/modules/exercises/tags.routes.ts` for **center-wide tag CRUD** only:
  ```
  GET    /                    → listTags (all center tags with counts)
  POST   /                    → createTag
  PATCH  /:tagId              → updateTag (rename)
  DELETE /:tagId              → deleteTag
  POST   /merge               → mergeTags
  ```
  This file is registered at prefix `/api/v1/tags` (see Task 5.4).

- [x] 5.2 Follow the Fastify plugin pattern from `exercises.routes.ts`:
  ```ts
  export async function tagsRoutes(fastify: FastifyInstance) {
    const api = fastify.withTypeProvider<ZodTypeProvider>();
    const tagsService = new TagsService(fastify.prisma);
    const tagsController = new TagsController(tagsService);
    fastify.addHook("preHandler", authMiddleware);

    api.get("/", {
      schema: {
        response: { 200: ExerciseTagListResponseSchema, ... },
      },
      preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
      handler: async (request, reply) => { ... },
    });
    // ... other endpoints
  }
  ```

- [x] 5.3 Add **per-exercise tag assignment endpoints** to `exercises.routes.ts` (NOT to tags.routes.ts — these operate on exercises, and the route prefix is `/api/v1/exercises`):
  ```
  PUT  /:id/tags   → setExerciseTags (replace all tags on an exercise)
  GET  /:id/tags   → getExerciseTags
  ```
  Instantiate `TagsService` alongside `ExercisesService` in the existing `exercisesRoutes` function. These endpoints use the same `authMiddleware` and `requireRole` as other exercise routes.

- [x] 5.4 Register tag routes in `apps/backend/src/app.ts`:
  ```ts
  // Add import at top (near line 21):
  import { tagsRoutes } from "./modules/exercises/tags.routes.js";

  // Add registration (after exercisesRoutes, ~line 207):
  await app.register(tagsRoutes, { prefix: "/api/v1/tags" });
  ```

- [x] 5.5 RBAC: Tag management (create/update/delete/merge) requires `["OWNER", "ADMIN", "TEACHER"]`. Tag listing requires `["OWNER", "ADMIN", "TEACHER"]`. Exercise tag assignment (set/get) uses the same role check as other exercise endpoints.

### Task 6: Backend — Update Exercise Service for Band Level & Tags in Response (AC: 2, 5)

- [x] 6.1 Update `EXERCISE_INCLUDE` constant (line 11-19 of `exercises.service.ts`) to include tag assignments:
  ```ts
  const EXERCISE_INCLUDE = {
    createdBy: { select: { id: true, name: true } },
    sections: {
      orderBy: { orderIndex: "asc" as const },
      include: {
        questions: { orderBy: { orderIndex: "asc" as const } },
      },
    },
    tagAssignments: {
      select: { tag: { select: { id: true, name: true } } },
    },
  };
  ```
  This is used by `createExercise`, `updateDraftExercise`, `getExercise`.

- [x] 6.2 **ALSO update the inline include inside `listExercises`** (line 56-65). The list endpoint uses its OWN include (NOT `EXERCISE_INCLUDE`), with `_count` for question counts:
  ```ts
  return await db.exercise.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
      sections: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { questions: true } } },
      },
      tagAssignments: {
        select: { tag: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  ```

- [x] 6.3 **Add tag data transformation** in `ExercisesController` (or as a helper). Prisma returns `tagAssignments: [{ tag: { id, name } }]` but the schema expects `tags: [{ id, name }]`. Add a transform utility:
  ```ts
  function flattenTags(exercise: any) {
    const { tagAssignments, ...rest } = exercise;
    return {
      ...rest,
      tags: tagAssignments?.map((a: { tag: { id: string; name: string } }) => a.tag) ?? [],
    };
  }
  ```
  Apply this in `ExercisesController` methods that return exercises: `listExercises`, `getExercise`, `createExercise`, `updateExercise`. For list: `exercises.map(flattenTags)`. For single: `flattenTags(exercise)`.

- [x] 6.4 Update `listExercises` method to accept additional filters:
  ```ts
  filters?: {
    skill?: string;
    status?: string;
    bandLevel?: string;
    tagIds?: string[];
  }
  ```

- [x] 6.5 Add `bandLevel` filter — simple `where: { bandLevel }` clause:
  ```ts
  if (filters?.bandLevel) where.bandLevel = filters.bandLevel;
  ```

- [x] 6.6 Add `tagIds` filter — OR semantics (exercise has ANY of the selected tags):
  ```ts
  if (filters?.tagIds?.length) {
    where.tagAssignments = { some: { tagId: { in: filters.tagIds } } };
  }
  ```

- [x] 6.7 Update `exercises.routes.ts` list endpoint querystring schema to accept `bandLevel` and `tagIds`:
  ```ts
  querystring: z.object({
    skill: ExerciseSkillSchema.optional(),
    status: ExerciseStatusSchema.optional(),
    bandLevel: BandLevelSchema.optional(),
    tagIds: z.string().optional(), // Comma-separated tag IDs
  }),
  ```
  Parse `tagIds` in the route handler: `const tagIdsArray = tagIds?.split(",").filter(Boolean);`

- [x] 6.8 Update `createExercise` and `updateDraftExercise` in `exercises.service.ts` to handle `bandLevel`:
  ```ts
  // In createExercise:
  bandLevel: input.bandLevel ?? null,

  // In updateDraftExercise (conditional spread):
  ...("bandLevel" in input && input.bandLevel !== undefined && { bandLevel: input.bandLevel }),
  ```

### Task 7: Frontend — Tag API Hooks (AC: 3, 5, 6)

- [x] 7.1 Create `apps/webapp/src/features/exercises/hooks/use-tags.ts`:
  ```ts
  export const tagsKeys = {
    all: ["tags"] as const,
    list: () => [...tagsKeys.all, "list"] as const,
  };

  export function useTags(centerId?: string | null) {
    // GET /api/v1/tags/ → returns { data: ExerciseTag[], message }
    // createTag: POST /api/v1/tags/ → invalidates tagsKeys.list()
    // updateTag: PATCH /api/v1/tags/:tagId → invalidates tagsKeys.list()
    // deleteTag: DELETE /api/v1/tags/:tagId → invalidates tagsKeys.list()
    // mergeTags: POST /api/v1/tags/merge → invalidates tagsKeys.list()
    return { tags, isLoading, createTag, updateTag, deleteTag, mergeTags };
  }

  export function useExerciseTags(centerId?: string | null, exerciseId?: string) {
    // GET /api/v1/exercises/:id/tags → returns { data: ExerciseTag[], message }
    // setExerciseTags: PUT /api/v1/exercises/:id/tags → invalidates:
    //   - exercisesKeys.lists() (exercise list includes tags now)
    //   - exercisesKeys.detail(exerciseId)
    return { exerciseTags, isLoading, setExerciseTags };
  }
  ```

- [x] 7.2 Use `openapi-fetch` client (same as `use-exercises.ts` and `use-rooms.ts`) for type-safe API calls.

- [x] 7.3 Invalidate `exercisesKeys.lists()` when tags are assigned/removed (since exercise list now includes tags).

### Task 8: Frontend — TagSelector in ExerciseEditor (AC: 2, 3, 4)

- [x] 8.1 Create `apps/webapp/src/features/exercises/components/TagSelector.tsx`:
  - **Band Level section:**
    - Select dropdown with options: None (clears to null), "4-5", "5-6", "6-7", "7-8", "8-9"
    - Label: "Target Band Level"
    - On change, call `onBandLevelChange(value | null)`
  - **Topic Tags section:**
    - Combobox/multi-select using shadcn `Popover` + `Command` (from `@workspace/ui`)
    - Shows available center tags from `useTags()` hook
    - Selected tags displayed as removable `Badge` chips below the combobox
    - **Inline tag creation flow:** When user types a name that doesn't match any existing tag, show a "Create '[name]'" option at bottom of list. On click: (1) call `createTag({ name })` from `useTags()` hook, (2) await the returned tag ID, (3) add new ID to selected tagIds, (4) call `onTagsChange(updatedTagIds)`. Handle loading state during creation.
    - On selection change, call `onTagsChange(tagIds[])`
  - **Question Type Tags section (read-only):**
    - Display auto-generated question type `Badge` components derived from exercise sections
    - Use the `QUESTION_TYPE_LABELS` mapping (see Dev Notes below)
    - Variant: `outline` + muted styling. No user interaction — purely informational

- [x] 8.2 Props interface:
  ```ts
  interface TagSelectorProps {
    centerId: string;
    exerciseId: string;
    bandLevel: string | null;
    selectedTagIds: string[];
    questionTypes: IeltsQuestionType[];  // Derived from sections
    onBandLevelChange: (v: string | null) => void;
    onTagsChange: (tagIds: string[]) => void;
  }
  ```

- [x] 8.3 Use shadcn components: `Select` for band level, `Badge` for tag chips, `Popover` + `Command` + `CommandInput` + `CommandList` + `CommandItem` + `CommandEmpty` for tag multi-select. Follow existing Select patterns from exercises-page.tsx.

### Task 9: Frontend — ExerciseEditor Integration (AC: 2, 3, 4)

- [x] 9.1 Add state for `bandLevel`:
  ```ts
  const [bandLevel, setBandLevel] = useState<string | null>(null);
  ```

- [x] 9.2 Load `bandLevel` from exercise in the existing useEffect (alongside other field loads ~line 385):
  ```ts
  setBandLevel(exercise.bandLevel ?? null);
  ```

- [x] 9.3 Include `bandLevel` in the autosave payload (inside `scheduleAutosave` callback ~line 436) AND add `bandLevel` to the `useCallback` dependency array (~line 470):
  ```ts
  // In autosave payload:
  bandLevel,
  // In useCallback dependency array:
  // ..., enablePause, bandLevel, autosave, exercise]
  ```
  Also add `bandLevel` to the `useEffect` trigger dependency array (~line 476).

- [x] 9.4 Add `useExerciseTags` hook for topic tags. Tags are saved via `setExerciseTags` API (not autosave) — they are a separate entity:
  ```ts
  const { exerciseTags, setExerciseTags } = useExerciseTags(centerId, id);
  ```

- [x] 9.5 Render `TagSelector` in the editor. **Placement: AFTER `TimerSettingsEditor` (~line 993) and BEFORE the Question Sections div (~line 995).** Wrap in `isEditing && id` guard:
  ```tsx
  {isEditing && id && centerId && (
    <div className="max-w-3xl">
      <TagSelector
        centerId={centerId}
        exerciseId={id}
        bandLevel={bandLevel}
        selectedTagIds={exerciseTags?.map(t => t.id) ?? []}
        questionTypes={exercise?.sections?.map(s => s.sectionType).filter(Boolean) ?? []}
        onBandLevelChange={(v) => { setBandLevel(v); userHasEdited.current = true; }}
        onTagsChange={(tagIds) => setExerciseTags({ tagIds })}
      />
    </div>
  )}
  ```

- [x] 9.6 **No ExercisePreview changes needed** — tagging is metadata, not student-facing content.

### Task 10: Frontend — Exercise List Filter Updates (AC: 5)

- [x] 10.1 In `exercises-page.tsx`, add band level filter state:
  ```ts
  const [bandLevelFilter, setBandLevelFilter] = useState<BandLevel | "ALL">("ALL");
  ```
  Add Select dropdown in the same filter row as skill/status (between status and search).

- [x] 10.2 Add topic tag filter state:
  ```ts
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  ```
  Use multi-select combobox (Popover + Command pattern, same as TagSelector) showing center tags from `useTags()`.

- [x] 10.3 Update `filters` useMemo to include new filters:
  ```ts
  const filters = useMemo(() => {
    const f: ExerciseFilters = {};
    if (skillFilter !== "ALL") f.skill = skillFilter;
    if (statusFilter !== "ALL") f.status = statusFilter;
    if (bandLevelFilter !== "ALL") f.bandLevel = bandLevelFilter;
    if (tagFilter.length > 0) f.tagIds = tagFilter.join(",");
    return f;
  }, [skillFilter, statusFilter, bandLevelFilter, tagFilter]);
  ```

- [x] 10.4 Update `ExerciseFilters` type in `use-exercises.ts`:
  ```ts
  type ExerciseFilters = {
    skill?: ExerciseSkill;
    status?: ExerciseStatus;
    bandLevel?: BandLevel;
    tagIds?: string;  // Comma-separated for query param
  };
  ```

- [x] 10.5 Display tags in exercise table rows:
  - Add "Band" and "Tags" columns after "Skill" column
  - Band level as colored `Badge` variant="outline" (e.g., "6-7")
  - Topic tags as small `Badge` variant="secondary" chips (from `exercise.tags`)
  - Question type badges NOT in the table (too much noise) — only shown in ExerciseEditor

### Task 11: Frontend — Tag Management Settings Page (AC: 6)

- [x] 11.1 Create `apps/webapp/src/features/settings/pages/TagsSettingsPage.tsx` following the `RoomsPage` pattern:
  - **State:** `newTagName`, `editingId`, `editingName` (same as RoomsPage)
  - **Hook:** `useTags(user?.centerId)` for CRUD operations
  - **Add section:** Input + "Add Tag" Button (same layout as RoomsPage add room)
  - **Tag list:** Border-separated items showing: Tag Name, Exercise Count (`tag._count.tagAssignments`), Edit/Merge/Delete action icons
  - **Rename:** Click edit icon → inline Input with check/X buttons (same as RoomsPage inline edit)
  - **Delete:** `AlertDialog` confirmation — "Delete tag '[name]'? This will remove it from X exercises."
  - **Merge:** `Dialog` with target tag `Select` dropdown — "Merge '[source]' into [target]? X exercises will be updated." On confirm, call `mergeTags({ sourceTagId, targetTagId })`.

- [x] 11.2 Register in settings navigation — update `apps/webapp/src/features/settings/config/settings-nav.ts`:
  ```ts
  { id: "tags", label: "Tags", path: "tags", order: 2.7 },
  ```
  Order 2.7 places it after Rooms (2.5) and before Integrations (3).

- [x] 11.3 Add route in `apps/webapp/src/App.tsx` inside the settings parent route (~line 107, after the rooms route):
  ```tsx
  <Route path="tags" element={<TagsSettingsPage />} />
  ```
  Import `TagsSettingsPage` at the top of the file.

- [x] 11.4 Use shadcn components: `Button`, `Input`, `AlertDialog`, `Dialog`, `Select`, `Badge`. Follow RoomsPage patterns exactly for consistent UX.

### Task 12: Tests (AC: all)

- [x] 12.1 `packages/types/src/exercises.test.ts` — Add tests for:
  - `BandLevelSchema` validation (accepts "4-5" through "8-9", rejects "3-4", "9-10", empty string)
  - `ExerciseTagSchema` validation
  - `CreateExerciseTagSchema` validation (min 1 char, max 50, trimmed, rejects empty)
  - `MergeExerciseTagsSchema` validation
  - `SetExerciseTagsSchema` validation (accepts empty array, array of strings)
  - `ExerciseSchema` with `bandLevel` and `tags` fields
  - `CreateExerciseSchema` / `UpdateExerciseSchema` / `AutosaveExerciseSchema` with `bandLevel`

- [x] 12.2 `apps/backend/src/modules/exercises/tags.service.test.ts` — Add tests for:
  - `listTags` returns center-scoped tags with `_count`
  - `createTag` creates tag, catches P2002 for duplicate names
  - `updateTag` renames tag, catches P2002 for duplicate names
  - `deleteTag` removes tag (assignments cascade)
  - `mergeTags` reassigns exercises, handles duplicate assignments, deletes source
  - `setExerciseTags` replaces exercise tags atomically (delete all + create new)
  - `getExerciseTags` returns tags for a specific exercise

- [x] 12.3 `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add tests for:
  - `createExercise` with `bandLevel` field
  - `updateDraftExercise` with `bandLevel` field
  - `listExercises` with `bandLevel` filter
  - `listExercises` with `tagIds` filter (OR semantics)
  - `listExercises` response includes `tagAssignments` data

- [x] 12.4 `apps/webapp/src/features/exercises/components/TagSelector.test.tsx` — Add tests for:
  - Renders band level selector with all 5 options + "None"
  - Band level change fires `onBandLevelChange` with correct value
  - Clearing band level fires `onBandLevelChange(null)`
  - Displays available tags from center
  - Tag selection/deselection fires `onTagsChange` with updated ID array
  - Question type badges render from sections data
  - Inline tag creation: typing new name shows "Create" option

- [x] 12.5 `apps/webapp/src/features/settings/pages/TagsSettingsPage.test.tsx` — Add tests for:
  - Renders tag list with names and exercise counts
  - Add tag form creates tag and resets input
  - Rename inline edit saves on Enter/check click
  - Delete confirmation dialog appears and calls deleteTag
  - Merge dialog shows target selector and calls mergeTags

- [x] 12.6 Run full test suite: `pnpm --filter=types test && pnpm --filter=backend test && pnpm --filter=webapp test` — all green.

### Task 13: Schema Sync (AC: all)

- [x] 13.1 Start backend dev server: `pnpm --filter=backend dev`
- [x] 13.2 Run `pnpm --filter=webapp sync-schema-dev` to regenerate OpenAPI types for new tag endpoints and bandLevel field.
- [x] 13.3 Verify `apps/webapp/src/schema/schema.d.ts` includes new tag endpoints and bandLevel field.

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: `tags.service.ts` handles DB logic. `tags.controller.ts` wraps results in `{ data, message }`. `tags.routes.ts` handles HTTP (Fastify request/reply, error mapping). This matches `exercises.service.ts` → `exercises.controller.ts` → `exercises.routes.ts`.
- **Multi-tenancy**: All tag queries use `getTenantedClient(centerId)`. Tags are center-scoped via `centerId` + unique constraint on `[centerId, name]`. Both `ExerciseTag` and `ExerciseTagAssignment` MUST be in `TENANTED_MODELS`.
- **Zod validation**: All new fields/endpoints validated via Zod schemas in `packages/types`.
- **Response format**: Always `{ data: T | null, message: string }` via `createResponseSchema()`. Never return raw service results.

### Key Implementation Patterns (from Stories 3.6-3.10)

- **Prisma model pattern**: All models use `@@map("snake_case")`, columns use `@map("snake_case")`. Always add `centerId` with `@@index([centerId])`.
- **Exercise-level field pattern**: `bandLevel` follows the same pattern as `timerPosition`, `playbackMode`, etc. — nullable string field, validated by Zod enum on input, stored as plain string.
- **Conditional spread in service**: `updateDraftExercise` uses `"fieldName" in input && input.fieldName !== undefined && { ... }` pattern.
- **State management in ExerciseEditor**: useState per field, load from exercise in useEffect, include in autosave payload, wire onChange with `userHasEdited.current = true`.
- **Frontend hook pattern**: Follow `use-exercises.ts` and `use-rooms.ts` — query keys factory, TanStack Query `useQuery`/`useMutation`, `onSuccess` invalidates relevant keys, return memoized methods. Use `openapi-fetch` `client.GET/POST/PATCH/DELETE`.
- **Settings page pattern**: Follow `RoomsPage` — `newItemName` state, `editingId`/`editingName` for inline edit, `AlertDialog` for delete confirmation, toast for success feedback.

### Band Level vs Tags: Two Different Mechanisms

- **Band Level** is a single-value enum field on Exercise (like `skill` or `status`). It persists via autosave just like other exercise fields. Simple `Select` dropdown in the editor.
- **Topic Tags** are a many-to-many relation via `ExerciseTagAssignment`. They are saved via a dedicated `PUT /api/v1/exercises/:id/tags` endpoint, NOT via autosave. The `TagSelector` component calls `setExerciseTags` directly on change.
- **Question Type Tags** are not stored — they are derived from `section.sectionType` values at render time. Read-only display.

### Tag Data Shape Transformation

Prisma returns `tagAssignments: [{ tag: { id: string, name: string } }]` (nested join table). The frontend schema expects `tags: [{ id: string, name: string }]` (flat array). The `ExercisesController` MUST transform this before returning responses. Use a helper:
```ts
function flattenTags(exercise: any) {
  const { tagAssignments, ...rest } = exercise;
  return { ...rest, tags: tagAssignments?.map((a: any) => a.tag) ?? [] };
}
```
Apply to ALL controller methods that return exercises: `listExercises` (map over array), `getExercise`, `createExercise`, `updateExercise`.

### Question Type Human-Readable Labels

Define a mapping constant in `TagSelector.tsx` for AC4 display:
```ts
const QUESTION_TYPE_LABELS: Record<string, string> = {
  R1_MCQ_SINGLE: "MCQ Single",
  R2_MCQ_MULTI: "MCQ Multi",
  R3_TFNG: "TFNG",
  R4_YNNG: "YNNG",
  R5_SENTENCE_COMPLETION: "Sentence Completion",
  R6_SHORT_ANSWER: "Short Answer",
  R7_SUMMARY_WORD_BANK: "Summary (Word Bank)",
  R8_SUMMARY_PASSAGE: "Summary (Passage)",
  R9_MATCHING_HEADINGS: "Matching Headings",
  R10_MATCHING_INFORMATION: "Matching Info",
  R11_MATCHING_FEATURES: "Matching Features",
  R12_MATCHING_SENTENCE_ENDINGS: "Matching Endings",
  R13_NOTE_TABLE_FLOWCHART: "Note/Table/Flowchart",
  R14_DIAGRAM_LABELLING: "Diagram Label",
  L1_FORM_NOTE_TABLE: "Form/Note/Table",
  L2_MCQ: "MCQ",
  L3_MATCHING: "Matching",
  L4_MAP_PLAN_LABELLING: "Map/Plan Label",
  L5_SENTENCE_COMPLETION: "Sentence Completion",
  L6_SHORT_ANSWER: "Short Answer",
  W1_TASK1_ACADEMIC: "Task 1 Academic",
  W2_TASK1_GENERAL: "Task 1 General",
  W3_TASK2_ESSAY: "Task 2 Essay",
  S1_PART1_QA: "Part 1 Q&A",
  S2_PART2_CUE_CARD: "Part 2 Cue Card",
  S3_PART3_DISCUSSION: "Part 3 Discussion",
};
```

### Tag Name Uniqueness

Tags are unique per center (`@@unique([centerId, name])`). The service should catch Prisma's `P2002` unique constraint violation and throw `AppError.conflict("Tag with this name already exists")`.

### Merge Operation

Tag merging is the most complex operation. Inside `this.prisma.$transaction()`:
1. Get all `ExerciseTagAssignment` rows with `tagId = sourceTagId`
2. Get all `ExerciseTagAssignment` rows with `tagId = targetTagId`
3. Find exercises that have BOTH source and target tags (would be duplicates)
4. Delete source assignments for exercises that already have the target tag
5. Update remaining source assignments: set `tagId = targetTagId`
6. Delete the source `ExerciseTag`
7. Return the target tag with updated `_count`

### Filter Semantics

For the list endpoint with `tagIds`, use **OR semantics** (exercise has ANY of the selected tags). This is more useful for browsing: "show me exercises tagged 'Environment' OR 'Technology'". Prisma: `tagAssignments: { some: { tagId: { in: tagIds } } }`.

### listExercises Uses TWO Different Includes

**Critical detail the dev agent must know:** The `listExercises` method (line 43-66) uses its OWN inline include that differs from the `EXERCISE_INCLUDE` constant:
- `EXERCISE_INCLUDE` (line 11-19): Used by `createExercise`, `updateDraftExercise`, `getExercise`. Includes full `questions` inside sections.
- `listExercises` inline include: Uses `_count: { select: { questions: true } }` instead of loading full questions (performance optimization for list view).

Both MUST be updated to include `tagAssignments`. See Task 6.1 and 6.2.

### Existing Exercise List Page Structure

The exercise list page (`exercises-page.tsx`) currently has:
- Search input (client-side title filter)
- Skill filter (Select) → API filter
- Status filter (Select) → API filter
- Table columns: Title, Skill, Sections, Status, Last Modified, Actions

Add band level filter as another Select dropdown. Add tag filter as a multi-select combobox. Add Band and Tags columns to the table between Skill and Sections.

### Previous Story Learnings (Stories 3.6-3.10)

- **Story 3.10 (Timer)**: Exercise-level settings follow the same pattern for `bandLevel`. Single field, useState, load in useEffect, include in autosave.
- **Common code review issues**: Empty `onBlur` handlers, dead props, missing test coverage for all branches, duplicate case blocks. Keep code minimal, test every path.
- **Schema sync required**: After adding new routes, run `pnpm --filter=webapp sync-schema-dev` with backend running.

### Git Intelligence

Recent commits follow `feat(exercises): implement story 3.X <description>` pattern. Single cohesive commit per story. Code review fixes committed separately.

### File Changes Summary

**New files:**
- `apps/backend/src/modules/exercises/tags.service.ts`
- `apps/backend/src/modules/exercises/tags.service.test.ts`
- `apps/backend/src/modules/exercises/tags.controller.ts`
- `apps/backend/src/modules/exercises/tags.routes.ts`
- `apps/webapp/src/features/exercises/hooks/use-tags.ts`
- `apps/webapp/src/features/exercises/components/TagSelector.tsx`
- `apps/webapp/src/features/exercises/components/TagSelector.test.tsx`
- `apps/webapp/src/features/settings/pages/TagsSettingsPage.tsx`
- `apps/webapp/src/features/settings/pages/TagsSettingsPage.test.tsx`

**Modified files:**
- `packages/db/prisma/schema.prisma` — Add `bandLevel` to Exercise, new `ExerciseTag` + `ExerciseTagAssignment` models
- `packages/db/src/tenanted-client.ts` — Add `ExerciseTag` + `ExerciseTagAssignment` to TENANTED_MODELS
- `packages/types/src/exercises.ts` — Add BandLevelSchema, ExerciseTagSchema, tag-related schemas, `bandLevel` + `tags` to ExerciseSchema, `bandLevel` to Create/Update/Autosave
- `packages/types/src/exercises.test.ts` — Add band level + tag schema tests
- `apps/backend/src/app.ts` — Import and register tagsRoutes
- `apps/backend/src/modules/exercises/exercises.service.ts` — Add `bandLevel` to create/update, tag filters to list, tagAssignments to both includes
- `apps/backend/src/modules/exercises/exercises.service.test.ts` — Add `bandLevel` + tagIds filter tests
- `apps/backend/src/modules/exercises/exercises.controller.ts` — Add `flattenTags` transformation to all exercise responses
- `apps/backend/src/modules/exercises/exercises.routes.ts` — Add `bandLevel` and `tagIds` query params, add per-exercise tag endpoints
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Add bandLevel state, useExerciseTags hook, render TagSelector, autosave integration
- `apps/webapp/src/features/exercises/hooks/use-exercises.ts` — Update ExerciseFilters type
- `apps/webapp/src/features/exercises/exercises-page.tsx` — Add band level filter, tag filter, tag display in table
- `apps/webapp/src/features/settings/config/settings-nav.ts` — Add Tags nav item
- `apps/webapp/src/App.tsx` — Add tags settings route
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated (sync-schema-dev)

### Project Structure Notes

- `tags.service.ts`, `tags.controller.ts`, `tags.routes.ts` live in `apps/backend/src/modules/exercises/` (co-located with exercise domain)
- Per-exercise tag assignment endpoints (`PUT/GET /:id/tags`) live in existing `exercises.routes.ts`
- `TagSelector.tsx` lives in `apps/webapp/src/features/exercises/components/` (exercise editor component)
- `TagsSettingsPage.tsx` lives in `apps/webapp/src/features/settings/pages/` (settings page)
- `use-tags.ts` lives in `apps/webapp/src/features/exercises/hooks/` (exercise hooks directory)
- No cross-app imports — types from `@workspace/types`, DB from `@workspace/db`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.11 Exercise Tagging & Organization (FR41)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project structure, API patterns, multi-tenancy]
- [Source: project-context.md — Multi-tenancy, Route-Controller-Service, Testing rules, Prisma naming]
- [Source: 3-10-timer-test-conditions.md — Exercise-level field pattern, autosave integration, code review learnings]
- [Source: packages/db/prisma/schema.prisma — Exercise model (lines 420-466), Room model (tag management pattern)]
- [Source: packages/db/src/tenanted-client.ts — TENANTED_MODELS array (lines 9-23)]
- [Source: packages/types/src/exercises.ts — ExerciseSkillSchema, ExerciseSchema, Create/Update schemas]
- [Source: packages/types/src/response.ts — createResponseSchema pattern: { data, message }]
- [Source: apps/backend/src/app.ts — Route registration pattern (lines 196-209)]
- [Source: apps/backend/src/modules/exercises/exercises.service.ts — listExercises inline include (line 56-65), EXERCISE_INCLUDE (line 11-19)]
- [Source: apps/backend/src/modules/exercises/exercises.controller.ts — Response wrapping pattern]
- [Source: apps/backend/src/modules/exercises/exercises.routes.ts — Fastify plugin, Zod querystring, requireRole]
- [Source: apps/backend/src/modules/logistics/rooms.service.ts — CRUD service pattern for settings entities]
- [Source: apps/backend/src/modules/logistics/rooms.routes.ts — Settings CRUD route pattern]
- [Source: apps/webapp/src/features/exercises/exercises-page.tsx — Filter UI, table display, Select component usage]
- [Source: apps/webapp/src/features/exercises/hooks/use-exercises.ts — Query key pattern, ExerciseFilters type]
- [Source: apps/webapp/src/features/settings/pages/RoomsPage.tsx — Settings CRUD page pattern (inline edit, AlertDialog)]
- [Source: apps/webapp/src/features/settings/config/settings-nav.ts — Tab registration with id/label/path/order]
- [Source: apps/webapp/src/App.tsx — Settings nested route registration (lines 98-111)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed unused `db` variable in tags.service.ts `setExerciseTags` (uses `this.prisma.$transaction` directly)
- Fixed type error in tags.routes.ts: `400` not in response schema, changed to `500`
- Removed unused `exerciseId` prop from TagSelector (component doesn't use it directly)
- Fixed bandLevel type mismatch in ExerciseEditor autosave with explicit type assertion
- TypeScript errors in use-tags.ts resolved after schema sync (Task 13)

### Completion Notes List

- All 13 tasks completed successfully
- Full test coverage: 425 backend tests, 281 types tests, 421 webapp tests — all green
- Schema sync verified: all new tag endpoints present in schema.d.ts
- Band level persists via autosave; topic tags saved via dedicated PUT endpoint
- Tag merge handles duplicate assignments correctly via transaction
- Inline tag creation in TagSelector with optimistic creation flow

### File List

**New files:**
- `apps/backend/src/modules/exercises/tags.service.ts`
- `apps/backend/src/modules/exercises/tags.service.test.ts`
- `apps/backend/src/modules/exercises/tags.controller.ts`
- `apps/backend/src/modules/exercises/tags.routes.ts`
- `apps/webapp/src/features/exercises/hooks/use-tags.ts`
- `apps/webapp/src/features/exercises/components/TagSelector.tsx`
- `apps/webapp/src/features/exercises/components/TagSelector.test.tsx`
- `apps/webapp/src/features/settings/pages/TagsSettingsPage.tsx`
- `apps/webapp/src/features/settings/pages/TagsSettingsPage.test.tsx`

**Modified files:**
- `packages/db/prisma/schema.prisma`
- `packages/db/src/tenanted-client.ts`
- `packages/types/src/exercises.ts`
- `packages/types/src/exercises.test.ts`
- `apps/backend/src/app.ts`
- `apps/backend/src/modules/exercises/exercises.service.ts`
- `apps/backend/src/modules/exercises/exercises.service.test.ts`
- `apps/backend/src/modules/exercises/exercises.controller.ts`
- `apps/backend/src/modules/exercises/exercises.routes.ts`
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx`
- `apps/webapp/src/features/exercises/hooks/use-exercises.ts`
- `apps/webapp/src/features/exercises/exercises-page.tsx`
- `apps/webapp/src/features/settings/config/settings-nav.ts`
- `apps/webapp/src/App.tsx`
- `apps/webapp/src/schema/schema.d.ts`
