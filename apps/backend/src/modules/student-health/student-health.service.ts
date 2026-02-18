import { PrismaClient, getTenantedClient } from "@workspace/db";
import type {
  HealthStatus,
  StudentHealthCard,
  StudentHealthDashboardResponse,
  StudentProfileResponse,
} from "@workspace/types";
import { AppError } from "../../errors/app-error.js";

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

  async getStudentProfile(
    centerId: string,
    studentId: string,
  ): Promise<StudentProfileResponse> {
    const db = getTenantedClient(this.prisma, centerId);
    const now = new Date();

    // Step A — Validate student exists and belongs to center
    const membership = await db.centerMembership.findFirst({
      where: {
        userId: studentId,
        role: "STUDENT",
        status: "ACTIVE",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
    if (!membership) {
      throw AppError.notFound("Student not found");
    }
    const user = membership.user;

    // Step B — Get enrollment data
    const enrollments = await db.classStudent.findMany({
      where: { studentId },
      include: {
        class: { select: { id: true, name: true } },
      },
    });
    const classes = enrollments.map((e) => ({
      id: e.class.id,
      name: e.class.name,
    }));
    const classIds = classes.map((c) => c.id);

    // Build class name lookup
    const classNameMap = new Map<string, string>();
    for (const c of classes) {
      classNameMap.set(c.id, c.name);
    }

    // Step C — Compute health metrics
    const [allSessions, attendanceRecords] = await Promise.all([
      db.classSession.findMany({
        where: {
          classId: { in: classIds },
          startTime: { lte: now },
          status: { not: "CANCELLED" },
        },
        select: { id: true, classId: true, startTime: true },
      }),
      db.attendance.findMany({
        where: { studentId },
        select: { sessionId: true, status: true },
      }),
    ]);

    const attendanceMap = new Map<string, string>();
    for (const a of attendanceRecords) {
      attendanceMap.set(a.sessionId, a.status);
    }

    const attendedCount = allSessions.filter((s) => {
      const status = attendanceMap.get(s.id);
      return status === "PRESENT" || status === "LATE" || status === "EXCUSED";
    }).length;
    const totalSessions = allSessions.length;
    const attendanceRate =
      totalSessions === 0
        ? 100
        : Math.round((attendedCount / totalSessions) * 1000) / 10;
    const attendanceStatus = computeAttendanceStatus(attendanceRate);

    // Step D+E — Fetch assignments and submissions
    const [allAssignments, directAssignments, submissions] = await Promise.all([
      db.assignment.findMany({
        where: {
          status: { in: ["OPEN", "CLOSED", "ARCHIVED"] },
        },
        include: {
          exercise: { select: { title: true, skill: true } },
          class: { select: { name: true } },
        },
      }),
      db.assignmentStudent.findMany({
        where: { studentId },
        select: { assignmentId: true },
      }),
      this.prisma.submission.findMany({
        where: { centerId, studentId },
        include: {
          feedback: {
            select: { overallScore: true, teacherFinalScore: true },
          },
        },
      }),
    ]);

    const directAssignmentIds = new Set(
      directAssignments.map((a) => a.assignmentId),
    );
    const classIdSet = new Set(classIds);

    const relevantAssignments = allAssignments.filter(
      (a) =>
        (a.classId && classIdSet.has(a.classId)) ||
        directAssignmentIds.has(a.id),
    );

    const submissionMap = new Map<
      string,
      {
        status: string;
        submittedAt: Date | null;
        feedback: {
          overallScore: number | null;
          teacherFinalScore: number | null;
        } | null;
      }
    >();
    for (const s of submissions) {
      submissionMap.set(s.assignmentId, {
        status: s.status,
        submittedAt: s.submittedAt,
        feedback: s.feedback,
      });
    }

    const completedAssignments = relevantAssignments.filter((a) => {
      const sub = submissionMap.get(a.id);
      return (
        sub &&
        (sub.status === "SUBMITTED" ||
          sub.status === "AI_PROCESSING" ||
          sub.status === "GRADED")
      );
    }).length;
    const totalAssignments = relevantAssignments.length;
    const overdueAssignments = relevantAssignments.filter((a) => {
      const sub = submissionMap.get(a.id);
      const hasCompletedSubmission =
        sub &&
        (sub.status === "SUBMITTED" ||
          sub.status === "AI_PROCESSING" ||
          sub.status === "GRADED");
      return a.dueDate && a.dueDate < now && !hasCompletedSubmission;
    }).length;
    const assignmentCompletionRate =
      totalAssignments === 0
        ? 100
        : Math.round((completedAssignments / totalAssignments) * 1000) / 10;
    const assignmentStatus = computeCompletionStatus(assignmentCompletionRate);
    const healthStatus = worstStatus(attendanceStatus, assignmentStatus);

    // Step D — Build attendance history (last 30 sessions)
    const recentSessions = [...allSessions]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 30);

    const attendanceHistory = recentSessions.map((session) => ({
      sessionId: session.id,
      className: classNameMap.get(session.classId) ?? "Unknown",
      date: session.startTime.toISOString(),
      status: (attendanceMap.get(session.id) ?? "ABSENT") as
        | "PRESENT"
        | "ABSENT"
        | "LATE"
        | "EXCUSED",
    }));

    // Step E — Build assignment history
    const assignmentHistory = relevantAssignments
      .map((a) => {
        const sub = submissionMap.get(a.id);
        let submissionStatus: "not-submitted" | "in-progress" | "submitted" | "graded";
        if (!sub) {
          submissionStatus = "not-submitted";
        } else if (sub.status === "IN_PROGRESS") {
          submissionStatus = "in-progress";
        } else if (
          sub.status === "SUBMITTED" ||
          sub.status === "AI_PROCESSING"
        ) {
          submissionStatus = "submitted";
        } else if (sub.status === "GRADED") {
          submissionStatus = "graded";
        } else {
          submissionStatus = "not-submitted";
        }

        return {
          assignmentId: a.id,
          exerciseTitle: a.exercise.title,
          className: a.class?.name ?? "Individual",
          skill: a.exercise.skill ?? null,
          dueDate: a.dueDate ? a.dueDate.toISOString() : "",
          submissionStatus,
          score:
            sub?.feedback?.teacherFinalScore ??
            sub?.feedback?.overallScore ??
            null,
          submittedAt: sub?.submittedAt?.toISOString() ?? null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      );

    // Step F — Compute weekly trends (last 8 weeks)
    const weeklyTrends = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(
        weekStart.getDate() - weekStart.getDay() - 7 * i + 1,
      ); // Monday
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekLabel = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const weekSessions = allSessions.filter(
        (s) => s.startTime >= weekStart && s.startTime < weekEnd,
      );
      const weekAttended = weekSessions.filter((s) => {
        const status = attendanceMap.get(s.id);
        return (
          status === "PRESENT" || status === "LATE" || status === "EXCUSED"
        );
      }).length;
      const weekAttendanceRate =
        weekSessions.length === 0
          ? 100
          : Math.round((weekAttended / weekSessions.length) * 1000) / 10;

      const weekAssignments = relevantAssignments.filter((a) => {
        if (!a.dueDate) return false;
        return a.dueDate >= weekStart && a.dueDate < weekEnd;
      });
      const weekCompleted = weekAssignments.filter((a) => {
        const sub = submissionMap.get(a.id);
        return (
          sub &&
          (sub.status === "SUBMITTED" ||
            sub.status === "AI_PROCESSING" ||
            sub.status === "GRADED")
        );
      }).length;
      const weekCompletionRate =
        weekAssignments.length === 0
          ? 100
          : Math.round((weekCompleted / weekAssignments.length) * 1000) / 10;

      weeklyTrends.push({
        weekStart: weekStart.toISOString(),
        weekLabel,
        attendanceRate: weekAttendanceRate,
        completionRate: weekCompletionRate,
      });
    }

    // Step G — Build response
    return {
      student: {
        id: user.id,
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
        classes,
      },
      attendanceHistory,
      assignmentHistory,
      weeklyTrends,
    };
  }
}
