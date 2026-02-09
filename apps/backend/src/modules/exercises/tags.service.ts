import { PrismaClient, getTenantedClient } from "@workspace/db";
import type {
  CreateExerciseTagInput,
  UpdateExerciseTagInput,
  MergeExerciseTagsInput,
  ExerciseTag,
} from "@workspace/types";
import { AppError } from "../../errors/app-error.js";

export class TagsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listTags(centerId: string): Promise<ExerciseTag[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return db.exerciseTag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { tagAssignments: true } } },
    });
  }

  async createTag(
    centerId: string,
    input: CreateExerciseTagInput,
  ): Promise<ExerciseTag> {
    const db = getTenantedClient(this.prisma, centerId);
    try {
      return await db.exerciseTag.create({
        data: { name: input.name, centerId },
        include: { _count: { select: { tagAssignments: true } } },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw AppError.conflict("Tag with this name already exists");
      }
      throw error;
    }
  }

  async updateTag(
    centerId: string,
    tagId: string,
    input: UpdateExerciseTagInput,
  ): Promise<ExerciseTag> {
    const db = getTenantedClient(this.prisma, centerId);

    const existing = await db.exerciseTag.findUnique({ where: { id: tagId } });
    if (!existing) {
      throw AppError.notFound("Tag not found");
    }

    try {
      return await db.exerciseTag.update({
        where: { id: tagId },
        data: { name: input.name },
        include: { _count: { select: { tagAssignments: true } } },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw AppError.conflict("Tag with this name already exists");
      }
      throw error;
    }
  }

  async deleteTag(centerId: string, tagId: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    const existing = await db.exerciseTag.findUnique({ where: { id: tagId } });
    if (!existing) {
      throw AppError.notFound("Tag not found");
    }

    await db.exerciseTag.delete({ where: { id: tagId } });
  }

  async mergeTags(
    centerId: string,
    input: MergeExerciseTagsInput,
  ): Promise<ExerciseTag> {
    if (input.sourceTagId === input.targetTagId) {
      throw AppError.badRequest("Cannot merge a tag into itself");
    }

    return await this.prisma.$transaction(async (tx) => {
      const txDb = getTenantedClient(tx as PrismaClient, centerId);

      const sourceTag = await txDb.exerciseTag.findUnique({
        where: { id: input.sourceTagId },
      });
      if (!sourceTag) {
        throw AppError.notFound("Source tag not found");
      }

      const targetTag = await txDb.exerciseTag.findUnique({
        where: { id: input.targetTagId },
      });
      if (!targetTag) {
        throw AppError.notFound("Target tag not found");
      }

      // Find exercises that already have the target tag
      const targetAssignments = await txDb.exerciseTagAssignment.findMany({
        where: { tagId: input.targetTagId },
        select: { exerciseId: true },
      });
      const exercisesWithTarget = new Set(
        targetAssignments.map((a) => a.exerciseId),
      );

      // Get all source assignments
      const sourceAssignments = await txDb.exerciseTagAssignment.findMany({
        where: { tagId: input.sourceTagId },
      });

      // Delete source assignments for exercises that already have the target tag (duplicates)
      const duplicateIds = sourceAssignments
        .filter((a) => exercisesWithTarget.has(a.exerciseId))
        .map((a) => a.id);

      if (duplicateIds.length > 0) {
        await txDb.exerciseTagAssignment.deleteMany({
          where: { id: { in: duplicateIds } },
        });
      }

      // Update remaining source assignments to point to target
      await txDb.exerciseTagAssignment.updateMany({
        where: { tagId: input.sourceTagId },
        data: { tagId: input.targetTagId },
      });

      // Delete the source tag
      await txDb.exerciseTag.delete({ where: { id: input.sourceTagId } });

      // Return the target tag with updated count
      return await txDb.exerciseTag.findUniqueOrThrow({
        where: { id: input.targetTagId },
        include: { _count: { select: { tagAssignments: true } } },
      });
    });
  }

  async setExerciseTags(
    centerId: string,
    exerciseId: string,
    tagIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const txDb = getTenantedClient(tx as PrismaClient, centerId);

      // Delete all existing assignments for this exercise
      await txDb.exerciseTagAssignment.deleteMany({
        where: { exerciseId },
      });

      // Create new assignments
      if (tagIds.length > 0) {
        await txDb.exerciseTagAssignment.createMany({
          data: tagIds.map((tagId) => ({
            exerciseId,
            tagId,
            centerId,
          })),
        });
      }
    });
  }

  async getExerciseTags(
    centerId: string,
    exerciseId: string,
  ): Promise<ExerciseTag[]> {
    const db = getTenantedClient(this.prisma, centerId);

    const assignments = await db.exerciseTagAssignment.findMany({
      where: { exerciseId },
      include: {
        tag: {
          include: { _count: { select: { tagAssignments: true } } },
        },
      },
    });

    return assignments.map((a) => a.tag);
  }
}
