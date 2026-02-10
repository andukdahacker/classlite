import { PrismaClient, getTenantedClient } from "@workspace/db";
import { AppError } from "../../errors/app-error.js";
import { NotificationsService } from "../notifications/notifications.service.js";

const ASSIGNMENT_INCLUDE = {
  exercise: { select: { id: true, title: true, skill: true, status: true } },
  class: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { studentAssignments: true } },
};

const ASSIGNMENT_DETAIL_INCLUDE = {
  ...ASSIGNMENT_INCLUDE,
  studentAssignments: {
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  },
};

export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listAssignments(
    centerId: string,
    filters?: {
      exerciseId?: string;
      classId?: string;
      status?: "OPEN" | "CLOSED" | "ARCHIVED";
      skill?: string;
      dueDateStart?: string;
      dueDateEnd?: string;
    },
  ) {
    const db = getTenantedClient(this.prisma, centerId);
    const where: Record<string, unknown> = {};
    if (filters?.exerciseId) where.exerciseId = filters.exerciseId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.status) where.status = filters.status;
    if (filters?.skill) where.exercise = { skill: filters.skill };
    if (filters?.dueDateStart || filters?.dueDateEnd) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueDateStart) dueDateFilter.gte = new Date(filters.dueDateStart);
      if (filters.dueDateEnd) dueDateFilter.lte = new Date(filters.dueDateEnd);
      where.dueDate = dueDateFilter;
    }
    return await db.assignment.findMany({
      where,
      include: ASSIGNMENT_INCLUDE,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    });
  }

  async getAssignment(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: ASSIGNMENT_DETAIL_INCLUDE,
    });
    if (!assignment) throw AppError.notFound("Assignment not found");
    return assignment;
  }

  async createAssignment(
    centerId: string,
    input: {
      exerciseId: string;
      classIds?: string[];
      studentIds?: string[];
      dueDate?: string | null;
      timeLimit?: number | null;
      instructions?: string | null;
    },
    firebaseUid: string,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    // Validate at least one target
    const hasClasses = input.classIds && input.classIds.length > 0;
    const hasStudents = input.studentIds && input.studentIds.length > 0;
    if (!hasClasses && !hasStudents) {
      throw AppError.badRequest("At least one class or student must be specified");
    }

    // Resolve Firebase UID → userId
    const authAccount = await db.authAccount.findUniqueOrThrow({
      where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } },
    });

    // Verify exercise exists and is PUBLISHED
    const exercise = await db.exercise.findUnique({ where: { id: input.exerciseId } });
    if (!exercise) throw AppError.notFound("Exercise not found");
    if (exercise.status !== "PUBLISHED") {
      throw AppError.badRequest("Only published exercises can be assigned");
    }

    const assignments = [];

    if (hasClasses) {
      // Class-based: create one assignment per class
      for (const classId of input.classIds!) {
        const cls = await db.class.findUnique({
          where: { id: classId },
          include: { students: { select: { studentId: true } } },
        });
        if (!cls) throw AppError.notFound(`Class ${classId} not found`);

        const assignment = await db.$transaction(async (tx) => {
          const created = await tx.assignment.create({
            data: {
              centerId,
              exerciseId: input.exerciseId,
              classId,
              dueDate: input.dueDate ? new Date(input.dueDate) : null,
              timeLimit: input.timeLimit ?? null,
              instructions: input.instructions ?? null,
              status: "OPEN",
              createdById: authAccount.userId,
            },
          });

          // Snapshot class roster → AssignmentStudent
          if (cls.students.length > 0) {
            await tx.assignmentStudent.createMany({
              data: cls.students.map((s) => ({
                assignmentId: created.id,
                studentId: s.studentId,
                centerId,
              })),
            });
          }

          return await tx.assignment.findUniqueOrThrow({
            where: { id: created.id },
            include: ASSIGNMENT_INCLUDE,
          });
        });

        assignments.push(assignment);

        // Notify students
        const studentIds = cls.students.map((s) => s.studentId);
        if (studentIds.length > 0) {
          await this.notificationsService.createBulkNotifications(
            centerId,
            studentIds,
            "New Assignment",
            `You have a new assignment: ${exercise.title}${input.dueDate ? ` (due ${new Date(input.dueDate).toLocaleDateString()})` : ""}`,
          );
        }
      }
    } else if (hasStudents) {
      // Validate student IDs exist in this center
      for (const studentId of input.studentIds!) {
        const membership = await db.centerMembership.findFirst({
          where: { userId: studentId, role: "STUDENT" },
        });
        if (!membership) throw AppError.notFound(`Student ${studentId} not found`);
      }

      // Individual student assignment (no classId)
      const assignment = await db.$transaction(async (tx) => {
        const created = await tx.assignment.create({
          data: {
            centerId,
            exerciseId: input.exerciseId,
            classId: null,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            timeLimit: input.timeLimit ?? null,
            instructions: input.instructions ?? null,
            status: "OPEN",
            createdById: authAccount.userId,
          },
        });

        await tx.assignmentStudent.createMany({
          data: input.studentIds!.map((studentId) => ({
            assignmentId: created.id,
            studentId,
            centerId,
          })),
        });

        return await tx.assignment.findUniqueOrThrow({
          where: { id: created.id },
          include: ASSIGNMENT_INCLUDE,
        });
      });

      assignments.push(assignment);

      // Notify students
      await this.notificationsService.createBulkNotifications(
        centerId,
        input.studentIds!,
        "New Assignment",
        `You have a new assignment: ${exercise.title}${input.dueDate ? ` (due ${new Date(input.dueDate).toLocaleDateString()})` : ""}`,
      );
    }

    return assignments;
  }

  async updateAssignment(
    centerId: string,
    id: string,
    input: { dueDate?: string | null; timeLimit?: number | null; instructions?: string | null },
  ) {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status === "ARCHIVED") {
      throw AppError.badRequest("Archived assignments cannot be edited. Reopen first.");
    }

    return await db.assignment.update({
      where: { id },
      data: {
        dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
        timeLimit: input.timeLimit !== undefined ? input.timeLimit : undefined,
        instructions: input.instructions !== undefined ? input.instructions : undefined,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async closeAssignment(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status !== "OPEN") {
      throw AppError.badRequest("Only open assignments can be closed");
    }
    return await db.assignment.update({
      where: { id },
      data: { status: "CLOSED" },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async reopenAssignment(
    centerId: string,
    id: string,
    input: { dueDate?: string | null },
  ) {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status === "OPEN") {
      throw AppError.badRequest("Assignment is already open");
    }
    return await db.assignment.update({
      where: { id },
      data: {
        status: "OPEN",
        dueDate: input.dueDate ? new Date(input.dueDate) : existing.dueDate,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async deleteAssignment(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    // TODO: Story 4.x — check for submissions here. If submissions exist, reject delete.
    // For now, all assignments can be deleted (no submission system yet).
    await db.assignment.delete({ where: { id } });
  }

  async archiveAssignment(centerId: string, id: string) {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status === "ARCHIVED") {
      throw AppError.badRequest("Assignment is already archived");
    }
    return await db.assignment.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async getAssignmentCountsByExercise(
    centerId: string,
    exerciseIds: string[],
  ): Promise<{ exerciseId: string; count: number }[]> {
    const db = getTenantedClient(this.prisma, centerId);
    const counts = await db.assignment.groupBy({
      by: ["exerciseId"],
      where: { exerciseId: { in: exerciseIds } },
      _count: { id: true },
    });
    return counts.map((c) => ({
      exerciseId: c.exerciseId,
      count: c._count.id,
    }));
  }
}
