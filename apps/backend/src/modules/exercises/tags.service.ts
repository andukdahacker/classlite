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
      // Use tx directly with explicit centerId instead of getTenantedClient —
      // Prisma 7 transaction clients do not support $extends.
      const sourceTag = await tx.exerciseTag.findFirst({
        where: { id: input.sourceTagId, centerId },
      });
      if (!sourceTag) {
        throw AppError.notFound("Source tag not found");
      }

      const targetTag = await tx.exerciseTag.findFirst({
        where: { id: input.targetTagId, centerId },
      });
      if (!targetTag) {
        throw AppError.notFound("Target tag not found");
      }

      // Find exercises that already have the target tag
      const targetAssignments = await tx.exerciseTagAssignment.findMany({
        where: { tagId: input.targetTagId, centerId },
        select: { exerciseId: true },
      });
      const exercisesWithTarget = new Set(
        targetAssignments.map((a) => a.exerciseId),
      );

      // Get all source assignments
      const sourceAssignments = await tx.exerciseTagAssignment.findMany({
        where: { tagId: input.sourceTagId, centerId },
      });

      // Delete source assignments for exercises that already have the target tag (duplicates)
      const duplicateIds = sourceAssignments
        .filter((a) => exercisesWithTarget.has(a.exerciseId))
        .map((a) => a.id);

      if (duplicateIds.length > 0) {
        await tx.exerciseTagAssignment.deleteMany({
          where: { id: { in: duplicateIds }, centerId },
        });
      }

      // Update remaining source assignments to point to target
      await tx.exerciseTagAssignment.updateMany({
        where: { tagId: input.sourceTagId, centerId },
        data: { tagId: input.targetTagId },
      });

      // Delete the source tag
      await tx.exerciseTag.delete({ where: { id: input.sourceTagId } });

      // Return the target tag with updated count
      const merged = await tx.exerciseTag.findFirst({
        where: { id: input.targetTagId, centerId },
        include: { _count: { select: { tagAssignments: true } } },
      });
      if (!merged) throw new Error("Target tag not found after merge");
      return merged;
    });
  }

  async setExerciseTags(
    centerId: string,
    exerciseId: string,
    tagIds: string[],
  ): Promise<void> {
    // Use tx directly with explicit centerId instead of getTenantedClient —
    // Prisma 7 transaction clients do not support $extends.
    await this.prisma.$transaction(async (tx) => {
      // Delete all existing assignments for this exercise within the center
      await tx.exerciseTagAssignment.deleteMany({
        where: { exerciseId, centerId },
      });

      // Create new assignments
      if (tagIds.length > 0) {
        await tx.exerciseTagAssignment.createMany({
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
