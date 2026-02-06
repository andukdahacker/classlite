import { Prisma, PrismaClient, getTenantedClient } from "@workspace/db";
import type {
  CreateQuestionSectionInput,
  UpdateQuestionSectionInput,
  QuestionSection,
  CreateQuestionInput,
  UpdateQuestionInput,
  Question,
} from "@workspace/types";
import { AppError } from "../../errors/app-error.js";

// Prisma requires DbNull instead of null for optional Json fields
function toJsonValue(val: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return val === null || val === undefined ? Prisma.DbNull : val as Prisma.InputJsonValue;
}

export class SectionsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listSections(
    centerId: string,
    exerciseId: string,
  ): Promise<QuestionSection[]> {
    const db = getTenantedClient(this.prisma, centerId);

    // Verify exercise exists and belongs to center
    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }

    return await db.questionSection.findMany({
      where: { exerciseId },
      orderBy: { orderIndex: "asc" },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  async createSection(
    centerId: string,
    exerciseId: string,
    input: CreateQuestionSectionInput,
  ): Promise<QuestionSection> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "DRAFT") {
      throw AppError.badRequest(
        "Sections can only be added to draft exercises",
      );
    }

    return await db.questionSection.create({
      data: {
        exerciseId,
        centerId,
        sectionType: input.sectionType,
        instructions: input.instructions ?? null,
        orderIndex: input.orderIndex,
      },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  async updateSection(
    centerId: string,
    exerciseId: string,
    sectionId: string,
    input: UpdateQuestionSectionInput,
  ): Promise<QuestionSection> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "DRAFT") {
      throw AppError.badRequest(
        "Sections can only be modified on draft exercises",
      );
    }

    const section = await db.questionSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.exerciseId !== exerciseId) {
      throw AppError.notFound("Section not found");
    }

    return await db.questionSection.update({
      where: { id: sectionId },
      data: {
        ...(input.sectionType !== undefined && {
          sectionType: input.sectionType,
        }),
        ...(input.instructions !== undefined && {
          instructions: input.instructions,
        }),
        ...(input.orderIndex !== undefined && {
          orderIndex: input.orderIndex,
        }),
      },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  async deleteSection(
    centerId: string,
    exerciseId: string,
    sectionId: string,
  ): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "DRAFT") {
      throw AppError.badRequest(
        "Sections can only be deleted from draft exercises",
      );
    }

    const section = await db.questionSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.exerciseId !== exerciseId) {
      throw AppError.notFound("Section not found");
    }

    await db.questionSection.delete({ where: { id: sectionId } });
  }

  // --- Question operations ---

  private async verifyDraftExercise(
    db: ReturnType<typeof getTenantedClient>,
    exerciseId: string,
  ) {
    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "DRAFT") {
      throw AppError.badRequest(
        "Questions can only be modified on draft exercises",
      );
    }
    return exercise;
  }

  async createQuestion(
    centerId: string,
    exerciseId: string,
    sectionId: string,
    input: CreateQuestionInput,
  ): Promise<Question> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(db, exerciseId);

    const section = await db.questionSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.exerciseId !== exerciseId) {
      throw AppError.notFound("Section not found");
    }

    return await db.question.create({
      data: {
        sectionId,
        centerId,
        questionText: input.questionText,
        questionType: input.questionType,
        options: toJsonValue(input.options ?? null),
        correctAnswer: toJsonValue(input.correctAnswer ?? null),
        orderIndex: input.orderIndex,
        wordLimit: input.wordLimit ?? null,
      },
    });
  }

  async updateQuestion(
    centerId: string,
    exerciseId: string,
    sectionId: string,
    questionId: string,
    input: UpdateQuestionInput,
  ): Promise<Question> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(db, exerciseId);

    const question = await db.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.sectionId !== sectionId) {
      throw AppError.notFound("Question not found");
    }

    // Verify section belongs to exercise
    const section = await db.questionSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.exerciseId !== exerciseId) {
      throw AppError.notFound("Section not found");
    }

    return await db.question.update({
      where: { id: questionId },
      data: {
        ...(input.questionText !== undefined && { questionText: input.questionText }),
        ...(input.questionType !== undefined && { questionType: input.questionType }),
        ...(input.options !== undefined && { options: toJsonValue(input.options) }),
        ...(input.correctAnswer !== undefined && { correctAnswer: toJsonValue(input.correctAnswer) }),
        ...(input.orderIndex !== undefined && { orderIndex: input.orderIndex }),
        ...(input.wordLimit !== undefined && { wordLimit: input.wordLimit }),
      },
    });
  }

  async deleteQuestion(
    centerId: string,
    exerciseId: string,
    sectionId: string,
    questionId: string,
  ): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(db, exerciseId);

    const question = await db.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.sectionId !== sectionId) {
      throw AppError.notFound("Question not found");
    }

    // Verify section belongs to exercise
    const section = await db.questionSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.exerciseId !== exerciseId) {
      throw AppError.notFound("Section not found");
    }

    await db.question.delete({ where: { id: questionId } });
  }
}
