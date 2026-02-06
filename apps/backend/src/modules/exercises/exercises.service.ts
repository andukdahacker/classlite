import { PrismaClient, getTenantedClient } from "@workspace/db";
import type {
  CreateExerciseInput,
  UpdateExerciseInput,
  AutosaveExerciseInput,
  Exercise,
} from "@workspace/types";
import { AppError } from "../../errors/app-error.js";

const EXERCISE_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
  sections: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      questions: { orderBy: { orderIndex: "asc" as const } },
    },
  },
};

export class ExercisesService {
  constructor(private readonly prisma: PrismaClient) {}

  private async verifyDraftExercise(
    db: ReturnType<typeof getTenantedClient>,
    id: string,
    errorMessage: string,
  ) {
    const exercise = await db.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "DRAFT") {
      throw AppError.badRequest(errorMessage);
    }
    return exercise;
  }

  async listExercises(
    centerId: string,
    filters?: { skill?: string; status?: string },
  ): Promise<Exercise[]> {
    const db = getTenantedClient(this.prisma, centerId);

    const where: Record<string, unknown> = {};
    if (filters?.skill) where.skill = filters.skill;
    if (filters?.status) where.status = filters.status;

    return await db.exercise.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getExercise(centerId: string, id: string): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({
      where: { id },
      include: EXERCISE_INCLUDE,
    });

    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }

    return exercise;
  }

  async createExercise(
    centerId: string,
    input: CreateExerciseInput,
    firebaseUid: string,
  ): Promise<Exercise> {
    // Resolve Firebase UID to Prisma User ID via AuthAccount
    const authAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "FIREBASE",
          providerUserId: firebaseUid,
        },
      },
    });
    if (!authAccount) {
      throw AppError.notFound("User account not found");
    }

    const db = getTenantedClient(this.prisma, centerId);

    return await db.exercise.create({
      data: {
        centerId,
        title: input.title,
        instructions: input.instructions ?? null,
        skill: input.skill,
        passageContent: input.passageContent ?? null,
        passageFormat: input.passageFormat ?? null,
        createdById: authAccount.userId,
      },
      include: EXERCISE_INCLUDE,
    });
  }

  private async updateDraftExercise(
    centerId: string,
    id: string,
    input: UpdateExerciseInput | AutosaveExerciseInput,
    errorMessage: string,
  ): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(db, id, errorMessage);

    return await db.exercise.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.instructions !== undefined && {
          instructions: input.instructions,
        }),
        ...(input.passageContent !== undefined && {
          passageContent: input.passageContent,
        }),
        ...(input.passageFormat !== undefined && {
          passageFormat: input.passageFormat,
        }),
      },
      include: EXERCISE_INCLUDE,
    });
  }

  async updateExercise(
    centerId: string,
    id: string,
    input: UpdateExerciseInput,
  ): Promise<Exercise> {
    return this.updateDraftExercise(
      centerId,
      id,
      input,
      "Only draft exercises can be fully edited",
    );
  }

  async autosaveExercise(
    centerId: string,
    id: string,
    input: AutosaveExerciseInput,
  ): Promise<Exercise> {
    return this.updateDraftExercise(
      centerId,
      id,
      input,
      "Only draft exercises can be auto-saved",
    );
  }

  async deleteExercise(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(
      db,
      id,
      "Only draft exercises can be deleted",
    );

    await db.exercise.delete({ where: { id } });
  }

  async publishExercise(centerId: string, id: string): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(
      db,
      id,
      "Only draft exercises can be published",
    );

    return await db.exercise.update({
      where: { id },
      data: { status: "PUBLISHED" },
      include: EXERCISE_INCLUDE,
    });
  }

  async archiveExercise(centerId: string, id: string): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status === "ARCHIVED") {
      throw AppError.badRequest("Exercise is already archived");
    }

    return await db.exercise.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: EXERCISE_INCLUDE,
    });
  }
}
