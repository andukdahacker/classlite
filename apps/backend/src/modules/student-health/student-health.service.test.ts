import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentHealthService } from "./student-health.service.js";

describe("StudentHealthService", () => {
  let service: StudentHealthService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  const makeStudent = (id: string, name: string) => ({
    user: { id, name, email: `${id}@test.com`, avatarUrl: null },
    id: `membership-${id}`,
    centerId: "center-1",
    userId: id,
    role: "STUDENT",
    status: "ACTIVE",
  });

  const makeEnrollment = (
    studentId: string,
    classId: string,
    className: string,
  ) => ({
    classId,
    studentId,
    centerId: "center-1",
    class: { id: classId, name: className },
  });

  const makeSession = (id: string, classId: string) => ({
    id,
    classId,
  });

  const makeAttendance = (
    studentId: string,
    sessionId: string,
    status: string,
  ) => ({
    studentId,
    sessionId,
    status,
  });

  const makeAssignment = (
    id: string,
    classId: string | null,
    dueDate?: Date,
  ) => ({
    id,
    classId,
    dueDate: dueDate ?? null,
  });

  const makeSubmission = (studentId: string, assignmentId: string) => ({
    studentId,
    assignmentId,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      centerMembership: { findMany: vi.fn().mockResolvedValue([]) },
      classStudent: { findMany: vi.fn().mockResolvedValue([]) },
      classSession: { findMany: vi.fn().mockResolvedValue([]) },
      attendance: { findMany: vi.fn().mockResolvedValue([]) },
      assignment: { findMany: vi.fn().mockResolvedValue([]) },
      assignmentStudent: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockDb),
      submission: { findMany: vi.fn().mockResolvedValue([]) },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new StudentHealthService(mockPrisma as any);
  });

  describe("Attendance thresholds", () => {
    it("should return at-risk when attendance < 80%", async () => {
      const student = makeStudent("s1", "Alice");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      // 7 sessions, 5 attended = 71.4%
      mockDb.classSession.findMany.mockResolvedValue(
        Array.from({ length: 7 }, (_, i) => makeSession(`ses-${i}`, "c1")),
      );
      mockDb.attendance.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) =>
          makeAttendance("s1", `ses-${i}`, "PRESENT"),
        ),
      );

      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].metrics.attendanceStatus).toBe("at-risk");
    });

    it("should return warning when attendance is 80-90%", async () => {
      const student = makeStudent("s1", "Bob");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      // 10 sessions, 8 attended = 80%
      mockDb.classSession.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeSession(`ses-${i}`, "c1")),
      );
      mockDb.attendance.findMany.mockResolvedValue(
        Array.from({ length: 8 }, (_, i) =>
          makeAttendance("s1", `ses-${i}`, "PRESENT"),
        ),
      );

      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].metrics.attendanceStatus).toBe("warning");
    });

    it("should return on-track when attendance > 90%", async () => {
      const student = makeStudent("s1", "Charlie");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      // 10 sessions, 10 attended = 100%
      mockDb.classSession.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeSession(`ses-${i}`, "c1")),
      );
      mockDb.attendance.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) =>
          makeAttendance("s1", `ses-${i}`, "PRESENT"),
        ),
      );

      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].metrics.attendanceStatus).toBe("on-track");
    });
  });

  describe("Assignment completion thresholds", () => {
    it("should return at-risk when completion < 50%", async () => {
      const student = makeStudent("s1", "Alice");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      mockDb.assignment.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeAssignment(`a-${i}`, "c1")),
      );
      // 4/10 = 40%
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue(
        Array.from({ length: 4 }, (_, i) => makeSubmission("s1", `a-${i}`)),
      );

      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].metrics.assignmentStatus).toBe("at-risk");
    });

    it("should return warning when completion is 50-75%", async () => {
      const student = makeStudent("s1", "Bob");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      mockDb.assignment.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeAssignment(`a-${i}`, "c1")),
      );
      // 6/10 = 60%
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue(
        Array.from({ length: 6 }, (_, i) => makeSubmission("s1", `a-${i}`)),
      );

      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].metrics.assignmentStatus).toBe("warning");
    });

    it("should return on-track when completion > 75%", async () => {
      const student = makeStudent("s1", "Charlie");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      mockDb.assignment.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeAssignment(`a-${i}`, "c1")),
      );
      // 8/10 = 80%
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue(
        Array.from({ length: 8 }, (_, i) => makeSubmission("s1", `a-${i}`)),
      );

      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].metrics.assignmentStatus).toBe("on-track");
    });
  });

  describe("Overall status (worst of both)", () => {
    const setupStudentWithMetrics = (
      attendanceCount: number,
      totalSessions: number,
      completedAssignments: number,
      totalAssignments: number,
    ) => {
      const student = makeStudent("s1", "Alice");
      mockDb.centerMembership.findMany.mockResolvedValue([student]);
      mockDb.classStudent.findMany.mockResolvedValue([
        makeEnrollment("s1", "c1", "Class A"),
      ]);
      mockDb.classSession.findMany.mockResolvedValue(
        Array.from({ length: totalSessions }, (_, i) =>
          makeSession(`ses-${i}`, "c1"),
        ),
      );
      mockDb.attendance.findMany.mockResolvedValue(
        Array.from({ length: attendanceCount }, (_, i) =>
          makeAttendance("s1", `ses-${i}`, "PRESENT"),
        ),
      );
      mockDb.assignment.findMany.mockResolvedValue(
        Array.from({ length: totalAssignments }, (_, i) =>
          makeAssignment(`a-${i}`, "c1"),
        ),
      );
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue(
        Array.from({ length: completedAssignments }, (_, i) =>
          makeSubmission("s1", `a-${i}`),
        ),
      );
    };

    it("should return at-risk when attendance is red and assignments green", async () => {
      // attendance: 5/10=50% (at-risk), assignments: 8/10=80% (on-track)
      setupStudentWithMetrics(5, 10, 8, 10);
      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].healthStatus).toBe("at-risk");
    });

    it("should return warning when attendance is green and assignments yellow", async () => {
      // attendance: 10/10=100% (on-track), assignments: 6/10=60% (warning)
      setupStudentWithMetrics(10, 10, 6, 10);
      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].healthStatus).toBe("warning");
    });

    it("should return on-track when both metrics are green", async () => {
      // attendance: 10/10=100% (on-track), assignments: 8/10=80% (on-track)
      setupStudentWithMetrics(10, 10, 8, 10);
      const result = await service.getDashboard("center-1", {});
      expect(result.students[0].healthStatus).toBe("on-track");
    });
  });

  it("should default to on-track when no data exists", async () => {
    const student = makeStudent("s1", "Alice");
    mockDb.centerMembership.findMany.mockResolvedValue([student]);

    const result = await service.getDashboard("center-1", {});
    expect(result.students[0].healthStatus).toBe("on-track");
    expect(result.students[0].metrics.attendanceRate).toBe(100);
    expect(result.students[0].metrics.assignmentCompletionRate).toBe(100);
  });

  it("should filter students by classId", async () => {
    const s1 = makeStudent("s1", "Alice");
    const s2 = makeStudent("s2", "Bob");
    mockDb.centerMembership.findMany.mockResolvedValue([s1, s2]);
    // Only s1 is enrolled in c1
    mockDb.classStudent.findMany.mockResolvedValue([
      makeEnrollment("s1", "c1", "Class A"),
    ]);

    const result = await service.getDashboard("center-1", { classId: "c1" });
    expect(result.students).toHaveLength(1);
    expect(result.students[0].id).toBe("s1");
  });

  it("should filter students by search name", async () => {
    const student = makeStudent("s1", "Alice");
    mockDb.centerMembership.findMany.mockResolvedValue([student]);

    await service.getDashboard("center-1", { search: "Alice" });

    expect(mockDb.centerMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { name: { contains: "Alice", mode: "insensitive" } },
        }),
      }),
    );
  });

  it("should compute correct summary counts", async () => {
    const s1 = makeStudent("s1", "Alice");
    const s2 = makeStudent("s2", "Bob");
    const s3 = makeStudent("s3", "Charlie");
    mockDb.centerMembership.findMany.mockResolvedValue([s1, s2, s3]);
    mockDb.classStudent.findMany.mockResolvedValue([
      makeEnrollment("s1", "c1", "Class A"),
      makeEnrollment("s2", "c1", "Class A"),
      makeEnrollment("s3", "c1", "Class A"),
    ]);

    // s1: 5/10 sessions = 50% (at-risk)
    // s2: 8/10 sessions = 80% (warning)
    // s3: 10/10 sessions = 100% (on-track)
    mockDb.classSession.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => makeSession(`ses-${i}`, "c1")),
    );
    mockDb.attendance.findMany.mockResolvedValue([
      ...Array.from({ length: 5 }, (_, i) =>
        makeAttendance("s1", `ses-${i}`, "PRESENT"),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        makeAttendance("s2", `ses-${i}`, "PRESENT"),
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeAttendance("s3", `ses-${i}`, "PRESENT"),
      ),
    ]);

    const result = await service.getDashboard("center-1", {});
    expect(result.summary).toEqual({
      total: 3,
      atRisk: 1,
      warning: 1,
      onTrack: 1,
    });
  });

  describe("getStudentProfile", () => {
    const centerId = "center-1";
    const studentId = "s1";

    const mockMembership = {
      id: "membership-s1",
      centerId,
      userId: studentId,
      role: "STUDENT",
      status: "ACTIVE",
      user: {
        id: studentId,
        name: "Alice Smith",
        email: "alice@test.com",
        avatarUrl: null,
      },
    };

    const setupProfileMocks = () => {
      mockDb.centerMembership.findFirst = vi
        .fn()
        .mockResolvedValue(mockMembership);
      mockDb.classStudent.findMany.mockResolvedValue([
        {
          classId: "c1",
          studentId,
          class: { id: "c1", name: "IELTS A" },
        },
      ]);
      mockDb.classSession.findMany.mockResolvedValue([]);
      mockDb.attendance.findMany.mockResolvedValue([]);
      mockDb.assignment.findMany.mockResolvedValue([]);
      mockDb.assignmentStudent.findMany.mockResolvedValue([]);
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue([]);
    };

    it("should return correct student data", async () => {
      setupProfileMocks();
      const result = await service.getStudentProfile(centerId, studentId);
      expect(result.student.id).toBe(studentId);
      expect(result.student.name).toBe("Alice Smith");
      expect(result.student.email).toBe("alice@test.com");
      expect(result.student.classes).toHaveLength(1);
      expect(result.student.classes[0].name).toBe("IELTS A");
    });

    it("should return attendance history sorted by date desc", async () => {
      setupProfileMocks();
      const jan1 = new Date("2026-01-01T10:00:00Z");
      const jan2 = new Date("2026-01-02T10:00:00Z");
      const jan3 = new Date("2026-01-03T10:00:00Z");
      mockDb.classSession.findMany.mockResolvedValue([
        { id: "ses-1", classId: "c1", startTime: jan1 },
        { id: "ses-2", classId: "c1", startTime: jan2 },
        { id: "ses-3", classId: "c1", startTime: jan3 },
      ]);
      mockDb.attendance.findMany.mockResolvedValue([
        { sessionId: "ses-1", status: "PRESENT" },
        { sessionId: "ses-3", status: "LATE" },
      ]);

      const result = await service.getStudentProfile(centerId, studentId);
      expect(result.attendanceHistory).toHaveLength(3);
      // Most recent first
      expect(result.attendanceHistory[0].sessionId).toBe("ses-3");
      expect(result.attendanceHistory[1].sessionId).toBe("ses-2");
      expect(result.attendanceHistory[2].sessionId).toBe("ses-1");
    });

    it("should return assignment history with scores from feedback", async () => {
      setupProfileMocks();
      const dueDate = new Date("2026-02-01");
      mockDb.assignment.findMany.mockResolvedValue([
        {
          id: "a1",
          classId: "c1",
          dueDate,
          status: "OPEN",
          exercise: { title: "Reading Task 1", skill: "reading" },
          class: { name: "IELTS A" },
        },
      ]);
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue([
        {
          assignmentId: "a1",
          status: "GRADED",
          submittedAt: new Date("2026-01-30"),
          feedback: { overallScore: 7.0, teacherFinalScore: 7.5 },
        },
      ]);

      const result = await service.getStudentProfile(centerId, studentId);
      expect(result.assignmentHistory).toHaveLength(1);
      expect(result.assignmentHistory[0].exerciseTitle).toBe("Reading Task 1");
      expect(result.assignmentHistory[0].submissionStatus).toBe("graded");
      // teacherFinalScore takes precedence
      expect(result.assignmentHistory[0].score).toBe(7.5);
    });

    it("should compute weekly trends for last 8 weeks", async () => {
      setupProfileMocks();
      const result = await service.getStudentProfile(centerId, studentId);
      expect(result.weeklyTrends).toHaveLength(8);
      // Sorted chronologically (oldest first)
      const firstWeek = new Date(result.weeklyTrends[0].weekStart);
      const lastWeek = new Date(result.weeklyTrends[7].weekStart);
      expect(firstWeek.getTime()).toBeLessThan(lastWeek.getTime());
    });

    it("should throw 404 for non-existent student", async () => {
      mockDb.centerMembership.findFirst = vi.fn().mockResolvedValue(null);

      await expect(
        service.getStudentProfile(centerId, "non-existent"),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Student not found",
      });
    });

    it("should throw 404 for student in different center", async () => {
      // Student not found in the given center
      mockDb.centerMembership.findFirst = vi.fn().mockResolvedValue(null);

      await expect(
        service.getStudentProfile("different-center", studentId),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Student not found",
      });
    });

    it("should mark sessions with no attendance record as ABSENT", async () => {
      setupProfileMocks();
      const sessionDate = new Date("2026-01-15T10:00:00Z");
      mockDb.classSession.findMany.mockResolvedValue([
        { id: "ses-no-record", classId: "c1", startTime: sessionDate },
      ]);
      mockDb.attendance.findMany.mockResolvedValue([]); // No records

      const result = await service.getStudentProfile(centerId, studentId);
      expect(result.attendanceHistory).toHaveLength(1);
      expect(result.attendanceHistory[0].status).toBe("ABSENT");
    });

    it("should return not-submitted for assignments without submissions", async () => {
      setupProfileMocks();
      mockDb.assignment.findMany.mockResolvedValue([
        {
          id: "a1",
          classId: "c1",
          dueDate: new Date("2026-02-01"),
          status: "OPEN",
          exercise: { title: "Writing Task 1", skill: "writing" },
          class: { name: "IELTS A" },
        },
      ]);
      // No submissions
      const mockPrisma = (service as any).prisma;
      mockPrisma.submission.findMany.mockResolvedValue([]);

      const result = await service.getStudentProfile(centerId, studentId);
      expect(result.assignmentHistory).toHaveLength(1);
      expect(result.assignmentHistory[0].submissionStatus).toBe(
        "not-submitted",
      );
      expect(result.assignmentHistory[0].score).toBeNull();
    });
  });

  it("should query only ACTIVE students, excluding deactivated", async () => {
    // The service filters at the database query level via status: 'ACTIVE'.
    // Only active students are returned by the query; deactivated users
    // are never fetched, so they never appear in results.
    const active = makeStudent("s1", "Alice");
    mockDb.centerMembership.findMany.mockResolvedValue([active]);

    const result = await service.getDashboard("center-1", {});
    expect(result.students).toHaveLength(1);
    expect(result.students[0].id).toBe("s1");

    // Verify the query filters by both STUDENT role and ACTIVE status
    expect(mockDb.centerMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "STUDENT",
          status: "ACTIVE",
        }),
      }),
    );
  });
});
