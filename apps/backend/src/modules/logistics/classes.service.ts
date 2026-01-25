import { PrismaClient, getTenantedClient } from "@workspace/db";
import {
  CreateClassInput,
  UpdateClassInput,
  Class,
  ClassStudent,
} from "@workspace/types";

export class ClassesService {
  constructor(private readonly prisma: PrismaClient) {}

  async listClasses(centerId: string): Promise<Class[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.class.findMany({
      include: {
        course: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getClass(centerId: string, id: string): Promise<Class> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.class.findUniqueOrThrow({
      where: { id },
      include: {
        course: true,
        _count: {
          select: { students: true },
        },
      },
    });
  }

  async createClass(centerId: string, input: CreateClassInput): Promise<Class> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.class.create({
      data: {
        ...input,
        centerId,
      },
    });
  }

  async updateClass(
    centerId: string,
    id: string,
    input: UpdateClassInput,
  ): Promise<Class> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.class.update({
      where: { id },
      data: input,
    });
  }

  async deleteClass(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    await db.class.delete({
      where: { id },
    });
  }

  async addStudent(
    centerId: string,
    classId: string,
    studentId: string,
  ): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    // Verify student belongs to this center
    const membership = await db.centerMembership.findFirst({
      where: { userId: studentId, role: "STUDENT" },
    });

    if (!membership) {
      throw new Error("Student does not belong to this center");
    }

    await db.classStudent.create({
      data: {
        classId,
        studentId,
        centerId,
      },
    });
  }

  async removeStudent(
    centerId: string,
    classId: string,
    studentId: string,
  ): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    await db.classStudent.delete({
      where: {
        classId_studentId: { classId, studentId },
      },
    });
  }

  async listRoster(centerId: string, classId: string): Promise<ClassStudent[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classStudent.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getCenterStudents(centerId: string, search?: string): Promise<any[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.centerMembership.findMany({
      where: {
        centerId,
        role: "STUDENT",
        user: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
      },
      take: 20, // Limit results for performance
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
