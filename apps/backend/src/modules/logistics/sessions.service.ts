import { PrismaClient, getTenantedClient } from "@workspace/db";
import {
  CreateClassSessionInput,
  UpdateClassSessionInput,
  ClassSession,
  GenerateSessionsInput,
} from "@workspace/types";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  setHours,
  setMinutes,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isValid,
} from "date-fns";

export class SessionsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listSessions(
    centerId: string,
    startDate: Date,
    endDate: Date,
    classId?: string,
  ): Promise<ClassSession[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classSession.findMany({
      where: {
        ...(classId && { classId }),
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        class: {
          include: {
            course: true,
            teacher: {
              select: { id: true, name: true },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async getSessionsForWeek(
    centerId: string,
    weekStart: Date,
    classId?: string,
  ): Promise<ClassSession[]> {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(weekStart, { weekStartsOn: 1 }); // Sunday
    return this.listSessions(centerId, start, end, classId);
  }

  async getSession(centerId: string, id: string): Promise<ClassSession> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.classSession.findUniqueOrThrow({
      where: { id },
      include: {
        class: {
          include: {
            course: true,
            teacher: {
              select: { id: true, name: true },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });
  }

  async createSession(
    centerId: string,
    input: CreateClassSessionInput,
  ): Promise<ClassSession> {
    const db = getTenantedClient(this.prisma, centerId);

    // Verify class belongs to center
    await db.class.findUniqueOrThrow({
      where: { id: input.classId },
    });

    const startTime = typeof input.startTime === "string"
      ? new Date(input.startTime)
      : input.startTime;
    const endTime = typeof input.endTime === "string"
      ? new Date(input.endTime)
      : input.endTime;

    return await db.classSession.create({
      data: {
        classId: input.classId,
        scheduleId: input.scheduleId,
        startTime,
        endTime,
        roomName: input.roomName,
        status: input.status ?? "SCHEDULED",
        centerId,
      },
      include: {
        class: {
          include: {
            course: true,
            teacher: {
              select: { id: true, name: true },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });
  }

  async updateSession(
    centerId: string,
    id: string,
    input: UpdateClassSessionInput,
  ): Promise<{ session: ClassSession; previousStartTime: Date; previousEndTime: Date }> {
    const db = getTenantedClient(this.prisma, centerId);

    // Get the current session to compare changes
    const currentSession = await db.classSession.findUniqueOrThrow({
      where: { id },
    });

    const updateData: Record<string, unknown> = {};
    if (input.startTime !== undefined) {
      updateData.startTime = typeof input.startTime === "string"
        ? new Date(input.startTime)
        : input.startTime;
    }
    if (input.endTime !== undefined) {
      updateData.endTime = typeof input.endTime === "string"
        ? new Date(input.endTime)
        : input.endTime;
    }
    if (input.roomName !== undefined) {
      updateData.roomName = input.roomName;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    const session = await db.classSession.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          include: {
            course: true,
            teacher: {
              select: { id: true, name: true },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    return {
      session,
      previousStartTime: currentSession.startTime,
      previousEndTime: currentSession.endTime,
    };
  }

  async deleteSession(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    await db.classSession.delete({
      where: { id },
    });
  }

  /**
   * Generate sessions from schedules for a given date range.
   * This creates specific ClassSession records from recurring ClassSchedule patterns.
   */
  async generateSessions(
    centerId: string,
    input: GenerateSessionsInput,
  ): Promise<{ generatedCount: number; sessions: ClassSession[] }> {
    const db = getTenantedClient(this.prisma, centerId);

    const startDate = typeof input.startDate === "string"
      ? parseISO(input.startDate)
      : input.startDate;
    const endDate = typeof input.endDate === "string"
      ? parseISO(input.endDate)
      : input.endDate;

    if (!isValid(startDate) || !isValid(endDate)) {
      throw new Error("Invalid date range provided");
    }

    // Get all schedules (optionally filtered by class)
    const schedules = await db.classSchedule.findMany({
      where: input.classId ? { classId: input.classId } : undefined,
    });

    // Get existing sessions in the date range to avoid duplicates
    const existingSessions = await db.classSession.findMany({
      where: {
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        ...(input.classId && { classId: input.classId }),
      },
      select: {
        classId: true,
        startTime: true,
      },
    });

    // Create a set of existing session keys for quick lookup
    const existingSessionKeys = new Set(
      existingSessions.map(
        (s) => `${s.classId}-${s.startTime.toISOString()}`,
      ),
    );

    const sessionsToCreate: {
      classId: string;
      scheduleId: string;
      startTime: Date;
      endTime: Date;
      roomName: string | null;
      status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
      centerId: string;
    }[] = [];

    // Get all days in the date range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    for (const schedule of schedules) {
      // Parse time strings (HH:mm format)
      const startParts = schedule.startTime.split(":").map(Number);
      const endParts = schedule.endTime.split(":").map(Number);
      const startHour = startParts[0] ?? 0;
      const startMinute = startParts[1] ?? 0;
      const endHour = endParts[0] ?? 0;
      const endMinute = endParts[1] ?? 0;

      for (const day of days) {
        // Check if this day matches the schedule's day of week
        if (day.getDay() === schedule.dayOfWeek) {
          const sessionStart = setMinutes(setHours(day, startHour), startMinute);
          const sessionEnd = setMinutes(setHours(day, endHour), endMinute);

          // Check if session already exists
          const sessionKey = `${schedule.classId}-${sessionStart.toISOString()}`;
          if (!existingSessionKeys.has(sessionKey)) {
            sessionsToCreate.push({
              classId: schedule.classId,
              scheduleId: schedule.id,
              startTime: sessionStart,
              endTime: sessionEnd,
              roomName: schedule.roomName,
              status: "SCHEDULED",
              centerId,
            });
          }
        }
      }
    }

    // Bulk create sessions
    if (sessionsToCreate.length > 0) {
      await db.classSession.createMany({
        data: sessionsToCreate,
      });
    }

    // Fetch the created sessions with relations
    const createdSessions = await db.classSession.findMany({
      where: {
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        ...(input.classId && { classId: input.classId }),
      },
      include: {
        class: {
          include: {
            course: true,
            teacher: {
              select: { id: true, name: true },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return {
      generatedCount: sessionsToCreate.length,
      sessions: createdSessions,
    };
  }

  /**
   * Get class information including enrolled students and teacher for notifications
   */
  async getClassParticipants(
    centerId: string,
    classId: string,
  ): Promise<{ teacherId: string | null; studentIds: string[] }> {
    const db = getTenantedClient(this.prisma, centerId);

    const classData = await db.class.findUniqueOrThrow({
      where: { id: classId },
      include: {
        students: {
          select: { studentId: true },
        },
      },
    });

    return {
      teacherId: classData.teacherId,
      studentIds: classData.students.map((s) => s.studentId),
    };
  }
}
