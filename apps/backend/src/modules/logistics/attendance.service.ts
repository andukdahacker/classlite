import { PrismaClient, getTenantedClient } from "@workspace/db";
import {
  Attendance,
  AttendanceStatus,
  CreateAttendanceInput,
  BulkAttendanceInput,
  SessionAttendanceResponse,
  StudentWithAttendance,
  AttendanceWithSession,
} from "@workspace/types";

export class AttendanceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Validate attendance input - checks session exists, is not in future, student is enrolled
   */
  private async validateAttendanceInput(
    db: ReturnType<typeof getTenantedClient>,
    sessionId: string,
    studentId: string,
  ): Promise<{ valid: boolean; error?: string; classId?: string }> {
    const session = await db.classSession.findUnique({
      where: { id: sessionId },
      select: { startTime: true, classId: true, status: true },
    });

    if (!session) {
      return { valid: false, error: "Session not found" };
    }

    if (session.startTime > new Date()) {
      return { valid: false, error: "Cannot mark attendance for future sessions" };
    }

    if (session.status === "CANCELLED") {
      return { valid: false, error: "Cannot mark attendance for cancelled sessions" };
    }

    const enrollment = await db.classStudent.findFirst({
      where: { classId: session.classId, studentId },
    });

    if (!enrollment) {
      return { valid: false, error: "Student is not enrolled in this class" };
    }

    return { valid: true, classId: session.classId };
  }

  /**
   * Get attendance data for a session including all enrolled students
   */
  async getSessionAttendance(
    centerId: string,
    sessionId: string,
  ): Promise<SessionAttendanceResponse> {
    const db = getTenantedClient(this.prisma, centerId);

    const session = await db.classSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            course: { select: { name: true, color: true } },
            students: {
              include: {
                student: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
              orderBy: { student: { name: "asc" } },
            },
          },
        },
        attendance: true,
      },
    });

    // Map attendance records by studentId for quick lookup
    const attendanceMap = new Map(
      session.attendance.map((a) => [a.studentId, a]),
    );

    const students: StudentWithAttendance[] = session.class.students.map((cs) => ({
      id: cs.student.id,
      name: cs.student.name,
      email: cs.student.email,
      image: cs.student.avatarUrl,
      attendance: attendanceMap.has(cs.studentId)
        ? {
            status: attendanceMap.get(cs.studentId)!.status as AttendanceStatus,
            markedAt: attendanceMap.get(cs.studentId)!.updatedAt,
          }
        : null,
    }));

    return {
      session: {
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        class: {
          name: session.class.name,
          course: {
            name: session.class.course.name,
            color: session.class.course.color,
          },
        },
      },
      students,
    };
  }

  /**
   * Resolve Firebase UID to internal user ID via AuthAccount lookup.
   */
  private async resolveUserId(
    db: ReturnType<typeof getTenantedClient>,
    firebaseUid: string,
  ): Promise<string> {
    const authAccount = await db.authAccount.findUniqueOrThrow({
      where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } },
    });
    return authAccount.userId;
  }

  /**
   * Mark attendance for a single student (upsert)
   */
  async markAttendance(
    centerId: string,
    sessionId: string,
    input: CreateAttendanceInput,
    firebaseUid: string,
  ): Promise<Attendance> {
    const db = getTenantedClient(this.prisma, centerId);

    const validation = await this.validateAttendanceInput(db, sessionId, input.studentId);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const markedByUserId = await this.resolveUserId(db, firebaseUid);

    const attendance = await db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: input.studentId,
        },
      },
      create: {
        sessionId,
        studentId: input.studentId,
        status: input.status,
        markedBy: markedByUserId,
        centerId,
      },
      update: {
        status: input.status,
        markedBy: markedByUserId,
      },
    });

    return attendance as Attendance;
  }

  /**
   * Mark attendance for all enrolled students in a session (bulk operation)
   * Atomic: all succeed or all fail. Max 500 students.
   */
  async markBulkAttendance(
    centerId: string,
    sessionId: string,
    input: BulkAttendanceInput,
    firebaseUid: string,
  ): Promise<{ count: number; markedStudents: string[] }> {
    const db = getTenantedClient(this.prisma, centerId);

    const markedByUserId = await this.resolveUserId(db, firebaseUid);

    // Validate session
    const session = await db.classSession.findUnique({
      where: { id: sessionId },
      select: { startTime: true, classId: true, status: true },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.startTime > new Date()) {
      throw new Error("Cannot mark attendance for future sessions");
    }

    if (session.status === "CANCELLED") {
      throw new Error("Cannot mark attendance for cancelled sessions");
    }

    // Get enrolled students (max 500)
    const enrolledStudents = await db.classStudent.findMany({
      where: { classId: session.classId },
      select: { studentId: true },
      take: 500,
    });

    if (enrolledStudents.length === 0) {
      return { count: 0, markedStudents: [] };
    }

    const studentIds = enrolledStudents.map((s) => s.studentId);

    // Use transaction for atomicity
    await db.$transaction(async (tx) => {
      for (const studentId of studentIds) {
        await tx.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId },
          },
          create: {
            sessionId,
            studentId,
            status: input.status,
            markedBy: markedByUserId,
            centerId,
          },
          update: {
            status: input.status,
            markedBy: markedByUserId,
          },
        });
      }
    });

    return {
      count: studentIds.length,
      markedStudents: studentIds,
    };
  }

  /**
   * Get attendance statistics for a student (for Health Dashboard)
   */
  async getStudentAttendanceStats(
    centerId: string,
    studentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    attendancePercentage: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    totalSessions: number;
  }> {
    const db = getTenantedClient(this.prisma, centerId);

    // Get all sessions for classes the student is enrolled in within date range
    const enrollments = await db.classStudent.findMany({
      where: { studentId },
      select: { classId: true },
    });

    const classIds = enrollments.map((e) => e.classId);

    if (classIds.length === 0) {
      return {
        attendancePercentage: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        totalSessions: 0,
      };
    }

    // Count sessions in the student's classes
    const sessionWhere: Record<string, unknown> = {
      classId: { in: classIds },
      status: { not: "CANCELLED" },
      startTime: { lte: new Date() }, // Only past sessions
    };

    if (startDate) {
      sessionWhere.startTime = { ...sessionWhere.startTime as object, gte: startDate };
    }
    if (endDate) {
      sessionWhere.endTime = { lte: endDate };
    }

    const totalSessions = await db.classSession.count({
      where: sessionWhere,
    });

    // Get attendance records for this student
    const attendanceWhere: Record<string, unknown> = {
      studentId,
      session: sessionWhere,
    };

    const attendanceRecords = await db.attendance.findMany({
      where: attendanceWhere,
      select: { status: true },
    });

    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
    const excusedCount = attendanceRecords.filter((a) => a.status === "EXCUSED").length;

    // Calculate percentage: (present + late + excused) / total * 100
    // Late and excused count as "attended" for percentage calculation
    const attendedCount = presentCount + lateCount + excusedCount;
    const attendancePercentage = totalSessions > 0
      ? Math.round((attendedCount / totalSessions) * 1000) / 10 // Round to 1 decimal
      : 0;

    return {
      attendancePercentage,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      totalSessions,
    };
  }

  /**
   * Get attendance history for a student
   */
  async getStudentAttendanceHistory(
    centerId: string,
    studentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AttendanceWithSession[]> {
    const db = getTenantedClient(this.prisma, centerId);

    const where: Record<string, unknown> = { studentId };

    if (startDate || endDate) {
      where.session = {};
      if (startDate) {
        (where.session as Record<string, unknown>).startTime = { gte: startDate };
      }
      if (endDate) {
        (where.session as Record<string, unknown>).endTime = { lte: endDate };
      }
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            class: {
              include: {
                course: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { session: { startTime: "desc" } },
    });

    // Map Prisma result to AttendanceWithSession type
    return records.map((record) => ({
      id: record.id,
      sessionId: record.sessionId,
      studentId: record.studentId,
      status: record.status as AttendanceStatus,
      markedBy: record.markedBy,
      centerId: record.centerId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      session: {
        id: record.session.id,
        startTime: record.session.startTime,
        class: {
          name: record.session.class.name,
          course: { name: record.session.class.course.name },
        },
      },
    }));
  }

  /**
   * Get aggregate attendance stats for a class
   */
  async getClassAttendanceStats(
    centerId: string,
    classId: string,
  ): Promise<{
    totalStudents: number;
    totalSessions: number;
    averageAttendancePercentage: number;
  }> {
    const db = getTenantedClient(this.prisma, centerId);

    const studentCount = await db.classStudent.count({
      where: { classId },
    });

    const sessionCount = await db.classSession.count({
      where: {
        classId,
        status: { not: "CANCELLED" },
        startTime: { lte: new Date() },
      },
    });

    if (studentCount === 0 || sessionCount === 0) {
      return {
        totalStudents: studentCount,
        totalSessions: sessionCount,
        averageAttendancePercentage: 0,
      };
    }

    // Count attendance records where status is PRESENT, LATE, or EXCUSED
    const attendedCount = await db.attendance.count({
      where: {
        session: {
          classId,
          status: { not: "CANCELLED" },
          startTime: { lte: new Date() },
        },
        status: { in: ["PRESENT", "LATE", "EXCUSED"] },
      },
    });

    const expectedAttendanceCount = studentCount * sessionCount;
    const averageAttendancePercentage = expectedAttendanceCount > 0
      ? Math.round((attendedCount / expectedAttendanceCount) * 1000) / 10
      : 0;

    return {
      totalStudents: studentCount,
      totalSessions: sessionCount,
      averageAttendancePercentage,
    };
  }
}
