import { PrismaClient, getTenantedClient } from "@workspace/db";
import { CreateCourseInput, UpdateCourseInput, Course } from "@workspace/types";

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
    await db.course.delete({
      where: { id },
    });
  }
}
