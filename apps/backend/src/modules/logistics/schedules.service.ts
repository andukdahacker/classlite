import { PrismaClient, getTenantedClient } from "@workspace/db";
import {
  ClassSchedule,
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
} from "@workspace/types";

export class SchedulesService {
  constructor(private readonly prisma: PrismaClient) {}

  async listSchedules(
    centerId: string,
    classId?: string,
  ): Promise<ClassSchedule[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classSchedule.findMany({
      where: classId ? { classId } : undefined,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async getSchedule(centerId: string, id: string): Promise<ClassSchedule> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classSchedule.findUniqueOrThrow({
      where: { id },
    });
  }

  async createSchedule(
    centerId: string,
    input: CreateClassScheduleInput,
  ): Promise<ClassSchedule> {
    const db = getTenantedClient(this.prisma, centerId);

    // Verify class belongs to center
    await db.class.findUniqueOrThrow({
      where: { id: input.classId },
    });

    return await db.classSchedule.create({
      data: {
        ...input,
        centerId,
      },
    });
  }

  async updateSchedule(
    centerId: string,
    id: string,
    input: UpdateClassScheduleInput,
  ): Promise<ClassSchedule> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classSchedule.update({
      where: { id },
      data: input,
    });
  }

  async deleteSchedule(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    await db.classSchedule.delete({
      where: { id },
    });
  }

  async getSchedulesByClass(
    centerId: string,
    classId: string,
  ): Promise<ClassSchedule[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classSchedule.findMany({
      where: { classId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }
}
