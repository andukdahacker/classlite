import { PrismaClient, getTenantedClient } from "@workspace/db";
import {
  CreateClassSessionInput,
  UpdateClassSessionInput,
  ClassSession,
  GenerateSessionsInput,
  ConflictCheckInput,
  ConflictResult,
  ConflictingSession,
  Suggestion,
} from "@workspace/types";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  setHours,
  setMinutes,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isValid,
  format,
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

    const primarySession = await db.classSession.create({
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

    // Handle recurrence: generate additional sessions for 12 weeks
    if (input.recurrence && input.recurrence !== "none") {
      const intervalWeeks = input.recurrence === "biweekly" ? 2 : 1;
      const totalInstances = input.recurrence === "biweekly" ? 6 : 12;

      // Create a ClassSchedule record to group recurring sessions
      const schedule = await db.classSchedule.create({
        data: {
          classId: input.classId,
          dayOfWeek: startTime.getDay(),
          startTime: format(startTime, "HH:mm"),
          endTime: format(endTime, "HH:mm"),
          roomName: input.roomName ?? null,
          centerId,
        },
      });

      // Link primary session to the schedule
      await db.classSession.update({
        where: { id: primarySession.id },
        data: { scheduleId: schedule.id },
      });

      // Generate future sessions
      const sessionsToCreate = [];
      for (let i = 1; i < totalInstances; i++) {
        const weekOffset = i * intervalWeeks;
        const futureStart = addWeeks(startTime, weekOffset);
        const futureEnd = addWeeks(endTime, weekOffset);

        sessionsToCreate.push({
          classId: input.classId,
          scheduleId: schedule.id,
          startTime: futureStart,
          endTime: futureEnd,
          roomName: input.roomName ?? null,
          status: "SCHEDULED" as const,
          centerId,
        });
      }

      if (sessionsToCreate.length > 0) {
        await db.classSession.createMany({ data: sessionsToCreate });
      }
    }

    return primarySession;
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

  async deleteFutureSessions(
    centerId: string,
    sessionId: string,
  ): Promise<{ deletedCount: number; classId: string }> {
    const db = getTenantedClient(this.prisma, centerId);

    const session = await db.classSession.findUniqueOrThrow({
      where: { id: sessionId },
    });

    if (!session.scheduleId) {
      throw new Error("Session is not part of a recurring series");
    }

    const result = await db.classSession.deleteMany({
      where: {
        scheduleId: session.scheduleId,
        startTime: { gte: session.startTime },
        centerId,
      },
    });

    // Clean up orphaned ClassSchedule if no sessions remain
    const remainingCount = await db.classSession.count({
      where: { scheduleId: session.scheduleId },
    });
    if (remainingCount === 0) {
      await db.classSchedule.delete({ where: { id: session.scheduleId } });
    }

    return { deletedCount: result.count, classId: session.classId };
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

  /**
   * Check for scheduling conflicts (room double-booking or teacher double-booking)
   * Time Overlap Formula: (session1.startTime < session2.endTime) AND (session1.endTime > session2.startTime)
   */
  async checkConflicts(
    centerId: string,
    input: ConflictCheckInput,
  ): Promise<ConflictResult> {
    const db = getTenantedClient(this.prisma, centerId);

    const startTime = typeof input.startTime === "string"
      ? new Date(input.startTime)
      : input.startTime;
    const endTime = typeof input.endTime === "string"
      ? new Date(input.endTime)
      : input.endTime;

    const roomConflicts: ConflictingSession[] = [];
    const teacherConflicts: ConflictingSession[] = [];

    // Check for room conflicts (only if roomName is provided and not null/empty)
    if (input.roomName) {
      const roomConflictSessions = await db.classSession.findMany({
        where: {
          roomName: input.roomName,
          ...(input.excludeSessionId && { id: { not: input.excludeSessionId } }),
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: {
          class: {
            include: {
              course: true,
              teacher: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      for (const session of roomConflictSessions) {
        roomConflicts.push({
          id: session.id,
          classId: session.classId,
          startTime: session.startTime,
          endTime: session.endTime,
          roomName: session.roomName,
          className: session.class?.name,
          courseName: session.class?.course?.name,
          teacherName: session.class?.teacher?.name,
        });
      }
    }

    // Get teacherId from the class being scheduled
    const classData = await db.class.findUnique({
      where: { id: input.classId },
      select: { teacherId: true },
    });
    const teacherId = classData?.teacherId;

    // Check for teacher conflicts (only if teacher is assigned)
    if (teacherId) {
      const teacherConflictSessions = await db.classSession.findMany({
        where: {
          class: { teacherId },
          ...(input.excludeSessionId && { id: { not: input.excludeSessionId } }),
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: {
          class: {
            include: {
              course: true,
              teacher: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      for (const session of teacherConflictSessions) {
        teacherConflicts.push({
          id: session.id,
          classId: session.classId,
          startTime: session.startTime,
          endTime: session.endTime,
          roomName: session.roomName,
          className: session.class?.name,
          courseName: session.class?.course?.name,
          teacherName: session.class?.teacher?.name,
        });
      }
    }

    const hasConflicts = roomConflicts.length > 0 || teacherConflicts.length > 0;

    // Generate suggestions if conflicts exist
    let suggestions: Suggestion[] | undefined;
    if (hasConflicts) {
      suggestions = await this.suggestNextAvailable(centerId, {
        classId: input.classId,
        startTime,
        endTime,
        roomName: input.roomName,
      });
    }

    return {
      hasConflicts,
      roomConflicts,
      teacherConflicts,
      suggestions,
    };
  }

  /**
   * Suggest alternative time slots or rooms when conflicts are detected
   */
  async suggestNextAvailable(
    centerId: string,
    input: {
      classId: string;
      startTime: Date;
      endTime: Date;
      roomName?: string | null;
    },
  ): Promise<Suggestion[]> {
    const db = getTenantedClient(this.prisma, centerId);
    const suggestions: Suggestion[] = [];

    const duration = input.endTime.getTime() - input.startTime.getTime();
    const targetDate = input.startTime;

    // Get teacherId for the class
    const classData = await db.class.findUnique({
      where: { id: input.classId },
      select: { teacherId: true },
    });
    const teacherId = classData?.teacherId;

    // Get start and end of the target day
    const dayStart = new Date(targetDate);
    dayStart.setHours(8, 0, 0, 0); // Business hours start at 8am
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(20, 0, 0, 0); // Business hours end at 8pm

    // Get all sessions on the same day that might conflict (teacher or room)
    const sessionsOnDay = await db.classSession.findMany({
      where: {
        status: { not: "CANCELLED" },
        startTime: { gte: dayStart, lt: dayEnd },
        OR: [
          ...(teacherId ? [{ class: { teacherId } }] : []),
          ...(input.roomName ? [{ roomName: input.roomName }] : []),
        ],
      },
      orderBy: { startTime: "asc" },
    });

    // Find available time slots on the same day
    const busySlots = sessionsOnDay.map((s) => ({
      start: s.startTime.getTime(),
      end: s.endTime.getTime(),
    }));

    // Sort by start time
    busySlots.sort((a, b) => a.start - b.start);

    // Find gaps in schedule after the requested time
    let searchStart = Math.max(input.startTime.getTime(), dayStart.getTime());
    const maxSuggestions = 3;
    let foundTimeSlots = 0;

    // Check if the slot before the first busy slot is available
    if (busySlots.length === 0) {
      // No sessions, any time works
      if (searchStart + duration <= dayEnd.getTime()) {
        const suggestedStart = new Date(searchStart);
        const suggestedEnd = new Date(searchStart + duration);
        suggestions.push({
          type: "time",
          value: `${suggestedStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${suggestedEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
          startTime: suggestedStart,
          endTime: suggestedEnd,
        });
        foundTimeSlots++;
      }
    } else {
      // Find gaps between busy slots
      for (let i = 0; i <= busySlots.length && foundTimeSlots < maxSuggestions; i++) {
        const gapStart = i === 0 ? searchStart : busySlots[i - 1]!.end;
        const gapEnd = i === busySlots.length ? dayEnd.getTime() : busySlots[i]!.start;

        // Check if gap is large enough and after the search start
        if (gapStart >= searchStart && gapEnd - gapStart >= duration) {
          const suggestedStart = new Date(gapStart);
          const suggestedEnd = new Date(gapStart + duration);
          suggestions.push({
            type: "time",
            value: `${suggestedStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${suggestedEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
            startTime: suggestedStart,
            endTime: suggestedEnd,
          });
          foundTimeSlots++;
        }
      }
    }

    // Find alternative rooms that are free during the requested time
    if (input.roomName) {
      // Get distinct room names from recent sessions (last 90 days) for relevance
      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - 90);
      const allRooms = await db.classSession.findMany({
        where: {
          roomName: { not: null },
          startTime: { gte: recentCutoff },
          status: { not: "CANCELLED" },
        },
        select: { roomName: true },
        distinct: ["roomName"],
      });

      const roomNames = allRooms
        .map((r) => r.roomName)
        .filter((name): name is string => name !== null && name !== input.roomName);

      // Check which rooms are free during the requested time
      for (const roomName of roomNames.slice(0, 3)) {
        const conflictingSession = await db.classSession.findFirst({
          where: {
            roomName,
            status: { not: "CANCELLED" },
            startTime: { lt: input.endTime },
            endTime: { gt: input.startTime },
          },
        });

        if (!conflictingSession) {
          suggestions.push({
            type: "room",
            value: roomName,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Efficiently check conflicts for multiple sessions at once.
   * Used by calendar to mark existing sessions with conflict icons.
   * Queries the DB for ALL overlapping sessions in the time range (not just the batch)
   * to catch conflicts with sessions outside the current view.
   * Returns a Map of sessionId -> hasConflicts boolean.
   */
  async checkBatchConflicts(
    centerId: string,
    sessions: { id: string; classId: string; startTime: Date; endTime: Date; roomName: string | null }[],
  ): Promise<Map<string, boolean>> {
    const db = getTenantedClient(this.prisma, centerId);
    const conflictMap = new Map<string, boolean>();

    if (sessions.length === 0) {
      return conflictMap;
    }

    // Find the full time range of the batch
    const minStart = new Date(
      Math.min(...sessions.map((s) => new Date(s.startTime).getTime())),
    );
    const maxEnd = new Date(
      Math.max(...sessions.map((s) => new Date(s.endTime).getTime())),
    );

    // Query ALL non-cancelled sessions that overlap with the batch time range
    const allOverlapping = await db.classSession.findMany({
      where: {
        status: { not: "CANCELLED" },
        startTime: { lt: maxEnd },
        endTime: { gt: minStart },
      },
      select: {
        id: true,
        classId: true,
        startTime: true,
        endTime: true,
        roomName: true,
        class: { select: { teacherId: true } },
      },
    });

    // Build teacher map from all overlapping sessions
    const teacherMap = new Map<string, string | null>();
    for (const s of allOverlapping) {
      teacherMap.set(s.classId, s.class?.teacherId ?? null);
    }

    // Also ensure batch session classes are in the teacher map
    const missingClassIds = sessions
      .filter((s) => !teacherMap.has(s.classId))
      .map((s) => s.classId);
    if (missingClassIds.length > 0) {
      const classes = await db.class.findMany({
        where: { id: { in: [...new Set(missingClassIds)] } },
        select: { id: true, teacherId: true },
      });
      for (const c of classes) {
        teacherMap.set(c.id, c.teacherId);
      }
    }

    // Check each batch session against ALL overlapping sessions
    const batchIds = new Set(sessions.map((s) => s.id));
    for (const session of sessions) {
      let hasConflict = false;

      for (const other of allOverlapping) {
        if (other.id === session.id) continue;

        const overlaps =
          new Date(other.startTime) < new Date(session.endTime) &&
          new Date(other.endTime) > new Date(session.startTime);
        if (!overlaps) continue;

        // Room conflict
        if (session.roomName && other.roomName === session.roomName) {
          hasConflict = true;
          break;
        }

        // Teacher conflict
        const sessionTeacherId = teacherMap.get(session.classId);
        const otherTeacherId = teacherMap.get(other.classId);
        if (sessionTeacherId && otherTeacherId && sessionTeacherId === otherTeacherId) {
          hasConflict = true;
          break;
        }
      }

      conflictMap.set(session.id, hasConflict);
    }

    return conflictMap;
  }

  /**
   * List sessions with optional conflict status computation
   */
  async listSessionsWithConflicts(
    centerId: string,
    startDate: Date,
    endDate: Date,
    classId?: string,
  ): Promise<(ClassSession & { hasConflicts?: boolean })[]> {
    const sessions = await this.listSessions(centerId, startDate, endDate, classId);

    // Compute conflicts for all sessions
    const sessionData = sessions.map((s) => ({
      id: s.id,
      classId: s.classId,
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
      roomName: s.roomName ?? null,
    }));

    const conflictMap = await this.checkBatchConflicts(centerId, sessionData);

    // Add hasConflicts flag to each session
    return sessions.map((session) => ({
      ...session,
      hasConflicts: conflictMap.get(session.id) ?? false,
    }));
  }
}
