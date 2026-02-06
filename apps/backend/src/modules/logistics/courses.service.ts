import { PrismaClient, getTenantedClient } from "@workspace/db";
import { CreateCourseInput, UpdateCourseInput, Course } from "@workspace/types";
import { AppError } from "../../errors/app-error.js";

export class CoursesService {
  constructor(private readonly prisma: PrismaClient) {}

  async listCourses(centerId: string): Promise<Course[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.course.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getCourse(centerId: string, id: string): Promise<Course> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.course.findUniqueOrThrow({
      where: { id },
    });
  }

  async createCourse(
    centerId: string,
    input: CreateCourseInput,
  ): Promise<Course> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.course.create({
      data: {
        ...input,
        centerId,
      },
    });
  }

  async updateCourse(
    centerId: string,
    id: string,
    input: UpdateCourseInput,
  ): Promise<Course> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.course.update({
      where: { id },
      data: input,
    });
  }

  async deleteCourse(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    // Check for dependent classes before deleting
    const dependentCount = await db.class.count({
      where: { courseId: id },
    });
    if (dependentCount > 0) {
      throw AppError.badRequest(
        `Cannot delete: ${dependentCount} class(es) depend on this course`,
      );
    }
    await db.course.delete({
      where: { id },
    });
  }
}
