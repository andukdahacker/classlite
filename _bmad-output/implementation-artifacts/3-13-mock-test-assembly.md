# Story 3.13: Mock Test Assembly

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to combine existing exercises into a full mock test with section timing and unified scoring,
so that students can simulate complete IELTS test conditions with accurate band score calculation.

## Acceptance Criteria

1. **AC1: Mock Test Creation** — Teacher can create a mock test by selecting existing PUBLISHED exercises for each skill section from a browsable exercise list. Mock test has title, description, and test type (Academic / General Training).
2. **AC2: Section Structure** — Configure 4 skill sections: Listening (1-4 exercises), Reading (1-3 exercises), Writing (1-2 exercises for Task 1 + Task 2), Speaking (1-3 exercises for Parts 1-3). Exercises within a section are ordered.
3. **AC3: Section Timing** — Set time limit per section in minutes. Sections are sequential (must complete one before next). Default times: Listening 30min, Reading 60min, Writing 60min, Speaking 15min.
4. **AC4: Unified Scoring** — System calculates overall band score using IELTS conversion tables. Test type (Academic vs General Training) affects Reading conversion table.
5. **AC5: Band Score Calculation** — Reading/Listening: Raw score (out of 40) mapped to Band via conversion table. Writing: Weighted average (Task 2 = 2x Task 1) of 4 criteria. Speaking: Average of 4 criteria. Overall: Average of 4 skills rounded to nearest 0.5.
6. **AC6: Progress Saving** — Data model supports saving student progress and resuming within deadline. (Student-facing UI deferred to Epic 4 / Story 3.16.)
7. **AC7: Results Report** — Band score calculation service and results endpoint implemented. Backend returns per-skill band + overall band + detailed breakdown. (Student-facing results UI deferred to Story 3.16.)

## Scope Clarification

**What IS built in this story:**
- Backend: Prisma models for MockTest, MockTestSection, MockTestSectionExercise
- Backend: IELTS band score conversion tables (Academic + General Training) as TypeScript constants
- Backend: Band score calculation service (raw→band, writing weighted avg, overall avg)
- Backend: MockTest CRUD service, controller, routes (create, read, update, delete, publish, archive)
- Backend: Exercise selection validation (only PUBLISHED exercises, skill must match section)
- Frontend: Mock test list page with filters (status, test type)
- Frontend: Mock test assembly editor with tabbed skill sections
- Frontend: Exercise selector component (browse/search PUBLISHED exercises by skill)
- Frontend: Section timing configuration
- Frontend: Band score preview/summary on Review tab
- Frontend: Routes and navigation integration
- Types: Zod schemas for mock test, sections, band score calculation
- Tests for all layers

**What is NOT built (out of scope):**
- Student-facing mock test taking UI (depends on Epic 4 student submission)
- Student progress saving/resuming UI (data model ready, UI deferred)
- Student results report UI (scoring backend ready, UI deferred to Story 3.16)
- Exercise assignment of mock tests to classes (Story 3.15)
- Real-time timer enforcement during test (Epic 4)
- Auto-grading of objective questions during mock test (Epic 5)
- Writing/Speaking subjective grading within mock test context (Epic 5)

## Tasks / Subtasks

### Task 1: Prisma Schema — Mock Test Models (AC: 1, 2, 3, 6)

- [x] 1.1 Add `MockTest` model to `packages/db/prisma/schema.prisma`:
  ```prisma
  model MockTest {
    id          String   @id @default(cuid())
    centerId    String   @map("center_id")
    title       String
    description String?
    testType    String   @default("ACADEMIC") @map("test_type") // ACADEMIC | GENERAL_TRAINING
    status      String   @default("DRAFT") // DRAFT | PUBLISHED | ARCHIVED

    createdById String   @map("created_by_id")
    createdBy   User     @relation("MockTestCreatedBy", fields: [createdById], references: [id])
    createdAt   DateTime @default(now()) @map("created_at")
    updatedAt   DateTime @updatedAt @map("updated_at")

    sections MockTestSection[]

    @@unique([id, centerId])
    @@index([centerId])
    @@index([centerId, status])
    @@map("mock_test")
  }
  ```

- [x] 1.2 Add `MockTestSection` model:
  ```prisma
  model MockTestSection {
    id         String @id @default(cuid())
    mockTestId String @map("mock_test_id")
    centerId   String @map("center_id")
    skill      String // LISTENING | READING | WRITING | SPEAKING
    orderIndex Int    @map("order_index") // 0=Listening, 1=Reading, 2=Writing, 3=Speaking
    timeLimit  Int?   @map("time_limit") // Seconds. Null = no limit.

    mockTest  MockTest                  @relation(fields: [mockTestId], references: [id], onDelete: Cascade)
    exercises MockTestSectionExercise[]

    @@unique([id, centerId])
    @@index([centerId])
    @@index([mockTestId])
    @@map("mock_test_section")
  }
  ```

- [x] 1.3 Add `MockTestSectionExercise` model:
  ```prisma
  model MockTestSectionExercise {
    id         String @id @default(cuid())
    sectionId  String @map("section_id")
    centerId   String @map("center_id")
    exerciseId String @map("exercise_id")
    orderIndex Int    @map("order_index")

    section  MockTestSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
    exercise Exercise        @relation(fields: [exerciseId], references: [id])

    @@unique([id, centerId])
    @@unique([sectionId, exerciseId])
    @@index([centerId])
    @@index([sectionId])
    @@map("mock_test_section_exercise")
  }
  ```

- [x] 1.4 Add reverse relation on Exercise model:
  ```prisma
  // In Exercise model, add:
  mockTestSectionExercises MockTestSectionExercise[]
  ```

- [x] 1.5 Add reverse relation on User model for MockTest:
  ```prisma
  // In User model, add:
  createdMockTests MockTest[] @relation("MockTestCreatedBy")
  ```

- [x] 1.6 **CRITICAL: Register in TENANTED_MODELS** — In `packages/db/src/tenanted-client.ts`, add `"MockTest"`, `"MockTestSection"`, `"MockTestSectionExercise"` to the `TENANTED_MODELS` array. Without this, multi-tenancy isolation breaks.

- [x] 1.7 Run `pnpm --filter=db db:generate && pnpm --filter=db db:push` to apply schema changes.

### Task 2: TypeScript Schemas — Mock Test Types (AC: 1, 2, 3, 4, 5)

- [x] 2.1 Create `packages/types/src/mock-tests.ts` with core schemas:
  ```ts
  import { z } from "zod";
  import { createResponseSchema } from "./response.js";

  // Enums
  export const MockTestTypeSchema = z.enum(["ACADEMIC", "GENERAL_TRAINING"]);
  export type MockTestType = z.infer<typeof MockTestTypeSchema>;

  export const MockTestStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
  export type MockTestStatus = z.infer<typeof MockTestStatusSchema>;

  export const MockTestSkillSchema = z.enum(["LISTENING", "READING", "WRITING", "SPEAKING"]);
  export type MockTestSkill = z.infer<typeof MockTestSkillSchema>;

  // Section Exercise (junction)
  export const MockTestSectionExerciseSchema = z.object({
    id: z.string(),
    sectionId: z.string(),
    exerciseId: z.string(),
    orderIndex: z.number(),
    exercise: z.object({
      id: z.string(),
      title: z.string(),
      skill: z.string(),
      status: z.string(),
      bandLevel: z.string().nullable().optional(),
      sections: z.array(z.object({
        id: z.string(),
        sectionType: z.string(),
        questions: z.array(z.object({ id: z.string() })),
      })).optional(),
    }).optional(),
  });

  // Section
  export const MockTestSectionSchema = z.object({
    id: z.string(),
    mockTestId: z.string(),
    skill: MockTestSkillSchema,
    orderIndex: z.number(),
    timeLimit: z.number().nullable().optional(),
    exercises: z.array(MockTestSectionExerciseSchema).optional(),
  });

  // Full MockTest
  export const MockTestSchema = z.object({
    id: z.string(),
    centerId: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    testType: MockTestTypeSchema,
    status: MockTestStatusSchema,
    createdById: z.string(),
    createdBy: z.object({ id: z.string(), name: z.string() }).optional(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
    sections: z.array(MockTestSectionSchema).optional(),
  });
  export type MockTest = z.infer<typeof MockTestSchema>;

  // Create input
  export const CreateMockTestSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    testType: MockTestTypeSchema.default("ACADEMIC"),
  });
  export type CreateMockTest = z.infer<typeof CreateMockTestSchema>;

  // Update input
  export const UpdateMockTestSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    testType: MockTestTypeSchema.optional(),
  });
  export type UpdateMockTest = z.infer<typeof UpdateMockTestSchema>;

  // Section update (timing)
  export const UpdateMockTestSectionSchema = z.object({
    timeLimit: z.number().int().min(60).max(14400).nullable().optional(), // 1min to 4hrs in seconds
  });

  // Add exercise to section
  export const AddExerciseToSectionSchema = z.object({
    exerciseId: z.string(),
  });

  // Reorder exercises in section
  export const ReorderSectionExercisesSchema = z.object({
    exerciseIds: z.array(z.string()).min(1),
  });

  // Response schemas
  export const MockTestResponseSchema = createResponseSchema(MockTestSchema);
  export const MockTestListResponseSchema = createResponseSchema(z.array(MockTestSchema));
  ```

- [x] 2.2 Create band score calculation schemas in the same file:
  ```ts
  // Band score result
  export const SkillBandScoreSchema = z.object({
    skill: MockTestSkillSchema,
    rawScore: z.number().nullable().optional(), // For Listening/Reading (out of 40)
    criteriaScores: z.record(z.string(), z.number()).nullable().optional(), // For Writing/Speaking
    bandScore: z.number(), // 0-9 in 0.5 increments
  });

  export const MockTestBandScoreSchema = z.object({
    testType: MockTestTypeSchema,
    skills: z.array(SkillBandScoreSchema),
    overallBand: z.number(), // Rounded to nearest 0.5
  });
  export type MockTestBandScore = z.infer<typeof MockTestBandScoreSchema>;

  export const MockTestBandScoreResponseSchema = createResponseSchema(MockTestBandScoreSchema);
  ```

- [x] 2.3 Export from `packages/types/src/index.ts`:
  ```ts
  export * from "./mock-tests.js";
  ```

### Task 3: Backend — IELTS Band Score Conversion Tables (AC: 4, 5)

- [x] 3.1 Create `apps/backend/src/modules/mock-tests/band-score.ts` with conversion tables:
  ```ts
  // IELTS Listening Band Conversion (same for Academic & General Training)
  // Source: IDP/British Council published conversion tables
  export const LISTENING_BAND_TABLE: Array<{ min: number; max: number; band: number }> = [
    { min: 39, max: 40, band: 9.0 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8.0 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7.0 },
    { min: 26, max: 29, band: 6.5 },
    { min: 23, max: 25, band: 6.0 },
    { min: 19, max: 22, band: 5.5 },
    { min: 16, max: 18, band: 5.0 },
    { min: 13, max: 15, band: 4.5 },
    { min: 10, max: 12, band: 4.0 },
    { min: 8, max: 9, band: 3.5 },
    { min: 6, max: 7, band: 3.0 },
    { min: 4, max: 5, band: 2.5 },
    { min: 2, max: 3, band: 2.0 },
    { min: 0, max: 1, band: 1.0 },
  ];

  // IELTS Academic Reading Band Conversion
  export const READING_ACADEMIC_BAND_TABLE: Array<{ min: number; max: number; band: number }> = [
    { min: 39, max: 40, band: 9.0 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8.0 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7.0 },
    { min: 27, max: 29, band: 6.5 },
    { min: 23, max: 26, band: 6.0 },
    { min: 19, max: 22, band: 5.5 },
    { min: 15, max: 18, band: 5.0 },
    { min: 13, max: 14, band: 4.5 },
    { min: 10, max: 12, band: 4.0 },
    { min: 8, max: 9, band: 3.5 },
    { min: 6, max: 7, band: 3.0 },
    { min: 4, max: 5, band: 2.5 },
    { min: 2, max: 3, band: 2.0 },
    { min: 0, max: 1, band: 1.0 },
  ];

  // IELTS General Training Reading Band Conversion (higher thresholds)
  export const READING_GENERAL_BAND_TABLE: Array<{ min: number; max: number; band: number }> = [
    { min: 40, max: 40, band: 9.0 },
    { min: 39, max: 39, band: 8.5 },
    { min: 37, max: 38, band: 8.0 },
    { min: 36, max: 36, band: 7.5 },
    { min: 34, max: 35, band: 7.0 },
    { min: 32, max: 33, band: 6.5 },
    { min: 30, max: 31, band: 6.0 },
    { min: 27, max: 29, band: 5.5 },
    { min: 23, max: 26, band: 5.0 },
    { min: 19, max: 22, band: 4.5 },
    { min: 15, max: 18, band: 4.0 },
    { min: 12, max: 14, band: 3.5 },
    { min: 9, max: 11, band: 3.0 },
    { min: 6, max: 8, band: 2.5 },
    { min: 4, max: 5, band: 2.0 },
    { min: 0, max: 3, band: 1.0 },
  ];

  // Writing criteria names (for reference/display)
  export const WRITING_CRITERIA = [
    "Task Achievement",
    "Coherence & Cohesion",
    "Lexical Resource",
    "Grammatical Range & Accuracy",
  ] as const;

  // Speaking criteria names (for reference/display)
  export const SPEAKING_CRITERIA = [
    "Fluency & Coherence",
    "Lexical Resource",
    "Grammatical Range & Accuracy",
    "Pronunciation",
  ] as const;
  ```

- [x] 3.2 Add calculation functions in the same file:
  ```ts
  /** Convert raw score to band using conversion table */
  export function rawScoreToBand(
    rawScore: number,
    table: Array<{ min: number; max: number; band: number }>,
  ): number {
    const clamped = Math.max(0, Math.min(40, Math.round(rawScore)));
    const entry = table.find((e) => clamped >= e.min && clamped <= e.max);
    return entry?.band ?? 1.0;
  }

  /** Round to nearest 0.5 (IELTS rounding: .25/.75 round UP) */
  export function roundToHalfBand(score: number): number {
    return Math.round(score * 2) / 2;
  }

  /** Calculate Writing band: Task 2 has double weight */
  export function calculateWritingBand(
    task1CriteriaScores: number[], // 4 criteria scores for Task 1
    task2CriteriaScores: number[], // 4 criteria scores for Task 2
  ): number {
    const task1Band = roundToHalfBand(
      task1CriteriaScores.reduce((a, b) => a + b, 0) / task1CriteriaScores.length,
    );
    const task2Band = roundToHalfBand(
      task2CriteriaScores.reduce((a, b) => a + b, 0) / task2CriteriaScores.length,
    );
    // Task 2 = double weight: (T1 + T2*2) / 3
    return roundToHalfBand((task1Band + task2Band * 2) / 3);
  }

  /** Calculate Speaking band: average of 4 criteria */
  export function calculateSpeakingBand(criteriaScores: number[]): number {
    return roundToHalfBand(
      criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length,
    );
  }

  /** Calculate overall IELTS band from 4 skill scores */
  export function calculateOverallBand(skillBands: number[]): number {
    const avg = skillBands.reduce((a, b) => a + b, 0) / skillBands.length;
    return roundToHalfBand(avg);
  }
  ```

- [x] 3.3 Add comprehensive unit tests in `apps/backend/src/modules/mock-tests/band-score.test.ts`:
  - `rawScoreToBand` — test boundary values for all 3 tables (0, 1, 15, 23, 30, 37, 40)
  - `roundToHalfBand` — test 6.25→6.5, 6.75→7.0, 6.1→6.0, 6.6→6.5, 7.5→7.5
  - `calculateWritingBand` — test double weighting of Task 2
  - `calculateSpeakingBand` — test average + rounding
  - `calculateOverallBand` — test with known IELTS examples: L6.5+R6.5+W5.0+S7.0=6.25→6.5

### Task 4: Backend — Mock Test Service (AC: 1, 2, 3, 6)

- [x] 4.1 Create `apps/backend/src/modules/mock-tests/mock-tests.service.ts`:
  ```ts
  import type { PrismaClient } from "@prisma/client";
  import { getTenantedClient } from "@workspace/db";
  import { AppError } from "../../lib/errors.js";

  const MOCK_TEST_INCLUDE = {
    createdBy: { select: { id: true, name: true } },
    sections: {
      orderBy: { orderIndex: "asc" as const },
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" as const },
          include: {
            exercise: {
              select: {
                id: true, title: true, skill: true, status: true, bandLevel: true,
                sections: {
                  select: { id: true, sectionType: true, questions: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    },
  };

  // Default section time limits in seconds
  const DEFAULT_TIME_LIMITS: Record<string, number> = {
    LISTENING: 1800,  // 30 minutes
    READING: 3600,    // 60 minutes
    WRITING: 3600,    // 60 minutes
    SPEAKING: 900,    // 15 minutes
  };

  export class MockTestsService {
    constructor(private readonly prisma: PrismaClient) {}

    async listMockTests(centerId: string, filters?: { status?: string; testType?: string }) {
      // List with filters, return with sections + exercise counts
    }

    async getMockTest(centerId: string, id: string) {
      // Get with full include (sections, exercises, exercise details)
    }

    async createMockTest(centerId: string, input: CreateMockTest, firebaseUid: string) {
      // 1. Resolve firebaseUid → userId (same pattern as exercises.service.ts)
      // 2. Create MockTest
      // 3. Auto-create 4 sections (Listening=0, Reading=1, Writing=2, Speaking=3) with default time limits
      // Return complete mock test with sections
    }

    async updateMockTest(centerId: string, id: string, input: UpdateMockTest) {
      // Only DRAFT mock tests can be updated
    }

    async deleteMockTest(centerId: string, id: string) {
      // Only DRAFT mock tests can be deleted (hard delete, cascades)
    }

    async publishMockTest(centerId: string, id: string) {
      // Validate: each section must have at least 1 exercise
      // Validate: all referenced exercises are still PUBLISHED
      // DRAFT → PUBLISHED
    }

    async archiveMockTest(centerId: string, id: string) {
      // Any non-ARCHIVED → ARCHIVED
    }

    // Section management
    async updateSection(centerId: string, mockTestId: string, sectionId: string, input: { timeLimit?: number | null }) {
      // Update section time limit
    }

    async addExerciseToSection(centerId: string, mockTestId: string, sectionId: string, exerciseId: string) {
      // 1. Verify mock test is DRAFT
      // 2. Verify exercise exists, is PUBLISHED, and skill matches section skill
      // 3. Verify exercise not already in this section (unique constraint)
      // 4. Calculate next orderIndex
      // 5. Create MockTestSectionExercise
    }

    async removeExerciseFromSection(centerId: string, mockTestId: string, sectionId: string, exerciseId: string) {
      // Remove junction record, reindex remaining
    }

    async reorderSectionExercises(centerId: string, mockTestId: string, sectionId: string, exerciseIds: string[]) {
      // Bulk reorder (same pattern as sections.service.ts reorderSections)
    }
  }
  ```
  **CRITICAL:** Follow the exact same patterns as `exercises.service.ts`:
  - Use `getTenantedClient(this.prisma, centerId)` for ALL queries
  - Firebase UID → User ID resolution uses compound key: `db.authAccount.findUniqueOrThrow({ where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } } })` → get `userId`
  - Throw `AppError.notFound()` / `AppError.badRequest()` for domain errors
  - Auto-create 4 sections on mock test creation (teacher shouldn't have to manually add sections)

- [x] 4.2 Implement publish validation — when publishing, verify:
  - Each of the 4 skill sections has at least 1 exercise
  - All referenced exercises are still in PUBLISHED status
  - Throw descriptive error if validation fails (e.g., "Reading section has no exercises")

### Task 5: Backend — Mock Test Controller (AC: 1, 2, 3)

- [x] 5.1 Create `apps/backend/src/modules/mock-tests/mock-tests.controller.ts`:
  ```ts
  // JwtPayload is the Fastify custom request type from auth middleware — NOT jsonwebtoken's JwtPayload.
  // Access via request.jwtPayload which has: { uid: string, email: string, role: string, centerId: string }
  // Do NOT import JwtPayload from "jsonwebtoken".

  export class MockTestsController {
    constructor(private readonly service: MockTestsService) {}

    async list(filters: { status?: string; testType?: string }, user: JwtPayload)
      → { data: MockTest[], message: string }

    async get(id: string, user: JwtPayload)
      → { data: MockTest, message: string }

    async create(input: CreateMockTest, user: JwtPayload)
      → { data: MockTest, message: string }

    async update(id: string, input: UpdateMockTest, user: JwtPayload)
      → { data: MockTest, message: string }

    async delete(id: string, user: JwtPayload)
      → { data: null, message: string }

    async publish(id: string, user: JwtPayload)
      → { data: MockTest, message: string }

    async archive(id: string, user: JwtPayload)
      → { data: MockTest, message: string }

    async updateSection(mockTestId: string, sectionId: string, input, user: JwtPayload)
      → { data: MockTestSection, message: string }

    async addExercise(mockTestId: string, sectionId: string, exerciseId: string, user: JwtPayload)
      → { data: MockTestSectionExercise, message: string }

    async removeExercise(mockTestId: string, sectionId: string, exerciseId: string, user: JwtPayload)
      → { data: null, message: string }

    async reorderExercises(mockTestId: string, sectionId: string, exerciseIds: string[], user: JwtPayload)
      → { data: null, message: string }
  }
  ```
  **CRITICAL:** Every method wraps service result in `{ data, message }` per project convention. Extract `centerId` from `user.centerId`.

### Task 6: Backend — Mock Test Routes (AC: 1, 2, 3)

- [x] 6.1 Create `apps/backend/src/modules/mock-tests/mock-tests.routes.ts`:
  ```
  GET    /                         → List mock tests (query: status, testType)
  GET    /:id                      → Get mock test with full details
  POST   /                         → Create mock test
  PATCH  /:id                      → Update mock test metadata
  DELETE /:id                      → Delete mock test (DRAFT only)
  POST   /:id/publish              → Publish mock test
  POST   /:id/archive              → Archive mock test
  PATCH  /:id/sections/:sectionId  → Update section (timeLimit)
  POST   /:id/sections/:sectionId/exercises       → Add exercise to section
  DELETE /:id/sections/:sectionId/exercises/:exerciseId  → Remove exercise
  PATCH  /:id/sections/:sectionId/exercises/reorder      → Reorder exercises
  ```

- [x] 6.2 All routes require `authMiddleware` + `requireRole(["OWNER", "ADMIN", "TEACHER"])`.

- [x] 6.3 Use Zod schemas for all request/response validation via `fastify-type-provider-zod`.

- [x] 6.4 **Route file structure** — follow existing route patterns exactly:
  - **ESM imports require `.js` extensions**: `import { MockTestsService } from "./mock-tests.service.js";`
  - **Instantiate service inside the route function** using `fastify.prisma`:
    ```ts
    export async function mockTestRoutes(fastify: FastifyInstance) {
      const service = new MockTestsService(fastify.prisma);
      const controller = new MockTestsController(service);
      // ... route definitions ...
    }
    ```
  - **Error handling**: Use `mapPrismaError` from `../../errors/prisma-errors.js` in catch blocks:
    ```ts
    import { mapPrismaError } from "../../errors/prisma-errors.js";
    // In catch: reply.status(mapPrismaError(error).statusCode).send(...)
    ```

- [x] 6.5 Register in `apps/backend/src/app.ts`:
  ```ts
  import { mockTestRoutes } from "./modules/mock-tests/mock-tests.routes.js";
  await app.register(mockTestRoutes, { prefix: "/api/v1/mock-tests" });
  ```

### Task 7: Backend — Band Score Preview Endpoint (AC: 4, 5)

- [x] 7.1 Add a preview endpoint to mock test routes:
  ```
  GET /:id/score-preview → Calculate expected band score ranges based on selected exercises
  ```
  This endpoint:
  - Counts total questions per skill section
  - For Listening/Reading: shows question count vs expected 40, and the conversion table for that test type
  - For Writing: lists the criteria that will be scored
  - For Speaking: lists the criteria that will be scored
  - Returns `{ data: { listening: { questionCount, maxRawScore }, reading: { questionCount, maxRawScore, conversionTable }, writing: { criteria }, speaking: { criteria }, testType }, message }`

- [x] 7.2 This is a read-only informational endpoint for the teacher to verify test composition before publishing.

### Task 8: Backend — Tests (AC: all)

- [x] 8.1 `apps/backend/src/modules/mock-tests/mock-tests.service.test.ts` — test:
  - `createMockTest` creates with 4 auto-generated sections
  - `createMockTest` resolves Firebase UID to user
  - `addExerciseToSection` only accepts PUBLISHED exercises
  - `addExerciseToSection` validates skill match (can't add READING exercise to LISTENING section)
  - `addExerciseToSection` prevents duplicate exercise in same section
  - `removeExerciseFromSection` removes and reindexes
  - `reorderSectionExercises` updates orderIndex correctly
  - `updateMockTest` rejects non-DRAFT
  - `deleteMockTest` rejects non-DRAFT
  - `publishMockTest` validates all sections have exercises
  - `publishMockTest` validates all exercises are still PUBLISHED
  - `archiveMockTest` transitions any status to ARCHIVED

- [x] 8.2 `apps/backend/src/modules/mock-tests/band-score.test.ts` — test all calculation functions (see Task 3.3).

### Task 9: Frontend — Mock Test API Hooks (AC: 1, 2, 3)

- [x] 9.1 Create `apps/webapp/src/features/mock-tests/hooks/use-mock-tests.ts`:
  ```ts
  export const mockTestsKeys = {
    all: ["mock-tests"] as const,
    list: (filters?: Record<string, string>) => [...mockTestsKeys.all, "list", filters] as const,
    detail: (id: string) => [...mockTestsKeys.all, "detail", id] as const,
    scorePreview: (id: string) => [...mockTestsKeys.all, "score-preview", id] as const,
  };

  export function useMockTests(filters?: { status?: string; testType?: string }) {
    // useQuery for GET /api/v1/mock-tests
  }

  export function useMockTest(id?: string) {
    // useQuery for GET /api/v1/mock-tests/:id
  }

  export function useMockTestMutations() {
    // createMutation, updateMutation, deleteMutation, publishMutation, archiveMutation
    // All invalidate mockTestsKeys.all on success
  }

  export function useMockTestSections(mockTestId?: string) {
    // updateSectionMutation (timeLimit)
    // addExerciseMutation
    // removeExerciseMutation
    // reorderExercisesMutation
    // All invalidate mockTestsKeys.detail(mockTestId) on success
  }

  export function useMockTestScorePreview(mockTestId?: string) {
    // useQuery for GET /api/v1/mock-tests/:id/score-preview
    // Only fetch when mockTestId exists
  }
  ```

- [x] 9.2 Follow the exact same patterns as `use-exercises.ts`:
  - **Import the API client**: `import client from "@/core/client";` (default export)
  - **Import centerId**: Get `centerId` from `useAuth()` hook, NOT from URL params: `const { centerId } = useAuth();`
  - Query key factory pattern
  - `client.GET` / `client.POST` / `client.PATCH` / `client.DELETE` from openapi-fetch
  - `queryClient.invalidateQueries` on mutation success
  - Error handling via `onError` with toast

### Task 10: Frontend — Mock Test List Page (AC: 1)

- [x] 10.1 Create `apps/webapp/src/features/mock-tests/mock-tests-page.tsx`:
  - **Layout:** Same pattern as `exercises-page.tsx` — header with title + Create button, filter bar, data table
  - **Filters:** Status dropdown (Draft/Published/Archived), Test Type dropdown (Academic/General Training)
  - **Table columns:** Title, Test Type, Status, Sections Summary (e.g., "L:2 R:3 W:2 S:3"), Created By, Last Modified, Actions
  - **Actions:** Edit, Publish, Archive, Delete (context-dependent on status)
  - **Create:** "Create Mock Test" button opens creation dialog or navigates to `/mock-tests/new`
  - **Empty state:** "No mock tests yet. Create your first mock test to simulate full IELTS conditions."

- [x] 10.2 Create a simple creation dialog (or use inline creation like exercises):
  - Title input
  - Test Type radio: Academic (default) / General Training
  - Optional description textarea
  - On submit: create mock test → navigate to editor

### Task 11: Frontend — Mock Test Assembly Editor (AC: 1, 2, 3, 4, 5)

- [x] 11.1 Create `apps/webapp/src/features/mock-tests/components/MockTestEditor.tsx`:
  - **Header:** Back button, Title (editable inline), Test Type badge, Status badge, action buttons (Save, Publish, Archive)
  - **Tabs:** Listening | Reading | Writing | Speaking | Review
  - **Each skill tab contains:**
    - Time limit input (minutes, with default value shown as placeholder)
    - Exercise list (ordered) showing: exercise title, question count, band level, remove button
    - Drag-to-reorder exercises
    - "Add Exercise" button → opens ExerciseSelector
    - Validation warnings (e.g., "IELTS Reading typically has 3 passages with ~40 questions total. You have 2 passages with 26 questions.")
  - **Review tab contains:**
    - Test summary: Title, Type, total time, total sections
    - Per-skill breakdown: exercises, question count, time limit
    - Band score reference: conversion table for the selected test type
    - Publish button (validates all sections have exercises)

- [x] 11.2 Follow `ExerciseEditor.tsx` patterns:
  - Import shadcn components from `@workspace/ui/components/...` (e.g., `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"`)
  - Use shadcn `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
  - Use shadcn `Card`, `Button`, `Input`, `Badge`, `Select`
  - Inline editing for title (same as exercise title editing pattern)
  - Auto-save on changes (debounced via `useMockTestMutations().updateMutation`)

### Task 12: Frontend — Exercise Selector Component (AC: 1, 2)

- [x] 12.1 Create `apps/webapp/src/features/mock-tests/components/ExerciseSelector.tsx`:
  - **Trigger:** "Add Exercise" button opens a Dialog/Sheet
  - **Content:** Filterable list of PUBLISHED exercises matching the current section's skill
  - **Filters:** Search by title, filter by band level, filter by tags
  - **List items:** Exercise title, question count, band level, tags, "Add" button
  - **Already added:** Exercises already in the section are shown as disabled/greyed with "Added" badge
  - **Selection:** Click "Add" immediately adds exercise to section and refreshes the list

- [x] 12.2 Use the existing `useExercises` hook with `skill` and `status: "PUBLISHED"` filters to fetch the exercise list.

- [x] 12.3 Use shadcn components imported from `@workspace/ui/components/...`:
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@workspace/ui/components/dialog`
  - `Input` from `@workspace/ui/components/input`
  - `Badge` from `@workspace/ui/components/badge`
  - `Button` from `@workspace/ui/components/button`
  - `ScrollArea` from `@workspace/ui/components/scroll-area`

### Task 13: Frontend — Section Timing & Validation (AC: 2, 3)

- [x] 13.1 Each skill tab shows IELTS standard reference:
  ```
  Listening: 4 sections, ~40 questions, 30 minutes
  Reading:   3 passages, ~40 questions, 60 minutes (Academic) or 60 minutes (General)
  Writing:   Task 1 + Task 2, 60 minutes
  Speaking:  Parts 1-3, 11-14 minutes
  ```

- [x] 13.2 Show warnings (non-blocking) when the mock test deviates from IELTS standards:
  - "You have {N} exercises. Standard IELTS has {M}."
  - "Total question count: {N}. Standard IELTS has 40 for this skill."
  - These are informational — teacher can customize for practice purposes.

### Task 14: Frontend — Routes & Navigation (AC: 1)

- [x] 14.1 Add routes to `apps/webapp/src/App.tsx`:
  ```tsx
  <Route path="mock-tests" element={<ProtectedRoute allowedRoles={["OWNER", "ADMIN", "TEACHER"]}><MockTestsPage /></ProtectedRoute>} />
  <Route path="mock-tests/new" element={<ProtectedRoute allowedRoles={["OWNER", "ADMIN", "TEACHER"]}><MockTestEditor /></ProtectedRoute>} />
  <Route path="mock-tests/:id/edit" element={<ProtectedRoute allowedRoles={["OWNER", "ADMIN", "TEACHER"]}><MockTestEditor /></ProtectedRoute>} />
  ```
  These go inside the `/:centerId/dashboard` route group, at the same level as `exercises`.

- [x] 14.2 **Update navigation config** at `apps/webapp/src/core/config/navigation.ts`:
  - Add "Mock Tests" entry to the navigation config. Follow the existing pattern for how `exercises`, `grading`, `students` etc. are registered.
  - This file controls the sidebar/navigation rail — the dev agent MUST update it or the page won't appear in navigation.

- [x] 14.3 Add "Mock Tests" link to the exercises page or navigation. Options:
  - Add a tab/link on the Exercises page header: "Exercises | Mock Tests"
  - Or add to the navigation rail as a sub-item under Exercises

  **Recommendation:** Add a secondary nav link on the Exercises page header, same pattern as Settings sub-navigation. This keeps mock tests discoverable without cluttering the main nav.

### Task 15: Frontend — Tests (AC: all)

- [x] 15.1 `apps/webapp/src/features/mock-tests/mock-tests-page.test.tsx`:
  - Renders mock test list
  - Filters by status and test type
  - Create button navigates to new page
  - Actions menu shows correct options per status

- [x] 15.2 `apps/webapp/src/features/mock-tests/components/MockTestEditor.test.tsx`:
  - Renders 5 tabs (4 skills + Review)
  - Shows exercise list per section
  - Add Exercise button opens selector
  - Time limit input saves via mutation
  - Publish validates sections have exercises

- [x] 15.3 `apps/webapp/src/features/mock-tests/components/ExerciseSelector.test.tsx`:
  - Renders published exercises filtered by skill
  - Search filters exercise list
  - Add button calls mutation
  - Already-added exercises show as disabled

### Task 16: Schema Sync (AC: all)

- [x] 16.1 Start backend dev server: `pnpm --filter=backend dev`
- [x] 16.2 Run `pnpm --filter=webapp sync-schema-dev` to regenerate OpenAPI types.
- [x] 16.3 Verify `apps/webapp/src/schema/schema.d.ts` includes all new mock test endpoints.

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: `mock-tests.service.ts` handles DB logic. `mock-tests.controller.ts` wraps results in `{ data, message }`. `mock-tests.routes.ts` handles HTTP (Fastify request/reply, error mapping). Band score calculation is a separate pure module.
- **Multi-tenancy**: All queries use `getTenantedClient(centerId)`. MockTest, MockTestSection, MockTestSectionExercise models MUST be in `TENANTED_MODELS`.
- **Zod validation**: All request/response schemas validated via Zod in `packages/types/src/mock-tests.ts`.
- **Response format**: Always `{ data: T | null, message: string }` via `createResponseSchema()`.
- **Status workflow**: DRAFT → PUBLISHED → ARCHIVED (same as Exercise).

### Key Implementation Patterns (from Stories 3.1-3.12)

- **CRUD service pattern**: Follow `exercises.service.ts` exactly — `INCLUDE` constant for standard relations, `verifyDraftXxx` helper method, `getTenantedClient` everywhere.
- **Firebase UID resolution**: `db.authAccount.findUniqueOrThrow({ where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } } })` → get `userId`. Uses compound unique key, same as exercises service.
- **Reorder pattern**: Follow `sections.service.ts` `reorderSections` — accept array of IDs, validate all belong to parent, update orderIndex in transaction.
- **Frontend page pattern**: Follow `exercises-page.tsx` — filter state, query hook with filters, data table, actions dropdown.
- **Frontend editor pattern**: Follow `ExerciseEditor.tsx` — tabbed layout, inline editing, auto-save on changes.
- **Frontend hooks pattern**: Follow `use-exercises.ts` — query key factory, `client.GET`/`POST`/`PATCH`/`DELETE`, `queryClient.invalidateQueries`. Import `client` from `@/core/client` (default export). Get `centerId` from `useAuth()` hook, NOT from URL params.
- **Route registration**: Follow existing pattern in `app.ts` — import routes, `app.register(routes, { prefix })`.
- **React Router**: Uses `react-router` v7 (`import { ... } from "react-router"`). Routes nested under `/:centerId/dashboard`.

### Auto-Create Sections on Mock Test Creation

When a mock test is created, the service MUST auto-create 4 sections:
```ts
const SECTIONS = [
  { skill: "LISTENING", orderIndex: 0, timeLimit: 1800 },
  { skill: "READING", orderIndex: 1, timeLimit: 3600 },
  { skill: "WRITING", orderIndex: 2, timeLimit: 3600 },
  { skill: "SPEAKING", orderIndex: 3, timeLimit: 900 },
];
```
This ensures the teacher always has all 4 skill sections and just needs to add exercises and adjust timing. Do NOT make the teacher manually create sections.

### IELTS Band Score Calculation Reference

**Listening & Reading (objective scoring):**
- Count correct answers (raw score out of 40)
- Look up band in conversion table
- Academic vs General Training uses different Reading table
- Listening table is same for both

**Writing (subjective scoring — teacher/AI grades):**
- Each task scored on 4 criteria (0-9 each): Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy
- Task band = average of 4 criteria, rounded to nearest 0.5
- Writing band = `(Task1Band + Task2Band * 2) / 3`, rounded to nearest 0.5
- Task 2 has DOUBLE weight

**Speaking (subjective scoring — teacher/AI grades):**
- Scored on 4 criteria (0-9 each): Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation
- Speaking band = average of 4 criteria, rounded to nearest 0.5

**Overall band:**
- Average of 4 skill bands (Listening, Reading, Writing, Speaking)
- Rounded to nearest 0.5
- Formula: `Math.round(average * 2) / 2`

**Important:** The band score calculation service is built now but will be USED when students take tests (Epic 4/5). For this story, it's available as a preview for teachers assembling mock tests.

### Exercise Skill Validation

When adding an exercise to a mock test section, the exercise's `skill` field MUST match the section's `skill`:
- LISTENING section → only exercises with `skill: "LISTENING"`
- READING section → only exercises with `skill: "READING"`
- WRITING section → only exercises with `skill: "WRITING"`
- SPEAKING section → only exercises with `skill: "SPEAKING"`

Also: only PUBLISHED exercises can be added. DRAFT and ARCHIVED exercises are excluded.

### Publish Validation Rules

Before publishing a mock test:
1. ALL 4 sections must have at least 1 exercise
2. ALL referenced exercises must still be in PUBLISHED status (an exercise could have been archived since it was added)
3. If validation fails, return a descriptive error listing which sections are missing exercises or which exercises are no longer published

### Frontend File Organization

New files go in `apps/webapp/src/features/mock-tests/`:
```
mock-tests/
  hooks/
    use-mock-tests.ts
  components/
    MockTestEditor.tsx
    MockTestEditor.test.tsx
    ExerciseSelector.tsx
    ExerciseSelector.test.tsx
  mock-tests-page.tsx
  mock-tests-page.test.tsx
```

### Previous Story Learnings (Stories 3.1-3.12)

- **Story 3.11 (Tags)**: New model registration in TENANTED_MODELS is critical. Forgetting this breaks multi-tenancy.
- **Story 3.12 (AI Gen)**: `createPrisma` helper exists at `apps/backend/src/plugins/create-prisma.ts` for Inngest jobs. Not needed for this story (no background jobs).
- **Common code review issues**: Empty `onBlur` handlers, dead props, missing test coverage for all branches, duplicate case blocks. Keep code minimal, test every path.
- **Schema sync required**: After adding new routes, run `pnpm --filter=webapp sync-schema-dev` with backend running.
- **Prisma naming**: ALL models use `@@map("snake_case")`, ALL columns use `@map("snake_case")`. Tables NEVER use PascalCase in PostgreSQL.

### Useful Constants for UI

```ts
// Status badge color mapping (use with shadcn Badge variants)
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

// Test type display labels
const TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: "Academic",
  GENERAL_TRAINING: "General Training",
};

// IELTS standard question counts (for validation warnings)
const IELTS_STANDARD_QUESTIONS: Record<string, number> = {
  LISTENING: 40,
  READING: 40,
  WRITING: 2,   // Task 1 + Task 2
  SPEAKING: 3,  // Parts 1-3
};

// IELTS standard section counts
const IELTS_STANDARD_SECTIONS: Record<string, { label: string; count: string }> = {
  LISTENING: { label: "4 sections, ~40 questions", count: "4" },
  READING: { label: "3 passages, ~40 questions", count: "3" },
  WRITING: { label: "Task 1 + Task 2", count: "2" },
  SPEAKING: { label: "Parts 1-3", count: "3" },
};
```

### Git Intelligence

Recent commits follow `feat(exercises): implement story 3.X <description>` pattern. This story should use: `feat(mock-tests): implement story 3.13 mock test assembly`.

### Project Structure Notes

- Mock test backend files in `apps/backend/src/modules/mock-tests/` (new feature module)
- Mock test frontend files in `apps/webapp/src/features/mock-tests/` (new feature directory)
- Types in `packages/types/src/mock-tests.ts` (shared across backend/frontend)
- No cross-app imports — types from `@workspace/types`, DB from `@workspace/db`
- Band score tables and calculation functions are pure TypeScript — no external dependencies needed
- No Inngest background jobs needed for this story (all operations are synchronous CRUD)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.13 Mock Test Assembly (FR39)]
- [Source: _bmad-output/planning-artifacts/prd.md — FR39 mock test assembly with sections and unified scoring]
- [Source: _bmad-output/planning-artifacts/architecture.md — Route-Controller-Service, Multi-tenancy, Zod validation]
- [Source: project-context.md — Multi-tenancy, Prisma naming, Testing rules, Layered architecture]
- [Source: 3-12-ai-content-generation-reading.md — TENANTED_MODELS pattern, CRUD patterns, Inngest job patterns, frontend hook patterns]
- [Source: packages/db/prisma/schema.prisma — Exercise model (lines 420-469), IeltsQuestionType enum (lines 387-418)]
- [Source: packages/db/src/tenanted-client.ts — TENANTED_MODELS array]
- [Source: packages/types/src/exercises.ts — ExerciseSchema, CreateExerciseSchema, response patterns]
- [Source: packages/types/src/response.ts — createResponseSchema pattern: { data, message }]
- [Source: apps/backend/src/app.ts — Route registration pattern]
- [Source: apps/backend/src/modules/exercises/exercises.service.ts — CRUD service patterns, Firebase UID resolution, EXERCISE_INCLUDE constant]
- [Source: apps/backend/src/modules/exercises/sections.service.ts — reorderSections pattern]
- [Source: apps/webapp/src/App.tsx — React Router route definitions, ProtectedRoute pattern]
- [Source: apps/webapp/src/features/exercises/exercises-page.tsx — List page pattern with filters and data table]
- [Source: apps/webapp/src/features/exercises/components/ExerciseEditor.tsx — Tabbed editor pattern]
- [Source: apps/webapp/src/features/exercises/hooks/use-exercises.ts — Query key factory, mutation patterns]
- [Source: IELTS band conversion tables — IDP/British Council published data, cross-referenced from multiple IELTS preparation sources]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Backend tests: 510 passed (37 test files), 0 failures (post-review)
- Frontend tests: 469 passed (35 test files), 0 failures
- Mock-test specific: 64 backend tests (40 band-score + 24 service), 29 frontend tests (8 page + 11 editor + 10 selector)

### Completion Notes List

- All 16 tasks (42 subtasks) implemented and verified
- Task 1: Prisma schema — MockTest, MockTestSection, MockTestSectionExercise models added with proper indexes, cascade deletes, and TENANTED_MODELS registration
- Task 2: TypeScript/Zod schemas — Full type definitions for mock tests, sections, exercises, band scores, CRUD inputs, and response schemas
- Task 3: IELTS band score conversion tables — Listening, Academic Reading, General Training Reading tables + rawScoreToBand, roundToHalfBand, calculateWritingBand (double-weighted Task 2), calculateSpeakingBand, calculateOverallBand
- Task 4: MockTestsService — Full CRUD with auto-creation of 4 skill sections, publish validation (all sections populated, exercises still PUBLISHED), exercise skill matching, reorder, archive workflow
- Task 5: MockTestsController — Standard { data, message } response wrapping
- Task 6: Routes — 12 endpoints registered at /api/v1/mock-tests with auth + role middleware
- Task 7: Score preview endpoint — Returns question counts and criteria per section
- Task 8: Backend tests — 24 service tests + 37 band-score tests, all passing
- Task 9: Frontend hooks — useMockTests, useMockTest, useMockTestSections, useMockTestScorePreview with React Query
- Task 10: MockTestsPage — List with filters, create dialog, delete confirmation, status actions
- Task 11: MockTestEditor — Tabbed 4-skill + Review layout, exercise management, time limits, publish flow
- Task 12: ExerciseSelector — Dialog-based picker with search, skill filtering, duplicate prevention
- Task 13: IELTS standard references and validation warnings shown per section
- Task 14: Routes and navigation — Mock Tests added to App.tsx routes and navigation config (order 5, OWNER/ADMIN/TEACHER)
- Task 15: Frontend tests — 3 test files (8 + 11 + 10 = 29 tests) covering loading, empty, populated, filter, action states. Fixed pre-existing navigation.test.ts count mismatch (8→9 items)
- Task 16: Schema sync — OpenAPI types generated for all mock test endpoints

### File List

**New files:**
- packages/types/src/mock-tests.ts
- apps/backend/src/modules/mock-tests/band-score.ts
- apps/backend/src/modules/mock-tests/band-score.test.ts
- apps/backend/src/modules/mock-tests/mock-tests.service.ts
- apps/backend/src/modules/mock-tests/mock-tests.service.test.ts
- apps/backend/src/modules/mock-tests/mock-tests.controller.ts
- apps/backend/src/modules/mock-tests/mock-tests.routes.ts
- apps/webapp/src/features/mock-tests/mock-tests-page.tsx
- apps/webapp/src/features/mock-tests/mock-tests-page.test.tsx
- apps/webapp/src/features/mock-tests/hooks/use-mock-tests.ts
- apps/webapp/src/features/mock-tests/components/MockTestEditor.tsx
- apps/webapp/src/features/mock-tests/components/MockTestEditor.test.tsx
- apps/webapp/src/features/mock-tests/components/ExerciseSelector.tsx
- apps/webapp/src/features/mock-tests/components/ExerciseSelector.test.tsx

**Modified files:**
- packages/db/prisma/schema.prisma (added MockTest, MockTestSection, MockTestSectionExercise models + Exercise/User reverse relations)
- packages/db/src/tenanted-client.ts (added 3 mock-test models to TENANTED_MODELS)
- packages/types/src/index.ts (added mock-tests export)
- apps/backend/src/app.ts (registered mockTestRoutes at /api/v1/mock-tests)
- apps/webapp/src/App.tsx (added mock-tests routes)
- apps/webapp/src/core/config/navigation.ts (added Mock Tests nav item)
- apps/webapp/src/core/config/navigation.test.ts (updated counts for new nav item)
- apps/webapp/src/schema/schema.d.ts (regenerated with mock-test endpoints)

### Change Log

**2026-02-10 — Code Review (Adversarial)**

Review found 10 issues (1 CRITICAL, 4 HIGH, 3 MEDIUM, 2 LOW). All HIGH/MEDIUM issues fixed. Summary:

**Fixed:**
1. **[CRITICAL] Missing mock-tests/new route in App.tsx** — Task 14.1 was marked done but the `/mock-tests/new` route was missing from App.tsx. Added between `mock-tests` and `mock-tests/:id/edit`.
2. **[HIGH] band-score.ts division-by-zero on empty arrays** — `calculateWritingBand`, `calculateSpeakingBand`, `calculateOverallBand` had no guard for empty input arrays. Added early-return-0 guards + 3 new tests.
3. **[HIGH] routes.ts import/constant cleanup** — Duplicate `MockTestDataResponse` / `MockTestListDataResponse` inline schemas consolidated into single `DataResponseSchema`. Fixed import ordering (bare `z` import was interleaved with other imports).
4. **[MEDIUM] Missing response schemas in types package** — Added `MockTestSectionResponseSchema`, `MockTestSectionExerciseResponseSchema`, `ScorePreviewSkillSchema`, `ScorePreviewSchema`, `ScorePreviewResponseSchema` to `packages/types/src/mock-tests.ts`.

**Accepted (project-wide patterns, not story-specific):**
5. **[HIGH] `as 500`/`as 404` type assertions in routes** — Same pattern used in exercises routes. Project-wide improvement, not blocking this story.
6. **[HIGH] `eslint-disable any` in frontend hooks** — Same pattern used in exercises hooks (`data?.data as Exercise`). Project-wide improvement.
7. **[MEDIUM] Typed response schemas not usable in routes** — Prisma uses `String` fields (not enums) for `testType`/`status`, causing TS incompatibility with strict Zod enum response schemas. Routes use `z.unknown()` for data field. Requires Prisma enum migration to fix (future).
8. **[MEDIUM] No E2E/integration tests** — Consistent with project scope (unit tests only per project-context.md).
9. **[LOW] `as MockTestType` cast in service** — Safe narrowing since Prisma `String` field stores valid enum values. Same pattern as exercises.
10. **[LOW] Magic number 14400 in time limit validation** — 4 hours max, reasonable IELTS constraint. Not worth extracting to constant.
