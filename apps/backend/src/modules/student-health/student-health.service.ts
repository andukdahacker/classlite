import { PrismaClient, getTenantedClient } from "@workspace/db";
import type {
  HealthStatus,
  StudentHealthCard,
  StudentHealthDashboardResponse,
} from "@workspace/types";

const ATTENDANCE_THRESHOLDS = { AT_RISK: 80, WARNING: 90 } as const;
const COMPLETION_THRESHOLDS = { AT_RISK: 50, WARNING: 75 } as const;

const STATUS_PRIORITY: Record<HealthStatus, number> = {
  "at-risk": 0,
  warning: 1,
  "on-track": 2,
};

function computeAttendanceStatus(rate: number): HealthStatus {
  if (rate < ATTENDANCE_THRESHOLDS.AT_RISK) return "at-risk";
  if (rate < ATTENDANCE_THRESHOLDS.WARNING) return "warning";
  return "on-track";
}

function computeCompletionStatus(rate: number): HealthStatus {
  if (rate < COMPLETION_THRESHOLDS.AT_RISK) return "at-risk";
  if (rate < COMPLETION_THRESHOLDS.WARNING) return "warning";
  return "on-track";
}

function worstStatus(a: HealthStatus, b: HealthStatus): HealthStatus {
  return STATUS_PRIORITY[a] <= STATUS_PRIORITY[b] ? a : b;
}

export class StudentHealthService {
  constructor(private readonly prisma: PrismaClient) {}

  async getDashboard(
    centerId: string,
    filters: { classId?: string; search?: string },
  ): Promise<StudentHealthDashboardResponse> {
    const db = getTenantedClient(this.prisma, centerId);
    const now = new Date();

    // Step A — Get all active students in center
    const memberships = await db.centerMembership.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        ...(filters.search
          ? { user: { name: { contains: filters.search, mode: "insensitive" } } }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const studentIds = memberships.map((m) => m.user.id);
    if (studentIds.length === 0) {
      return {
        students: [],
        summary: { total: 0, atRisk: 0, warning: 0, onTrack: 0 },
      };
    }

    // Step B — Get enrollment data
    const enrollments = await db.classStudent.findMany({
      where: {
        studentId: { in: studentIds },
        ...(filters.classId ? { classId: filters.classId } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    // Build enrollment map: studentId -> classes
    const enrollmentMap = new Map<string, Array<{ id: string; name: string }>>();
    for (const e of enrollments) {
      const classes = enrollmentMap.get(e.studentId) ?? [];
      classes.push({ id: e.class.id, name: e.class.name });
      enrollmentMap.set(e.studentId, classes);
    }

    // If classId filter, only include students enrolled in that class
    const filteredStudentIds = filters.classId
      ? studentIds.filter((id) => enrollmentMap.has(id))
      : studentIds;

    if (filteredStudentIds.length === 0) {
      return {
        students: [],
        summary: { total: 0, atRisk: 0, warning: 0, onTrack: 0 },
      };
    }

    // Step C — Compute attendance metrics (batched)
    const [sessions, attendanceRecords] = await Promise.all([
      db.classSession.findMany({
        where: { startTime: { lte: now }, status: { not: "CANCELLED" } },
        select: { id: true, classId: true },
      }),
      db.attendance.findMany({
        where: { studentId: { in: filteredStudentIds } },
        select: { studentId: true, sessionId: true, status: true },
      }),
    ]);

    // Build session-to-class map
    const sessionClassMap = new Map<string, string>();
    for (const s of sessions) {
      sessionClassMap.set(s.id, s.classId);
    }

    // Build attendance lookup: studentId -> Set of attended sessionIds
    const attendanceLookup = new Map<string, Set<string>>();
    for (const a of attendanceRecords) {
      if (a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED") {
        const set = attendanceLookup.get(a.studentId) ?? new Set();
        set.add(a.sessionId);
        attendanceLookup.set(a.studentId, set);
      }
    }

    // Step D — Compute assignment completion metrics (batched)
    const [assignments, assignmentStudents, submissions] = await Promise.all([
      db.assignment.findMany({
        where: { status: { in: ["OPEN", "CLOSED", "ARCHIVED"] } },
        select: { id: true, classId: true, dueDate: true },
      }),
      db.assignmentStudent.findMany({
        where: { studentId: { in: filteredStudentIds } },
        select: { assignmentId: true, studentId: true },
      }),
      // Submission is not in TENANTED_MODELS, so filter by centerId explicitly
      this.prisma.submission.findMany({
        where: {
          centerId,
          studentId: { in: filteredStudentIds },
          status: { in: ["SUBMITTED", "AI_PROCESSING", "GRADED"] },
        },
        select: { studentId: true, assignmentId: true },
      }),
    ]);

    // Build assignment-student direct entries map: studentId -> Set<assignmentId>
    const directAssignmentMap = new Map<string, Set<string>>();
    for (const as of assignmentStudents) {
      const set = directAssignmentMap.get(as.studentId) ?? new Set();
      set.add(as.assignmentId);
      directAssignmentMap.set(as.studentId, set);
    }

    // Build submission lookup: studentId -> Set<assignmentId>
    const submissionLookup = new Map<string, Set<string>>();
    for (const s of submissions) {
      const set = submissionLookup.get(s.studentId) ?? new Set();
      set.add(s.assignmentId);
      submissionLookup.set(s.studentId, set);
    }

    // Build per-student data
    const membershipLookup = new Map(
      memberships
        .filter((m) => filteredStudentIds.includes(m.user.id))
        .map((m) => [m.user.id, m.user]),
    );

    const students: StudentHealthCard[] = [];

    for (const studentId of filteredStudentIds) {
      const user = membershipLookup.get(studentId);
      if (!user) continue;

      const studentClasses = enrollmentMap.get(studentId) ?? [];
      const studentClassIds = new Set(studentClasses.map((c) => c.id));

      // Attendance computation
      const expectedSessionIds = sessions
        .filter((s) => studentClassIds.has(s.classId))
        .map((s) => s.id);
      const attendedSet = attendanceLookup.get(studentId) ?? new Set();
      const attendedCount = expectedSessionIds.filter((sid) =>
        attendedSet.has(sid),
      ).length;
      const totalSessions = expectedSessionIds.length;
      const attendanceRate =
        totalSessions === 0
          ? 100
          : Math.round((attendedCount / totalSessions) * 1000) / 10;
      const attendanceStatus = computeAttendanceStatus(attendanceRate);

      // Assignment completion computation
      const studentDirectAssignments =
        directAssignmentMap.get(studentId) ?? new Set();
      const relevantAssignments = assignments.filter(
        (a) =>
          (a.classId && studentClassIds.has(a.classId)) ||
          studentDirectAssignments.has(a.id),
      );
      const totalAssignments = relevantAssignments.length;
      const submittedSet = submissionLookup.get(studentId) ?? new Set();
      const completedAssignments = relevantAssignments.filter((a) =>
        submittedSet.has(a.id),
      ).length;
      const overdueAssignments = relevantAssignments.filter(
        (a) => a.dueDate && a.dueDate < now && !submittedSet.has(a.id),
      ).length;
      const assignmentCompletionRate =
        totalAssignments === 0
          ? 100
          : Math.round((completedAssignments / totalAssignments) * 1000) / 10;
      const assignmentStatus = computeCompletionStatus(assignmentCompletionRate);

      // Overall health
      const healthStatus = worstStatus(attendanceStatus, assignmentStatus);

      students.push({
        id: studentId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        healthStatus,
        metrics: {
          attendanceRate,
          attendanceStatus,
          totalSessions,
          attendedSessions: attendedCount,
          assignmentCompletionRate,
          assignmentStatus,
          totalAssignments,
          completedAssignments,
          overdueAssignments,
        },
        classes: studentClasses,
      });
    }

    // Step F — Sort: at-risk first, then warning, then on-track; alphabetically within group
    students.sort((a, b) => {
      const statusDiff =
        STATUS_PRIORITY[a.healthStatus] - STATUS_PRIORITY[b.healthStatus];
      if (statusDiff !== 0) return statusDiff;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    const summary = {
      total: students.length,
      atRisk: students.filter((s) => s.healthStatus === "at-risk").length,
      warning: students.filter((s) => s.healthStatus === "warning").length,
      onTrack: students.filter((s) => s.healthStatus === "on-track").length,
    };

    return { students, summary };
  }
}
