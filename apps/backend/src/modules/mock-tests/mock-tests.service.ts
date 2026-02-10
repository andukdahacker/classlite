import type { PrismaClient } from "@workspace/db";
import { getTenantedClient } from "@workspace/db";
import type { CreateMockTest, UpdateMockTest } from "@workspace/types";
import { AppError } from "../../errors/app-error.js";

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
              id: true,
              title: true,
              skill: true,
              status: true,
              bandLevel: true,
              sections: {
                select: {
                  id: true,
                  sectionType: true,
                  questions: { select: { id: true } },
                },
              },
            },
          },
        },
      },
    },
  },
};

const DEFAULT_SECTIONS = [
  { skill: "LISTENING", orderIndex: 0, timeLimit: 1800 },
  { skill: "READING", orderIndex: 1, timeLimit: 3600 },
  { skill: "WRITING", orderIndex: 2, timeLimit: 3600 },
  { skill: "SPEAKING", orderIndex: 3, timeLimit: 900 },
];

export class MockTestsService {
  constructor(private readonly prisma: PrismaClient) {}

  private async verifyDraftMockTest(
    db: ReturnType<typeof getTenantedClient>,
    id: string,
    errorMessage: string,
  ) {
    const mockTest = await db.mockTest.findUnique({ where: { id } });
    if (!mockTest) {
      throw AppError.notFound("Mock test not found");
    }
    if (mockTest.status !== "DRAFT") {
      throw AppError.badRequest(errorMessage);
    }
    return mockTest;
  }

  async listMockTests(
    centerId: string,
    filters?: { status?: string; testType?: string },
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.testType) where.testType = filters.testType;

    return await db.mockTest.findMany({
      where,
      include: MOCK_TEST_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
  }

  async getMockTest(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const mockTest = await db.mockTest.findUnique({
      where: { id },
      include: MOCK_TEST_INCLUDE,
    });

    if (!mockTest) {
      throw AppError.notFound("Mock test not found");
    }

    return mockTest;
  }

  async createMockTest(
    centerId: string,
    input: CreateMockTest,
    firebaseUid: string,
  ) {
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

    return await db.mockTest.create({
      data: {
        centerId,
        title: input.title,
        description: input.description ?? null,
        testType: input.testType,
        createdById: authAccount.userId,
        sections: {
          create: DEFAULT_SECTIONS.map((s) => ({
            centerId,
            skill: s.skill,
            orderIndex: s.orderIndex,
            timeLimit: s.timeLimit,
          })),
        },
      },
      include: MOCK_TEST_INCLUDE,
    });
  }

  async updateMockTest(
    centerId: string,
    id: string,
    input: UpdateMockTest,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftMockTest(
      db,
      id,
      "Only draft mock tests can be updated",
    );

    return await db.mockTest.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.testType !== undefined && { testType: input.testType }),
      },
      include: MOCK_TEST_INCLUDE,
    });
  }

  async deleteMockTest(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftMockTest(
      db,
      id,
      "Only draft mock tests can be deleted",
    );

    await db.mockTest.delete({ where: { id } });
  }

  async publishMockTest(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const mockTest = await db.mockTest.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            exercises: {
              include: {
                exercise: { select: { id: true, status: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!mockTest) {
      throw AppError.notFound("Mock test not found");
    }
    if (mockTest.status !== "DRAFT") {
      throw AppError.badRequest("Only draft mock tests can be published");
    }

    // Validate all sections have at least 1 exercise
    const emptySections = mockTest.sections.filter(
      (s) => s.exercises.length === 0,
    );
    if (emptySections.length > 0) {
      const names = emptySections.map((s) => s.skill).join(", ");
      throw AppError.badRequest(
        `Cannot publish: ${names} section(s) have no exercises`,
      );
    }

    // Validate all referenced exercises are still PUBLISHED
    const unpublished: string[] = [];
    for (const section of mockTest.sections) {
      for (const se of section.exercises) {
        if (se.exercise.status !== "PUBLISHED") {
          unpublished.push(
            `${se.exercise.title} (${section.skill})`,
          );
        }
      }
    }
    if (unpublished.length > 0) {
      throw AppError.badRequest(
        `Cannot publish: exercises no longer published: ${unpublished.join(", ")}`,
      );
    }

    return await db.mockTest.update({
      where: { id },
      data: { status: "PUBLISHED" },
      include: MOCK_TEST_INCLUDE,
    });
  }

  async archiveMockTest(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const mockTest = await db.mockTest.findUnique({ where: { id } });
    if (!mockTest) {
      throw AppError.notFound("Mock test not found");
    }
    if (mockTest.status === "ARCHIVED") {
      throw AppError.badRequest("Mock test is already archived");
    }

    return await db.mockTest.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: MOCK_TEST_INCLUDE,
    });
  }

  async updateSection(
    centerId: string,
    mockTestId: string,
    sectionId: string,
    input: { timeLimit?: number | null },
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftMockTest(
      db,
      mockTestId,
      "Only draft mock tests can have sections updated",
    );

    const section = await db.mockTestSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.mockTestId !== mockTestId) {
      throw AppError.notFound("Section not found");
    }

    return await db.mockTestSection.update({
      where: { id: sectionId },
      data: {
        ...(input.timeLimit !== undefined && { timeLimit: input.timeLimit }),
      },
    });
  }

  async addExerciseToSection(
    centerId: string,
    mockTestId: string,
    sectionId: string,
    exerciseId: string,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftMockTest(
      db,
      mockTestId,
      "Only draft mock tests can have exercises added",
    );

    const section = await db.mockTestSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.mockTestId !== mockTestId) {
      throw AppError.notFound("Section not found");
    }

    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "PUBLISHED") {
      throw AppError.badRequest("Only published exercises can be added to mock tests");
    }
    if (exercise.skill !== section.skill) {
      throw AppError.badRequest(
        `Exercise skill (${exercise.skill}) does not match section skill (${section.skill})`,
      );
    }

    // Check for duplicate
    const existing = await db.mockTestSectionExercise.findFirst({
      where: { sectionId, exerciseId },
    });
    if (existing) {
      throw AppError.badRequest("Exercise already in this section");
    }

    // Calculate next orderIndex
    const lastExercise = await db.mockTestSectionExercise.findFirst({
      where: { sectionId },
      orderBy: { orderIndex: "desc" },
    });
    const nextIndex = lastExercise ? lastExercise.orderIndex + 1 : 0;

    return await db.mockTestSectionExercise.create({
      data: {
        centerId,
        sectionId,
        exerciseId,
        orderIndex: nextIndex,
      },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            skill: true,
            status: true,
            bandLevel: true,
            sections: {
              select: {
                id: true,
                sectionType: true,
                questions: { select: { id: true } },
              },
            },
          },
        },
      },
    });
  }

  async removeExerciseFromSection(
    centerId: string,
    mockTestId: string,
    sectionId: string,
    exerciseId: string,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftMockTest(
      db,
      mockTestId,
      "Only draft mock tests can have exercises removed",
    );

    const junction = await db.mockTestSectionExercise.findFirst({
      where: { sectionId, exerciseId },
    });
    if (!junction) {
      throw AppError.notFound("Exercise not found in this section");
    }

    await db.mockTestSectionExercise.delete({ where: { id: junction.id } });

    // Reindex remaining exercises
    const remaining = await db.mockTestSectionExercise.findMany({
      where: { sectionId },
      orderBy: { orderIndex: "asc" },
    });
    if (remaining.length > 0) {
      await db.$transaction(
        remaining.map((item, idx) =>
          db.mockTestSectionExercise.update({
            where: { id: item.id },
            data: { orderIndex: idx },
          }),
        ),
      );
    }
  }

  async reorderSectionExercises(
    centerId: string,
    mockTestId: string,
    sectionId: string,
    exerciseIds: string[],
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftMockTest(
      db,
      mockTestId,
      "Only draft mock tests can have exercises reordered",
    );

    const existing = await db.mockTestSectionExercise.findMany({
      where: { sectionId },
      select: { id: true, exerciseId: true },
    });
    const existingExerciseIds = new Set(existing.map((e) => e.exerciseId));

    for (const eid of exerciseIds) {
      if (!existingExerciseIds.has(eid)) {
        throw AppError.badRequest(
          `Exercise ${eid} does not belong to this section`,
        );
      }
    }
    if (exerciseIds.length !== existing.length) {
      throw AppError.badRequest(
        "exerciseIds must include all exercises in the section",
      );
    }

    const idMap = new Map(existing.map((e) => [e.exerciseId, e.id]));

    await db.$transaction(
      exerciseIds.map((eid, idx) =>
        db.mockTestSectionExercise.update({
          where: { id: idMap.get(eid)! },
          data: { orderIndex: idx },
        }),
      ),
    );
  }

  async getScorePreview(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const mockTest = await db.mockTest.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercises: {
              include: {
                exercise: {
                  select: {
                    sections: {
                      select: {
                        questions: { select: { id: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mockTest) {
      throw AppError.notFound("Mock test not found");
    }

    const result: Record<
      string,
      { questionCount: number; maxRawScore?: number; criteria?: string[] }
    > = {};

    for (const section of mockTest.sections) {
      let questionCount = 0;
      for (const se of section.exercises) {
        for (const qs of se.exercise.sections) {
          questionCount += qs.questions.length;
        }
      }

      if (section.skill === "LISTENING" || section.skill === "READING") {
        result[section.skill.toLowerCase()] = {
          questionCount,
          maxRawScore: 40,
        };
      } else if (section.skill === "WRITING") {
        result.writing = {
          questionCount,
          criteria: [
            "Task Achievement",
            "Coherence & Cohesion",
            "Lexical Resource",
            "Grammatical Range & Accuracy",
          ],
        };
      } else if (section.skill === "SPEAKING") {
        result.speaking = {
          questionCount,
          criteria: [
            "Fluency & Coherence",
            "Lexical Resource",
            "Grammatical Range & Accuracy",
            "Pronunciation",
          ],
        };
      }
    }

    return {
      testType: mockTest.testType,
      ...result,
    };
  }
}
