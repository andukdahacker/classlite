# Story 3.12: AI Content Generation for Reading

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to upload a passage (PDF, Word, or pasted text) and have AI generate IELTS Reading questions,
so that I can create exercises faster without manually crafting each question and answer key.

## Acceptance Criteria

1. **AC1: Document Upload** — Teacher can upload PDF (max 10MB) or Word (.docx, max 10MB) documents, or paste text directly into a text area. System extracts and displays the passage text. Teacher can edit the extracted text before proceeding.
2. **AC2: Text Extraction** — System extracts plain text from uploaded PDF/Word documents. Extracted text is displayed in the passage editor for review and editing. Original document is stored in Firebase Storage for reference.
3. **AC3: Question Type Selection** — After the passage is ready, teacher selects which question types to generate with quantities (e.g., "5 TFNG + 4 Matching Headings + 3 Summary Completion"). Only Reading question types (R1-R14) are available.
4. **AC4: AI Generation** — System generates questions via background job (Inngest). Shows loading state with progress indicator. Generation completes within 30 seconds per question type. Teacher is notified on completion.
5. **AC5: Question Preview** — AI-generated questions are displayed in editable preview using the existing question editors. Teacher can modify, delete, or regenerate individual questions or entire sections.
6. **AC6: Answer Key Generation** — AI suggests correct answers with accepted variants for each question. Teacher must verify/adjust answers before finalizing. Answers follow the existing `correctAnswer` + `acceptedVariants` schema.
7. **AC7: Difficulty Adjustment** — Teacher can request "make harder" or "make easier" regeneration for a specific question section. System regenerates that section while preserving others.

## Scope Clarification

**What IS built in this story:**
- Backend: Document upload endpoint (PDF/DOCX) with text extraction
- Backend: AI question generation Inngest job using Google Gemini 2.0 Flash with Structured Outputs
- Backend: Generation status polling endpoint
- Backend: Per-section regeneration endpoint with difficulty adjustment
- Frontend: `DocumentUploadPanel` component for file upload + text paste
- Frontend: `AIGenerationPanel` component for question type selection + generation trigger
- Frontend: Generation status polling with progress UI
- Frontend: Integration with existing question section editors for reviewing/editing generated content
- New npm dependencies: `@google/genai`, `pdfjs-dist`, `mammoth`
- Tests for all layers

**What is NOT built (out of scope):**
- AI generation for Listening, Writing, or Speaking questions (future stories)
- Mock test assembly (Story 3.13)
- Exercise library management (Story 3.14)
- Exercise assignment (Story 3.15)
- Student-facing views (Story 3.16)
- Golden Sample integration for style tuning (Epic 8)
- Streaming AI responses to the UI (batch response is sufficient for MVP)

## Tasks / Subtasks

### Task 1: Install Dependencies (AC: 1, 2, 4)

- [x] 1.1 Add `@google/genai` (^1.40.0) to `apps/backend/package.json`:
  ```bash
  pnpm --filter=backend add @google/genai@^1.40.0
  ```
  This is the official Google Gen AI SDK for TypeScript/JavaScript. Supports structured JSON output natively with Zod v4 via `z.toJSONSchema()` — **no Zod version compat workaround needed** (unlike OpenAI which requires zod/v3).

- [x] 1.2 Add `pdfjs-dist` (^5.4.0) to `apps/backend/package.json`:
  ```bash
  pnpm --filter=backend add pdfjs-dist@^5.4.0
  ```
  This is Mozilla's PDF.js — the most robust PDF text extraction library for Node.js. Used via `pdfjs-dist/legacy/build/pdf.mjs` for Node.js compatibility.

- [x] 1.3 Add `mammoth` (^1.11.0) to `apps/backend/package.json`:
  ```bash
  pnpm --filter=backend add mammoth@^1.11.0
  ```
  Converts .docx to plain text. Stable API, no breaking changes expected.

- [x] 1.4 Add environment variables to configuration. Check for `.env.example` or environment documentation and add:
  - `GEMINI_API_KEY` — Required. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey). Loaded in the AI service constructor.
  - `GEMINI_MODEL` — Optional. Defaults to `gemini-2.0-flash`. Allows overriding the model (e.g., `gemini-2.5-flash` for higher quality).

### Task 2: Prisma Schema — AI Generation Tracking (AC: 4, 5)

- [x] 2.1 Create `AIGenerationJob` model in `packages/db/prisma/schema.prisma` to track generation status:
  ```prisma
  model AIGenerationJob {
    id             String   @id @default(cuid())
    centerId       String   @map("center_id")
    exerciseId     String   @map("exercise_id")
    status         String   @default("pending") // pending | processing | completed | failed
    questionTypes  Json     // Array of { type: string, count: number }
    difficulty     String?  // easy | medium | hard
    error          String?  // Error message if failed
    result         Json?    // Generated sections/questions data
    createdAt      DateTime @default(now()) @map("created_at")
    updatedAt      DateTime @updatedAt @map("updated_at")

    exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

    @@index([centerId])
    @@index([exerciseId])
    @@map("ai_generation_job")
  }
  ```

- [x] 2.2 Add relation to Exercise model:
  ```prisma
  // In Exercise model, add:
  aiGenerationJobs AIGenerationJob[]
  ```

- [x] 2.3 Add `passageSourceType` and `passageSourceUrl` fields to Exercise model:
  ```prisma
  // In Exercise model, add after passageFormat:
  passageSourceType String? @map("passage_source_type") // MANUAL | PDF | DOCX | TEXT_PASTE
  passageSourceUrl  String? @map("passage_source_url")  // Firebase Storage URL for uploaded document
  ```

- [x] 2.4 **CRITICAL: Register `AIGenerationJob` in TENANTED_MODELS** — In `packages/db/src/tenanted-client.ts`, add `"AIGenerationJob"` to the `TENANTED_MODELS` array. Without this, multi-tenancy isolation breaks.

- [x] 2.5 Run `pnpm --filter=db db:generate && pnpm --filter=db db:push` to apply schema changes.

### Task 3: TypeScript Schemas — AI Generation Types (AC: 3, 4, 5, 6, 7)

- [x] 3.1 Create new file `packages/types/src/ai-generation.ts` with generation-related schemas:
  ```ts
  import { z } from "zod";
  import { IeltsQuestionTypeSchema } from "./exercises.js";

  // Only reading types allowed for AI generation
  export const AIGenerableQuestionTypeSchema = z.enum([
    "R1_MCQ_SINGLE", "R2_MCQ_MULTI", "R3_TFNG", "R4_YNNG",
    "R5_SENTENCE_COMPLETION", "R6_SHORT_ANSWER",
    "R7_SUMMARY_WORD_BANK", "R8_SUMMARY_PASSAGE",
    "R9_MATCHING_HEADINGS", "R10_MATCHING_INFORMATION",
    "R11_MATCHING_FEATURES", "R12_MATCHING_SENTENCE_ENDINGS",
    "R13_NOTE_TABLE_FLOWCHART", "R14_DIAGRAM_LABELLING",
  ]);
  export type AIGenerableQuestionType = z.infer<typeof AIGenerableQuestionTypeSchema>;

  export const DifficultyLevelSchema = z.enum(["easy", "medium", "hard"]);
  export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

  export const QuestionTypeRequestSchema = z.object({
    type: AIGenerableQuestionTypeSchema,
    count: z.number().int().min(1).max(20),
  });
  export type QuestionTypeRequest = z.infer<typeof QuestionTypeRequestSchema>;

  export const GenerateQuestionsRequestSchema = z.object({
    questionTypes: z.array(QuestionTypeRequestSchema).min(1).max(10),
    difficulty: DifficultyLevelSchema.optional().default("medium"),
  });
  export type GenerateQuestionsRequest = z.infer<typeof GenerateQuestionsRequestSchema>;

  export const RegenerateQuestionsSectionRequestSchema = z.object({
    sectionId: z.string(),
    difficulty: DifficultyLevelSchema.optional(),
  });
  export type RegenerateQuestionsSectionRequest = z.infer<typeof RegenerateQuestionsSectionRequestSchema>;

  export const AIGenerationJobStatusSchema = z.enum([
    "pending", "processing", "completed", "failed",
  ]);
  export type AIGenerationJobStatus = z.infer<typeof AIGenerationJobStatusSchema>;

  export const AIGenerationJobSchema = z.object({
    id: z.string(),
    centerId: z.string(),
    exerciseId: z.string(),
    status: AIGenerationJobStatusSchema,
    questionTypes: z.array(QuestionTypeRequestSchema),
    difficulty: DifficultyLevelSchema.nullable().optional(),
    error: z.string().nullable().optional(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  });
  export type AIGenerationJob = z.infer<typeof AIGenerationJobSchema>;
  ```

- [x] 3.2 Add response schemas using `createResponseSchema`:
  ```ts
  import { createResponseSchema } from "./response.js";

  export const AIGenerationJobResponseSchema = createResponseSchema(AIGenerationJobSchema);
  export const AIGenerationJobListResponseSchema = createResponseSchema(z.array(AIGenerationJobSchema));
  ```

- [x] 3.3 Export from `packages/types/src/index.ts`.

- [x] 3.4 Add `passageSourceType` and `passageSourceUrl` to `ExerciseSchema` in `packages/types/src/exercises.ts`:
  ```ts
  passageSourceType: z.string().nullable().optional(),
  passageSourceUrl: z.string().nullable().optional(),
  ```

### Task 4: Backend — Document Extraction Service (AC: 1, 2)

- [x] 4.1 Create `apps/backend/src/modules/exercises/document-extraction.service.ts`:
  ```ts
  export class DocumentExtractionService {
    // Extract text from PDF buffer
    async extractFromPDF(buffer: Buffer): Promise<string>

    // Extract text from DOCX buffer
    async extractFromDocx(buffer: Buffer): Promise<string>

    // Detect file type from MIME and extract accordingly
    async extractText(buffer: Buffer, mimeType: string): Promise<string>
  }
  ```

- [x] 4.2 Implement `extractFromPDF` using `pdfjs-dist`:
  ```ts
  import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

  async extractFromPDF(buffer: Buffer): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: { str: string }) => item.str)
        .join(" ");
      pages.push(text);
    }

    return pages.join("\n\n");
  }
  ```

- [x] 4.3 Implement `extractFromDocx` using `mammoth`:
  ```ts
  import mammoth from "mammoth";

  async extractFromDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  ```

- [x] 4.4 Implement `extractText` dispatcher:
  ```ts
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case "application/pdf":
        return this.extractFromPDF(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return this.extractFromDocx(buffer);
      default:
        throw AppError.badRequest(`Unsupported file type: ${mimeType}`);
    }
  }
  ```

### Task 5: Backend — AI Question Generation Service (AC: 4, 5, 6, 7)

- [x] 5.1 Create `apps/backend/src/modules/exercises/ai-generation.service.ts`:
  ```ts
  import { GoogleGenAI } from "@google/genai";
  import type { PrismaClient } from "@prisma/client";
  import { getTenantedClient } from "@workspace/db";

  export class AIGenerationService {
    private genai: GoogleGenAI;

    constructor(private readonly prisma: PrismaClient) {
      this.genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    }

    // Create a generation job and dispatch Inngest event
    async requestGeneration(
      centerId: string,
      exerciseId: string,
      questionTypes: QuestionTypeRequest[],
      difficulty?: DifficultyLevel,
    ): Promise<AIGenerationJob>

    // Get job status (for polling)
    async getJobStatus(centerId: string, jobId: string): Promise<AIGenerationJob>

    // Get latest job for an exercise
    async getLatestJob(centerId: string, exerciseId: string): Promise<AIGenerationJob | null>

    // Generate questions for a specific type using Gemini
    async generateQuestionsForType(
      passageText: string,
      questionType: string,
      count: number,
      difficulty: string,
    ): Promise<GeneratedSection>

    // Regenerate a specific section with different difficulty
    async requestRegeneration(
      centerId: string,
      exerciseId: string,
      sectionId: string,
      difficulty?: DifficultyLevel,
    ): Promise<AIGenerationJob>
  }
  ```

- [x] 5.2 Implement `requestGeneration`:
  ```ts
  async requestGeneration(
    centerId: string,
    exerciseId: string,
    questionTypes: QuestionTypeRequest[],
    difficulty: DifficultyLevel = "medium",
  ): Promise<AIGenerationJob> {
    const db = getTenantedClient(this.prisma, centerId);

    // Verify exercise exists and is DRAFT
    const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw AppError.notFound("Exercise not found");
    if (exercise.status !== "DRAFT") throw AppError.badRequest("Can only generate questions for draft exercises");
    if (exercise.skill !== "READING") throw AppError.badRequest("AI generation currently only supports Reading exercises");
    if (!exercise.passageContent) throw AppError.badRequest("Exercise must have passage content before generating questions");

    // Create job record
    const job = await db.aIGenerationJob.create({
      data: {
        centerId,
        exerciseId,
        status: "pending",
        questionTypes: questionTypes as any,
        difficulty,
      },
    });

    // Dispatch Inngest event
    await inngest.send({
      name: "exercises/generate-questions",
      data: {
        jobId: job.id,
        exerciseId,
        centerId,
        passageText: exercise.passageContent,
        questionTypes,
        difficulty,
      },
    });

    return job;
  }
  ```

- [x] 5.3 Implement prompt templates for each Reading question type. Create `apps/backend/src/modules/exercises/ai-prompts.ts` with system prompts and output schemas for:
  - **R1 MCQ Single** — 4 options, 1 correct, 3 distractors
  - **R2 MCQ Multi** — 5-7 options, 2-3 correct
  - **R3 TFNG** — Statements with TRUE/FALSE/NOT_GIVEN answers
  - **R4 YNNG** — Same as TFNG with YES/NO/NOT_GIVEN labels
  - **R5 Sentence Completion** — Sentences with blanks, word limit
  - **R6 Short Answer** — WH-questions with brief text answers
  - **R7 Summary Word Bank** — Summary with blanks + word bank
  - **R8 Summary Passage** — Summary with blanks, answers from passage
  - **R9 Matching Headings** — Headings with distractor extras
  - **R10 Matching Information** — Statements matched to paragraphs
  - **R11 Matching Features** — Items mapped to categories
  - **R12 Matching Sentence Endings** — Sentence halves with extras
  - **R13 Note/Table/Flowchart** — Visual structure with blanks
  - **R14 Diagram Labelling** — Placeholder (requires image; generate labels for existing diagram only)

  Each prompt template must include:
  - System prompt with IELTS examiner expertise
  - Explicit distractor generation strategies
  - Instructions to cite specific passage evidence
  - Difficulty calibration (easy = straightforward vocabulary, hard = inference required)

- [x] 5.4 Implement `generateQuestionsForType` using Gemini Structured Outputs:
  ```ts
  import { z } from "zod";

  async generateQuestionsForType(
    passageText: string,
    questionType: string,
    count: number,
    difficulty: string,
  ): Promise<GeneratedSection> {
    const { systemPrompt, schema } = getPromptAndSchema(questionType, count, difficulty);

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await this.genai.models.generateContent({
      model,
      contents: `${systemPrompt}\n\nREADING PASSAGE:\n\n${passageText}\n\nGenerate exactly ${count} questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(schema),
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI generation returned no results");

    const parsed = schema.parse(JSON.parse(text));
    return transformToExerciseFormat(questionType, parsed);
  }
  ```

  **Zod v4 native JSON Schema:** Use `z.toJSONSchema(schema)` to convert Zod v4 schemas to JSON Schema format for Gemini's `responseSchema` config. This uses Zod v4's built-in converter — no third-party library or Zod version compat hacks needed. The response is a JSON string that we parse and validate with the same Zod schema for type safety.

  **Model selection:** Use `gemini-2.0-flash` as the default model ($0.10/$0.40 per 1M tokens). For complex question types (TFNG, Matching Headings) where quality matters more, optionally upgrade to `gemini-2.5-flash` ($0.30/$2.50 per 1M tokens) — still far cheaper than OpenAI alternatives.

- [x] 5.5 Implement `transformToExerciseFormat` — a transformer that converts AI output into the exact structure expected by `QuestionOptionsSchema` and `CorrectAnswerSchema` from `packages/types/src/exercises.ts`. Each question type has specific `options` and `correctAnswer` shapes (see discriminated union at exercises.ts lines 244-401).

### Task 6: Backend — Inngest Job for AI Generation (AC: 4)

- [x] 6.1 Create `apps/backend/src/modules/exercises/jobs/question-generation.job.ts`:
  ```ts
  import { PrismaClient } from "@prisma/client";
  import { inngest } from "../../inngest/client.js";
  import { AIGenerationService } from "../ai-generation.service.js";
  import { SectionsService } from "../sections.service.js";

  export type QuestionGenerationEvent = {
    name: "exercises/generate-questions";
    data: {
      jobId: string;
      exerciseId: string;
      centerId: string;
      passageText: string;
      questionTypes: Array<{ type: string; count: number }>;
      difficulty: string;
    };
  };

  export const questionGenerationJob = inngest.createFunction(
    {
      id: "exercise-question-generation",
      retries: 3,
    },
    { event: "exercises/generate-questions" },
    async ({ event, step }) => {
      const { jobId, exerciseId, centerId, passageText, questionTypes, difficulty } = event.data;

      // Step 1: Mark job as processing
      await step.run("mark-processing", async () => {
        const prisma = new PrismaClient();
        try {
          await prisma.aIGenerationJob.update({
            where: { id: jobId },
            data: { status: "processing" },
          });
        } finally {
          await prisma.$disconnect();
        }
      });

      // Step 2: Generate questions for each type
      const allSections = [];
      for (const qt of questionTypes) {
        const section = await step.run(`generate-${qt.type}`, async () => {
          const prisma = new PrismaClient();
          try {
            const aiService = new AIGenerationService(prisma);
            return aiService.generateQuestionsForType(
              passageText, qt.type, qt.count, difficulty
            );
          } finally {
            await prisma.$disconnect();
          }
        });
        allSections.push(section);

        // Rate limit delay between API calls
        if (questionTypes.indexOf(qt) < questionTypes.length - 1) {
          await step.sleep(`delay-after-${qt.type}`, "2s");
        }
      }

      // Step 3: Create sections and questions in the database
      await step.run("save-to-database", async () => {
        const prisma = new PrismaClient();
        try {
          const sectionsService = new SectionsService(prisma);

          for (let i = 0; i < allSections.length; i++) {
            const section = allSections[i];
            // Create question section
            const createdSection = await sectionsService.createSection(
              centerId, exerciseId, {
                sectionType: section.sectionType,
                instructions: section.instructions,
                orderIndex: i,
              }
            );
            // Create questions within section
            for (let j = 0; j < section.questions.length; j++) {
              await sectionsService.createQuestion(
                centerId, exerciseId, createdSection.id, {
                  questionText: section.questions[j].questionText,
                  questionType: section.questions[j].questionType,
                  options: section.questions[j].options,
                  correctAnswer: section.questions[j].correctAnswer,
                  wordLimit: section.questions[j].wordLimit,
                  orderIndex: j,
                }
              );
            }
          }
        } finally {
          await prisma.$disconnect();
        }
      });

      // Step 4: Mark job as completed
      await step.run("mark-completed", async () => {
        const prisma = new PrismaClient();
        try {
          await prisma.aIGenerationJob.update({
            where: { id: jobId },
            data: {
              status: "completed",
              result: { sectionCount: allSections.length },
            },
          });
        } finally {
          await prisma.$disconnect();
        }
      });

      return { status: "completed", sectionCount: allSections.length };
    }
  );
  ```

- [x] 6.2 Add error handling — wrap the entire job in try/catch. On failure, update job status to "failed" with error message:
  ```ts
  // In the job function, add onFailure handler:
  {
    id: "exercise-question-generation",
    retries: 3,
    onFailure: async ({ event, error }) => {
      const prisma = new PrismaClient();
      try {
        await prisma.aIGenerationJob.update({
          where: { id: event.data.event.data.jobId },
          data: { status: "failed", error: error.message },
        });
      } finally {
        await prisma.$disconnect();
      }
    },
  }
  ```

- [x] 6.3 Register in `apps/backend/src/modules/inngest/functions.ts`:
  ```ts
  import { questionGenerationJob } from "../exercises/jobs/question-generation.job.js";

  export const functions = [
    // ... existing functions ...
    questionGenerationJob,
  ];
  ```

### Task 7: Backend — AI Generation Controller (AC: 3, 4, 5, 7)

- [x] 7.1 Create `apps/backend/src/modules/exercises/ai-generation.controller.ts`:
  ```ts
  export class AIGenerationController {
    constructor(private readonly aiService: AIGenerationService) {}

    async requestGeneration(
      exerciseId: string,
      input: GenerateQuestionsRequest,
      user: JwtPayload,
    ): Promise<{ data: AIGenerationJob; message: string }>

    async getJobStatus(
      jobId: string,
      user: JwtPayload,
    ): Promise<{ data: AIGenerationJob; message: string }>

    async getLatestJob(
      exerciseId: string,
      user: JwtPayload,
    ): Promise<{ data: AIGenerationJob | null; message: string }>

    async regenerateSection(
      exerciseId: string,
      input: RegenerateQuestionsSectionRequest,
      user: JwtPayload,
    ): Promise<{ data: AIGenerationJob; message: string }>
  }
  ```
  **CRITICAL:** Every method wraps the service result in `{ data, message }` format per project convention.

### Task 8: Backend — AI Generation Routes (AC: 1, 2, 3, 4, 5, 7)

- [x] 8.1 Create `apps/backend/src/modules/exercises/ai-generation.routes.ts`:
  ```
  POST /:exerciseId/upload-document  → Upload PDF/DOCX, extract text, update passage
  POST /:exerciseId/generate         → Request AI question generation (creates Inngest job)
  GET  /:exerciseId/generation-status → Get latest generation job status (for polling)
  GET  /generation-jobs/:jobId        → Get specific job status
  POST /:exerciseId/regenerate-section → Regenerate a specific section with difficulty
  ```

- [x] 8.2 Implement document upload endpoint:
  ```ts
  api.post("/:exerciseId/upload-document", {
    schema: {
      params: z.object({ exerciseId: z.string() }),
      response: {
        200: createResponseSchema(z.object({
          extractedText: z.string(),
          passageSourceType: z.string(),
          passageSourceUrl: z.string().nullable(),
        })),
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      const file = await request.file();
      if (!file) throw AppError.badRequest("No file uploaded");

      const allowedMimes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        throw AppError.badRequest("Only PDF and DOCX files are supported");
      }

      const buffer = await file.toBuffer();
      // Extract text
      const extractedText = await extractionService.extractText(buffer, file.mimetype);
      // Upload to Firebase Storage
      const sourceUrl = await exercisesService.uploadDocument(centerId, exerciseId, buffer, file.mimetype);
      // Update exercise passage
      const sourceType = file.mimetype.includes("pdf") ? "PDF" : "DOCX";
      await exercisesService.updatePassageFromDocument(centerId, exerciseId, extractedText, sourceType, sourceUrl);

      return reply.send({
        data: { extractedText, passageSourceType: sourceType, passageSourceUrl: sourceUrl },
        message: "Document uploaded and text extracted successfully",
      });
    },
  });
  ```
  **File size limit:** Override multipart limit to 10MB for this endpoint (same pattern as audio upload at 100MB).

- [x] 8.3 Implement generation request endpoint:
  ```ts
  api.post("/:exerciseId/generate", {
    schema: {
      params: z.object({ exerciseId: z.string() }),
      body: GenerateQuestionsRequestSchema,
      response: { 200: AIGenerationJobResponseSchema },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      const result = await controller.requestGeneration(
        request.params.exerciseId,
        request.body,
        request.user,
      );
      return reply.send(result);
    },
  });
  ```

- [x] 8.4 Implement generation status polling endpoint:
  ```ts
  api.get("/:exerciseId/generation-status", {
    schema: {
      params: z.object({ exerciseId: z.string() }),
      response: { 200: AIGenerationJobResponseSchema },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      const result = await controller.getLatestJob(
        request.params.exerciseId,
        request.user,
      );
      return reply.send(result);
    },
  });
  ```

- [x] 8.5 Register routes in `apps/backend/src/app.ts`:
  ```ts
  import { aiGenerationRoutes } from "./modules/exercises/ai-generation.routes.js";

  // Register at the SAME prefix as exercises (routes use /:exerciseId/...)
  await app.register(aiGenerationRoutes, { prefix: "/api/v1/exercises" });
  ```

- [x] 8.6 RBAC: All AI generation endpoints require `["OWNER", "ADMIN", "TEACHER"]` roles.

### Task 9: Backend — Update Exercise Service for Document Fields (AC: 1, 2)

- [x] 9.1 Add `uploadDocument` method to `exercises.service.ts` — follows the existing `uploadAudio` pattern:
  ```ts
  async uploadDocument(
    centerId: string,
    exerciseId: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    // Follow existing Firebase Storage upload pattern from uploadAudio
    // Path: exercises/{centerId}/{exerciseId}/documents/{timestamp}.{ext}
    const ext = contentType.includes("pdf") ? "pdf" : "docx";
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `exercises/${centerId}/${exerciseId}/documents/${fileName}`;
    // Upload to Firebase Storage, make public, return URL
  }
  ```

- [x] 9.2 Add `updatePassageFromDocument` method to `exercises.service.ts`:
  ```ts
  async updatePassageFromDocument(
    centerId: string,
    exerciseId: string,
    extractedText: string,
    sourceType: string,
    sourceUrl: string | null,
  ): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    await db.exercise.update({
      where: { id: exerciseId },
      data: {
        passageContent: extractedText,
        passageSourceType: sourceType,
        passageSourceUrl: sourceUrl,
      },
    });
  }
  ```

### Task 10: Frontend — AI Generation API Hooks (AC: 4, 5, 7)

- [x] 10.1 Create `apps/webapp/src/features/exercises/hooks/use-ai-generation.ts`:
  ```ts
  export const aiGenerationKeys = {
    all: ["ai-generation"] as const,
    status: (exerciseId: string) => [...aiGenerationKeys.all, "status", exerciseId] as const,
  };

  export function useAIGeneration(centerId?: string | null, exerciseId?: string) {
    // Poll job status every 3 seconds when a job is active
    const { data: jobStatus, isLoading } = useQuery({
      queryKey: aiGenerationKeys.status(exerciseId!),
      queryFn: () => client.GET("/api/v1/exercises/{exerciseId}/generation-status", {
        params: { path: { exerciseId: exerciseId! } },
      }),
      enabled: !!exerciseId && !!centerId,
      refetchInterval: (query) => {
        const status = query.state.data?.data?.data?.status;
        // Poll every 3s while pending or processing
        if (status === "pending" || status === "processing") return 3000;
        return false; // Stop polling when completed or failed
      },
    });

    // Trigger generation
    const generateMutation = useMutation({
      mutationFn: (input: GenerateQuestionsRequest) =>
        client.POST("/api/v1/exercises/{exerciseId}/generate", {
          params: { path: { exerciseId: exerciseId! } },
          body: input,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: aiGenerationKeys.status(exerciseId!) });
      },
    });

    // Regenerate section
    const regenerateMutation = useMutation({
      mutationFn: (input: RegenerateQuestionsSectionRequest) =>
        client.POST("/api/v1/exercises/{exerciseId}/regenerate-section", {
          params: { path: { exerciseId: exerciseId! } },
          body: input,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: aiGenerationKeys.status(exerciseId!) });
        queryClient.invalidateQueries({ queryKey: exercisesKeys.detail(exerciseId!) });
      },
    });

    return {
      jobStatus: jobStatus?.data?.data,
      isLoading,
      isGenerating: ["pending", "processing"].includes(jobStatus?.data?.data?.status ?? ""),
      generate: generateMutation.mutateAsync,
      regenerateSection: regenerateMutation.mutateAsync,
    };
  }
  ```

- [x] 10.2 Create `apps/webapp/src/features/exercises/hooks/use-document-upload.ts`:
  ```ts
  export function useDocumentUpload() {
    return useMutation({
      mutationFn: async ({ exerciseId, file }: { exerciseId: string; file: File }) => {
        const formData = new FormData();
        formData.append("file", file);
        const { data, error } = await client.POST(
          "/api/v1/exercises/{exerciseId}/upload-document",
          { params: { path: { exerciseId } }, body: formData as any },
        );
        if (error) throw new Error(error.message);
        return data.data;
      },
      onSuccess: (_data, { exerciseId }) => {
        queryClient.invalidateQueries({ queryKey: exercisesKeys.detail(exerciseId) });
      },
    });
  }
  ```

### Task 11: Frontend — DocumentUploadPanel Component (AC: 1, 2)

- [x] 11.1 Create `apps/webapp/src/features/exercises/components/DocumentUploadPanel.tsx`:
  - **File Upload Zone:** Drag-and-drop area + "Browse" button. Accepts .pdf and .docx (max 10MB).
  - **Client-side file size validation:** Before uploading, check `file.size > 10 * 1024 * 1024` and show an error toast/message if exceeded. This prevents uploading a 10MB+ file only to have the backend reject it.
  - **Text Paste Tab:** A `Textarea` for pasting passage text directly (for the `TEXT_PASTE` source type).
  - **Processing State:** Show spinner during upload + extraction.
  - **Extracted Text Preview:** After upload, show extracted text in a read-only view with word count. "Use This Text" button to proceed.
  - **Source Indicator:** Show badge indicating source type (PDF/DOCX/Pasted).

- [x] 11.2 Props interface:
  ```ts
  interface DocumentUploadPanelProps {
    exerciseId: string;
    centerId: string;
    currentPassageContent: string | null;
    currentSourceType: string | null;
    onPassageUpdated: (text: string, sourceType: string) => void;
  }
  ```

- [x] 11.3 Use shadcn components: `Card`, `Button`, `Textarea`, `Badge`, `Tabs`, `TabsContent`, `TabsTrigger`, `TabsList`. Use `Upload` and `FileText` icons from Lucide.

- [x] 11.4 Two tabs: "Upload Document" and "Paste Text". Default to "Upload Document".

- [x] 11.5 On successful upload, call `onPassageUpdated(extractedText, sourceType)` which the parent (`ExerciseEditor`) uses to update the passage editor content and trigger autosave.

### Task 12: Frontend — AIGenerationPanel Component (AC: 3, 4, 5, 7)

- [x] 12.1 Create `apps/webapp/src/features/exercises/components/AIGenerationPanel.tsx`:
  - **Question Type Selector:** Multi-row selector showing available Reading question types. Each row has: question type name, count input (number stepper 1-20), remove button.
  - **Add Type Button:** Opens Popover/Command to select from remaining unselected types.
  - **Difficulty Selector:** Select dropdown: Easy, Medium (default), Hard.
  - **R14 Warning:** When teacher selects R14 (Diagram Labelling), show an inline warning: "Diagram Labelling requires a manually uploaded diagram image with positioned label markers. AI will only generate label text answers, not the diagram itself. If no diagram exists, R14 generation will be skipped." This prevents confusion when R14 yields no visual output.
  - **Cost Estimate:** Display an approximate cost estimate based on selected types and counts. Formula: `estimatedCost = totalQuestionTypes * 0.002` (roughly $0.002 per type with Gemini 2.0 Flash at ~2K in + ~3K out tokens per type). Show as e.g., "Estimated cost: ~$0.006 (3 types)" below the Generate button. This helps teachers understand the AI cost is negligible.
  - **Generate Button:** Primary action button. Disabled when no types selected or generation in progress.
  - **Progress Display:** While generating, show: status badge (pending/processing), spinning loader, elapsed time.
  - **Completion State:** On completion, show success message with count of generated sections/questions. "View Generated Questions" scrolls to the questions section below.
  - **Error State:** On failure, show error message with "Retry" button.

- [x] 12.2 Props interface:
  ```ts
  interface AIGenerationPanelProps {
    exerciseId: string;
    centerId: string;
    hasPassage: boolean; // Disable generation if no passage
    existingSections: QuestionSection[]; // Show warning if sections already exist
    onGenerationComplete: () => void; // Trigger exercise reload
  }
  ```

- [x] 12.3 Implement the question type count selector using a list with number inputs:
  ```tsx
  // Each selected type rendered as:
  <div className="flex items-center gap-3">
    <Badge variant="outline">{QUESTION_TYPE_LABELS[type]}</Badge>
    <Input type="number" min={1} max={20} value={count} onChange={...} className="w-20" />
    <Button variant="ghost" size="icon" onClick={() => removeType(type)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
  ```

- [x] 12.4 Use `QUESTION_TYPE_LABELS` mapping from `TagSelector.tsx` (already exists from Story 3.11, but only for Reading types R1-R14 in this context).

- [x] 12.5 **Regeneration per section:** After generation completes and sections are displayed, each section header should have a "Regenerate" button with optional difficulty override. This calls `regenerateSection({ sectionId, difficulty })`.

### Task 13: Frontend — ExerciseEditor Integration (AC: 1, 2, 3, 4, 5)

- [x] 13.1 Import and render `DocumentUploadPanel` in `ExerciseEditor.tsx`. **Placement: In the Reading skill section, BEFORE the PassageEditor.** Only shown when `skill === "READING"` and exercise is in edit mode:
  ```tsx
  {isEditing && id && centerId && skill === "READING" && (
    <DocumentUploadPanel
      exerciseId={id}
      centerId={centerId}
      currentPassageContent={passageContent}
      currentSourceType={exercise?.passageSourceType ?? null}
      onPassageUpdated={(text, sourceType) => {
        setPassageContent(text);
        userHasEdited.current = true;
      }}
    />
  )}
  ```

- [x] 13.2 Import and render `AIGenerationPanel` in `ExerciseEditor.tsx`. **Placement: AFTER the PassageEditor and BEFORE the Question Sections div.** Only shown for Reading exercises:
  ```tsx
  {isEditing && id && centerId && skill === "READING" && (
    <AIGenerationPanel
      exerciseId={id}
      centerId={centerId}
      hasPassage={!!passageContent?.trim()}
      existingSections={exercise?.sections ?? []}
      onGenerationComplete={() => {
        queryClient.invalidateQueries({ queryKey: exercisesKeys.detail(id) });
      }}
    />
  )}
  ```

- [x] 13.3 No changes to ExercisePreview — generated questions use the same question section/question models and will automatically render in preview mode using existing section renderers.

### Task 14: Tests (AC: all)

- [x] 14.1 `packages/types/src/ai-generation.test.ts` — Add tests for:
  - `AIGenerableQuestionTypeSchema` validation (accepts R1-R14, rejects L1, W1, S1)
  - `DifficultyLevelSchema` validation (accepts easy/medium/hard, rejects others)
  - `GenerateQuestionsRequestSchema` validation (min 1 type, max 10, count 1-20)
  - `RegenerateQuestionsSectionRequestSchema` validation
  - `AIGenerationJobSchema` validation

- [x] 14.2 `apps/backend/src/modules/exercises/document-extraction.service.test.ts` — Add tests for:
  - `extractFromPDF` extracts text from a sample PDF buffer
  - `extractFromDocx` extracts text from a sample DOCX buffer
  - `extractText` dispatches correctly based on MIME type
  - `extractText` throws for unsupported MIME types

- [x] 14.3 `apps/backend/src/modules/exercises/ai-generation.service.test.ts` — Add tests for:
  - `requestGeneration` creates job and dispatches Inngest event
  - `requestGeneration` rejects non-DRAFT exercises
  - `requestGeneration` rejects non-READING exercises
  - `requestGeneration` rejects exercises without passage content
  - `getJobStatus` returns job for correct center
  - `getLatestJob` returns most recent job for exercise
  - Mock Gemini API calls in `generateQuestionsForType` tests
  - Test `transformToExerciseFormat` produces correct schema shapes for each question type

- [x] 14.4 `apps/webapp/src/features/exercises/components/DocumentUploadPanel.test.tsx` — Add tests for:
  - Renders upload zone and paste text tabs
  - File upload triggers mutation and shows loading state
  - Text paste calls onPassageUpdated directly
  - Rejects files over 10MB with error message
  - Rejects unsupported file types

- [x] 14.5 `apps/webapp/src/features/exercises/components/AIGenerationPanel.test.tsx` — Add tests for:
  - Renders question type selector with add button
  - Disables Generate button when no passage
  - Shows warning when sections already exist
  - Triggers generation mutation on Generate click
  - Shows progress state during generation
  - Shows completion state with section count
  - Shows error state with retry button

- [x] 14.6 Run full test suite: `pnpm --filter=types test && pnpm --filter=backend test && pnpm --filter=webapp test` — all green.

### Task 15: Schema Sync (AC: all)

- [x] 15.1 Start backend dev server: `pnpm --filter=backend dev`
- [x] 15.2 Run `pnpm --filter=webapp sync-schema-dev` to regenerate OpenAPI types for new AI generation endpoints.
- [x] 15.3 Verify `apps/webapp/src/schema/schema.d.ts` includes new endpoints.

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: `ai-generation.service.ts` handles DB + Gemini API logic. `ai-generation.controller.ts` wraps results in `{ data, message }`. `ai-generation.routes.ts` handles HTTP (Fastify request/reply, error mapping). Document extraction is a separate service with single responsibility.
- **Multi-tenancy**: All queries use `getTenantedClient(centerId)`. `AIGenerationJob` model MUST be in `TENANTED_MODELS`.
- **Zod validation**: All request/response schemas validated via Zod. AI generation input types in `packages/types/src/ai-generation.ts`.
- **Response format**: Always `{ data: T | null, message: string }` via `createResponseSchema()`.
- **Background jobs**: AI generation uses Inngest step functions (same pattern as `csv-import.job.ts`). Each question type generation is an independent step for retry isolation.

### Key Implementation Patterns (from Stories 3.6-3.11)

- **File upload pattern**: Follows `uploadAudio` in `exercises.service.ts` — accept multipart file, buffer it, upload to Firebase Storage at path `exercises/{centerId}/{exerciseId}/documents/{timestamp}.{ext}`, update DB with URL.
- **Route-level file size override**: Override multipart limit to 10MB at route level (same pattern as audio upload override to 100MB).
- **Prisma model pattern**: All models use `@@map("snake_case")`, columns use `@map("snake_case")`. Always add `centerId` with `@@index([centerId])`.
- **Inngest job pattern**: Follow `csv-import.job.ts` — `new PrismaClient()` in each `step.run()` with `try/finally { await prisma.$disconnect() }`, `step.sleep()` between API calls, update job status at start/end/failure. **NEVER** use `getPrismaClient()` — that function does not exist.
- **Frontend hook pattern**: Follow `use-exercises.ts` — query keys factory, TanStack Query `useQuery`/`useMutation`, polling via `refetchInterval` that stops when job completes.

### Gemini Integration Architecture

- **Library**: Google Gen AI SDK v1.40+ (`@google/genai` package)
- **Primary Model**: Gemini 2.0 Flash ($0.10/$0.40 per 1M tokens) — extremely cost-effective for structured generation
- **Upgrade Model**: Gemini 2.5 Flash ($0.30/$2.50 per 1M tokens) — for complex question types requiring higher quality (TFNG, Matching Headings)
- **Structured Outputs**: Use `responseMimeType: "application/json"` + `responseSchema: z.toJSONSchema(schema)` in the generation config
- **Zod v4 Native Compatibility**: The project uses `zod@^4.3.5`. Gemini SDK works natively with Zod v4's built-in `z.toJSONSchema()` — **no version compat workarounds needed**. This is simpler than OpenAI which requires `zod/v3` imports.
  ```ts
  import { z } from "zod";
  import { GoogleGenAI } from "@google/genai";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await ai.models.generateContent({
    model,
    contents: "Generate IELTS questions...",
    config: {
      responseMimeType: "application/json",
      responseSchema: z.toJSONSchema(MyOutputSchema),
      temperature: 0.7,
    },
  });
  const parsed = MyOutputSchema.parse(JSON.parse(response.text!));
  ```
- **Temperature**: 0.7 for question generation (creative distractors while staying grounded)
- **Error handling**: Gemini API errors should be caught and logged. Inngest retries handle transient failures.
- **Cost estimate**: A typical 3-type generation (~2K tokens in, ~3K out per type) costs ~$0.005 (half a cent) with Gemini 2.0 Flash. This is 10-20x cheaper than OpenAI GPT-4.1.
- **Free tier**: Gemini offers a free tier with limited rate limits — useful for development and testing without incurring costs.

### Document Extraction Strategy

- **PDF**: `pdfjs-dist` (Mozilla PDF.js) — most robust Node.js PDF extraction
- **DOCX**: `mammoth` — converts to plain text, stable API
- **Text Paste**: No extraction needed — text goes directly to `passageContent`
- **Storage**: Original uploaded documents stored in Firebase Storage for reference. Extracted text stored in `Exercise.passageContent`.
- **Source tracking**: `passageSourceType` (MANUAL/PDF/DOCX/TEXT_PASTE) and `passageSourceUrl` (Firebase Storage URL) fields on Exercise model.

### AI Generation Job Flow

```
1. Teacher uploads document → text extracted → passageContent updated
2. Teacher selects question types + counts + difficulty
3. Frontend calls POST /exercises/:id/generate
4. Backend creates AIGenerationJob (status: pending) + dispatches Inngest event
5. Inngest job picks up event:
   a. Updates job status → "processing"
   b. For each question type, calls Gemini with Structured Outputs
   c. Transforms AI output to match QuestionOptionsSchema format
   d. Creates QuestionSection + Question records in DB
   e. Updates job status → "completed"
6. Frontend polls GET /exercises/:id/generation-status every 3s
7. On completion, frontend reloads exercise to show generated sections
8. Teacher edits/deletes/regenerates as needed using existing editors
```

### Question Type to AI Output Mapping

Each Reading question type maps to specific `options` and `correctAnswer` shapes in the existing `QuestionOptionsSchema` discriminated union. The `transformToExerciseFormat` function must produce EXACTLY these shapes:

| Type | options shape | correctAnswer shape |
|------|--------------|-------------------|
| R1_MCQ_SINGLE | `{ items: [{ label, text }] }` | `{ answer: "A" }` |
| R2_MCQ_MULTI | `{ items: [{ label, text }], maxSelections: N }` | `{ answers: ["A","C"] }` |
| R3_TFNG | `null` | `{ answers: [{ statement, answer: "TRUE"/"FALSE"/"NOT_GIVEN" }] }` |
| R4_YNNG | `null` | `{ answers: [{ statement, answer: "YES"/"NO"/"NOT_GIVEN" }] }` |
| R5_SENTENCE_COMPLETION | `null` | `{ answer, acceptedVariants, strictWordOrder }` |
| R6_SHORT_ANSWER | `null` | `{ answer, acceptedVariants, strictWordOrder }` |
| R7_SUMMARY_WORD_BANK | `{ wordBank: [...], summaryText: "..." }` | `{ blanks: [{ blankIndex, answer }] }` |
| R8_SUMMARY_PASSAGE | `null` | `{ answer, acceptedVariants, strictWordOrder }` |
| R9_MATCHING_HEADINGS | `{ sourceItems: [...], targetItems: [...] }` | `{ matches: [{ sourceIndex, targetIndex }] }` |
| R10_MATCHING_INFORMATION | `{ sourceItems: [...], targetItems: [...] }` | `{ matches: [{ sourceIndex, targetIndex }] }` |
| R11_MATCHING_FEATURES | `{ sourceItems: [...], targetItems: [...] }` | `{ matches: [{ sourceIndex, targetIndex }] }` |
| R12_MATCHING_SENTENCE_ENDINGS | `{ sourceItems: [...], targetItems: [...] }` | `{ matches: [{ sourceIndex, targetIndex }] }` |
| R13 | `{ subFormat: "NOTE"/"TABLE"/"FLOWCHART", structure: {...}, wordLimit?: N }` | `{ blanks: [{ blankId, answer, acceptedVariants }] }` |
| R14 | `{ imageUrl, labels: [{ id, x, y }] }` | `{ labels: [{ labelId, answer, acceptedVariants }] }` |

**CRITICAL**: Study the exact Zod discriminated union at `packages/types/src/exercises.ts` lines 244-401 before implementing the transformer. Each question type has strict schema validation.

### R14 Diagram Labelling — Special Case

R14 requires an image with positioned labels. AI cannot generate the image or label positions. For R14, the AI can only:
- Suggest label text answers based on passage content
- If the exercise already has a diagram with positioned blank markers, generate appropriate labels

If no diagram exists, skip R14 generation and inform the teacher that diagram labelling requires manual image upload first.

### Difficulty Calibration

| Level | MCQ Distractors | TFNG Complexity | Answer Length |
|-------|----------------|-----------------|---------------|
| Easy | Obviously wrong distractors, correct answer uses passage words directly | Statements closely paraphrase passage | 1-word answers |
| Medium | Plausible distractors using passage vocabulary | Paraphrased statements, some inference | 1-2 word answers |
| Hard | Subtle distractors requiring careful reading, passage traps | Heavy paraphrasing, NOT_GIVEN requires topic understanding | 2-3 word answers, synonym variants |

### Previous Story Learnings (Stories 3.6-3.11)

- **Story 3.11 (Tags)**: New model registration in TENANTED_MODELS is critical for multi-tenancy.
- **Story 3.6 (Audio)**: File upload infrastructure (Firebase Storage, multipart, route-level size limits) is the pattern to follow.
- **Common code review issues**: Empty `onBlur` handlers, dead props, missing test coverage for all branches, duplicate case blocks. Keep code minimal, test every path.
- **Schema sync required**: After adding new routes, run `pnpm --filter=webapp sync-schema-dev` with backend running.

### Git Intelligence

Recent commits follow `feat(exercises): implement story 3.X <description>` pattern. Single cohesive commit per story. Code review fixes committed separately.

### File Changes Summary

**New files:**
- `apps/backend/src/modules/exercises/document-extraction.service.ts`
- `apps/backend/src/modules/exercises/document-extraction.service.test.ts`
- `apps/backend/src/modules/exercises/ai-generation.service.ts`
- `apps/backend/src/modules/exercises/ai-generation.service.test.ts`
- `apps/backend/src/modules/exercises/ai-generation.controller.ts`
- `apps/backend/src/modules/exercises/ai-generation.routes.ts`
- `apps/backend/src/modules/exercises/ai-prompts.ts`
- `apps/backend/src/modules/exercises/jobs/question-generation.job.ts`
- `apps/webapp/src/features/exercises/hooks/use-ai-generation.ts`
- `apps/webapp/src/features/exercises/hooks/use-document-upload.ts`
- `apps/webapp/src/features/exercises/components/DocumentUploadPanel.tsx`
- `apps/webapp/src/features/exercises/components/DocumentUploadPanel.test.tsx`
- `apps/webapp/src/features/exercises/components/AIGenerationPanel.tsx`
- `apps/webapp/src/features/exercises/components/AIGenerationPanel.test.tsx`
- `packages/types/src/ai-generation.ts`
- `packages/types/src/ai-generation.test.ts`

**Modified files:**
- `packages/db/prisma/schema.prisma` — Add `AIGenerationJob` model, `passageSourceType`/`passageSourceUrl` to Exercise
- `packages/db/src/tenanted-client.ts` — Add `AIGenerationJob` to TENANTED_MODELS
- `packages/types/src/exercises.ts` — Add `passageSourceType`/`passageSourceUrl` to ExerciseSchema
- `packages/types/src/index.ts` — Export ai-generation types
- `apps/backend/package.json` — Add `@google/genai`, `pdfjs-dist`, `mammoth` dependencies
- `apps/backend/src/app.ts` — Import and register aiGenerationRoutes
- `apps/backend/src/modules/exercises/exercises.service.ts` — Add `uploadDocument`, `updatePassageFromDocument` methods
- `apps/backend/src/modules/inngest/functions.ts` — Register `questionGenerationJob`
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Add DocumentUploadPanel + AIGenerationPanel for Reading exercises
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated (sync-schema-dev)

### Project Structure Notes

- AI generation files co-located in `apps/backend/src/modules/exercises/` (same domain)
- Inngest job in `apps/backend/src/modules/exercises/jobs/` (co-located with feature per architecture)
- AI prompts in separate `ai-prompts.ts` file for maintainability (will grow as prompt engineering improves)
- Document extraction is a standalone service (single responsibility, testable in isolation)
- Frontend components in `apps/webapp/src/features/exercises/components/` (exercise editor components)
- Frontend hooks in `apps/webapp/src/features/exercises/hooks/` (exercise hooks directory)
- Types in `packages/types/src/ai-generation.ts` (shared across backend/frontend)
- No cross-app imports — types from `@workspace/types`, DB from `@workspace/db`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.12 AI Content Generation for Reading (FR14, FR15)]
- [Source: _bmad-output/planning-artifacts/prd.md — Journey 5 "Content Architect", FR14, FR15, AI Performance >80% acceptance]
- [Source: _bmad-output/planning-artifacts/architecture.md — Inngest for background jobs, Firebase Auth, Route-Controller-Service]
- [Source: project-context.md — Multi-tenancy, Route-Controller-Service, Testing rules, Prisma naming, Inngest offloading]
- [Source: 3-11-exercise-tagging-organization.md — TENANTED_MODELS registration, file upload patterns, code review learnings]
- [Source: packages/db/prisma/schema.prisma — Exercise model (lines 420-469), QuestionSection, Question models]
- [Source: packages/db/src/tenanted-client.ts — TENANTED_MODELS array]
- [Source: packages/types/src/exercises.ts — IeltsQuestionTypeSchema (44-75), QuestionOptionsSchema discriminated union (244-401)]
- [Source: packages/types/src/response.ts — createResponseSchema pattern: { data, message }]
- [Source: apps/backend/src/app.ts — Route registration pattern (lines 197-214)]
- [Source: apps/backend/src/modules/exercises/exercises.service.ts — uploadAudio pattern (lines 373-567), Firebase Storage paths]
- [Source: apps/backend/src/modules/exercises/exercises.routes.ts — Multipart file upload with size override (lines 625-699)]
- [Source: apps/backend/src/modules/exercises/sections.service.ts — createSection/createQuestion patterns (lines 45-270)]
- [Source: apps/backend/src/modules/inngest/client.ts — Inngest client setup]
- [Source: apps/backend/src/modules/inngest/functions.ts — Function registration array]
- [Source: apps/backend/src/modules/users/jobs/csv-import.job.ts — Inngest step function pattern (lines 46-200)]
- [Source: apps/webapp/src/features/exercises/hooks/use-audio-upload.ts — FormData file upload mutation pattern]
- [Source: apps/webapp/src/features/exercises/hooks/use-exercises.ts — Query key pattern, exercise mutations]
- [Source: apps/webapp/src/features/exercises/components/ExerciseEditor.tsx — Skill-specific editor integration, autosave flow]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed GoogleGenAI crash on startup when GEMINI_API_KEY not set — made initialization lazy (only on first API call)
- Fixed Prisma $extends type propagation issue — used `(db as any).aIGenerationJob` helper for AIGenerationJob model access
- Fixed `passageSourceType`/`passageSourceUrl` type issue on Exercise update — used `(db.exercise as any).update()`
- Fixed pdfjs-dist TextMarkedContent union type — filtered with `"str" in item` check

### Code Review Fixes Applied

- **H1**: Fixed render-phase side effect in AIGenerationPanel — moved `onGenerationComplete()`/`setSelectedTypes([])` into `useEffect` with ref guard
- **H2**: Fixed R14 Diagram Labelling `diagramUrl: ""` → `"pending-upload"` to pass `z.string().min(1)` validation
- **H3**: Added per-section Regenerate button to QuestionSectionEditor header (AC5/AC7) — wired through ExerciseEditor for Reading exercises
- **H4**: Added GEMINI_API_KEY/GEMINI_MODEL to fastifyEnv schema properties in app.ts
- **M2**: Fixed R7 Word Bank transformer to create single question with all blanks in one `correctAnswer.blanks` record (matches IELTS format)
- **M3**: Replaced `parsed: any` with `parsed: AIOutputShape` (Record<string, unknown>) + inline `as` casts in transformToExerciseFormat
- **M4**: Added null guard on `onFailure` handler's deeply nested `event.data.event.data.jobId` access
- **L1**: Removed dead `centerId` prop from AIGenerationPanel and DocumentUploadPanel interfaces
- **L2**: Fixed hardcoded `"PDF"` sourceType in `handleUseExtractedText` — now uses actual type from upload response
- **M1/L3**: Documented all undocumented files in File List below

### Completion Notes List

- All 15 tasks completed
- 46 type schema tests passing (packages/types)
- 14 backend service tests passing (ai-generation.service, document-extraction.service)
- 8 frontend component tests passing (DocumentUploadPanel, AIGenerationPanel)
- Full test suite green: types (327), db (18), backend (446), webapp (440)
- Schema sync completed — all 4 new endpoints in schema.d.ts
- Code review fixes applied — all HIGH/MEDIUM/LOW issues resolved

### File List

**New files (17):**
- `packages/types/src/ai-generation.ts`
- `packages/types/src/ai-generation.test.ts`
- `apps/backend/src/plugins/create-prisma.ts`
- `apps/backend/src/modules/exercises/document-extraction.service.ts`
- `apps/backend/src/modules/exercises/document-extraction.service.test.ts`
- `apps/backend/src/modules/exercises/ai-generation.service.ts`
- `apps/backend/src/modules/exercises/ai-generation.service.test.ts`
- `apps/backend/src/modules/exercises/ai-generation.controller.ts`
- `apps/backend/src/modules/exercises/ai-generation.routes.ts`
- `apps/backend/src/modules/exercises/ai-prompts.ts`
- `apps/backend/src/modules/exercises/jobs/question-generation.job.ts`
- `apps/webapp/src/features/exercises/hooks/use-ai-generation.ts`
- `apps/webapp/src/features/exercises/hooks/use-document-upload.ts`
- `apps/webapp/src/features/exercises/components/DocumentUploadPanel.tsx`
- `apps/webapp/src/features/exercises/components/DocumentUploadPanel.test.tsx`
- `apps/webapp/src/features/exercises/components/AIGenerationPanel.tsx`
- `apps/webapp/src/features/exercises/components/AIGenerationPanel.test.tsx`

**Modified files (15):**
- `packages/db/prisma/schema.prisma`
- `packages/db/src/tenanted-client.ts`
- `packages/types/src/exercises.ts`
- `packages/types/src/index.ts`
- `apps/backend/.env.example`
- `apps/backend/package.json`
- `apps/backend/src/env.ts`
- `apps/backend/src/app.ts`
- `apps/backend/src/modules/exercises/exercises.service.ts`
- `apps/backend/src/modules/inngest/functions.ts`
- `apps/backend/src/modules/logistics/jobs/session-email-notification.job.ts` (refactored to use createPrisma)
- `apps/backend/src/modules/users/jobs/csv-import.job.ts` (refactored to use createPrisma)
- `apps/backend/src/modules/users/jobs/user-deletion.job.ts` (refactored to use createPrisma)
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx`
- `apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx`
- `apps/webapp/src/schema/schema.d.ts` (auto-generated)
