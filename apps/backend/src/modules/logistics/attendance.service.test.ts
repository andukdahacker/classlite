import { vi, describe, it, expect, beforeEach } from "vitest";
import { AttendanceService } from "./attendance.service.js";

describe("AttendanceService", () => {
  let attendanceService: AttendanceService;
  let mockPrisma: any;
  let mockTenantedClient: any;
  const centerId = "center-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the tenanted client methods directly
    mockTenantedClient = {
      classSession: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        count: vi.fn(),
      },
      classStudent: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      attendance: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    // Mock base prisma with $extends that returns our tenanted client
    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockTenantedClient),
    };

    attendanceService = new AttendanceService(mockPrisma as any);
  });

  describe("markAttendance", () => {
    const sessionId = "session-123";
    const studentId = "student-456";
    const markedByUserId = "teacher-789";

    it("should create new attendance record for enrolled student", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        classId: "class-1",
        status: "SCHEDULED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);
      mockTenantedClient.classStudent.findUnique.mockResolvedValue({
        classId: "class-1",
        studentId,
      });
      mockTenantedClient.attendance.upsert.mockResolvedValue({
        id: "attendance-1",
        sessionId,
        studentId,
        status: "PRESENT",
        markedBy: markedByUserId,
        centerId,
      });

      const result = await attendanceService.markAttendance(
        centerId,
        sessionId,
        { studentId, status: "PRESENT" },
        markedByUserId
      );

      expect(result.status).toBe("PRESENT");
      expect(mockTenantedClient.attendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId_studentId: { sessionId, studentId } },
          create: expect.objectContaining({
            sessionId,
            studentId,
            status: "PRESENT",
            markedBy: markedByUserId,
            centerId,
          }),
          update: expect.objectContaining({
            status: "PRESENT",
            markedBy: markedByUserId,
          }),
        })
      );
    });

    it("should update existing attendance record (upsert behavior)", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "COMPLETED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);
      mockTenantedClient.classStudent.findUnique.mockResolvedValue({
        classId: "class-1",
        studentId,
      });
      mockTenantedClient.attendance.upsert.mockResolvedValue({
        id: "attendance-1",
        sessionId,
        studentId,
        status: "LATE",
        markedBy: markedByUserId,
        centerId,
      });

      const result = await attendanceService.markAttendance(
        centerId,
        sessionId,
        { studentId, status: "LATE" },
        markedByUserId
      );

      expect(result.status).toBe("LATE");
    });

    it("should reject non-enrolled student with error", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "SCHEDULED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);
      mockTenantedClient.classStudent.findUnique.mockResolvedValue(null); // Not enrolled

      await expect(
        attendanceService.markAttendance(
          centerId,
          sessionId,
          { studentId, status: "PRESENT" },
          markedByUserId
        )
      ).rejects.toThrow("Student is not enrolled in this class");
    });

    it("should reject future session with error", async () => {
      const mockSession = {
        startTime: new Date(Date.now() + 3600000), // 1 hour in future
        classId: "class-1",
        status: "SCHEDULED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);

      await expect(
        attendanceService.markAttendance(
          centerId,
          sessionId,
          { studentId, status: "PRESENT" },
          markedByUserId
        )
      ).rejects.toThrow("Cannot mark attendance for future sessions");
    });

    it("should reject cancelled session with error", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "CANCELLED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);

      await expect(
        attendanceService.markAttendance(
          centerId,
          sessionId,
          { studentId, status: "PRESENT" },
          markedByUserId
        )
      ).rejects.toThrow("Cannot mark attendance for cancelled sessions");
    });

    it("should reject when session not found", async () => {
      mockTenantedClient.classSession.findUnique.mockResolvedValue(null);

      await expect(
        attendanceService.markAttendance(
          centerId,
          sessionId,
          { studentId, status: "PRESENT" },
          markedByUserId
        )
      ).rejects.toThrow("Session not found");
    });
  });

  describe("markBulkAttendance", () => {
    const sessionId = "session-123";
    const markedByUserId = "teacher-789";

    it("should mark all enrolled students atomically", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "SCHEDULED",
      };

      const enrolledStudents = [
        { studentId: "student-1" },
        { studentId: "student-2" },
        { studentId: "student-3" },
      ];

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);
      mockTenantedClient.classStudent.findMany.mockResolvedValue(enrolledStudents);
      mockTenantedClient.$transaction.mockImplementation(async (callback: Function) => {
        // Simulate transaction with mock tx client
        const mockTx = {
          attendance: {
            upsert: vi.fn().mockResolvedValue({ id: "att-1" }),
          },
        };
        await callback(mockTx);
      });

      const result = await attendanceService.markBulkAttendance(
        centerId,
        sessionId,
        { status: "PRESENT" },
        markedByUserId
      );

      expect(result.count).toBe(3);
      expect(result.markedStudents).toEqual(["student-1", "student-2", "student-3"]);
      expect(mockTenantedClient.$transaction).toHaveBeenCalled();
    });

    it("should respect 500 student limit", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "SCHEDULED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);
      mockTenantedClient.classStudent.findMany.mockResolvedValue([]);

      await attendanceService.markBulkAttendance(
        centerId,
        sessionId,
        { status: "PRESENT" },
        markedByUserId
      );

      expect(mockTenantedClient.classStudent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 500 })
      );
    });

    it("should return empty result when no students enrolled", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "SCHEDULED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);
      mockTenantedClient.classStudent.findMany.mockResolvedValue([]);

      const result = await attendanceService.markBulkAttendance(
        centerId,
        sessionId,
        { status: "PRESENT" },
        markedByUserId
      );

      expect(result.count).toBe(0);
      expect(result.markedStudents).toEqual([]);
    });

    it("should reject future session", async () => {
      const mockSession = {
        startTime: new Date(Date.now() + 3600000),
        classId: "class-1",
        status: "SCHEDULED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);

      await expect(
        attendanceService.markBulkAttendance(
          centerId,
          sessionId,
          { status: "PRESENT" },
          markedByUserId
        )
      ).rejects.toThrow("Cannot mark attendance for future sessions");
    });

    it("should reject cancelled session", async () => {
      const mockSession = {
        startTime: new Date(Date.now() - 3600000),
        classId: "class-1",
        status: "CANCELLED",
      };

      mockTenantedClient.classSession.findUnique.mockResolvedValue(mockSession);

      await expect(
        attendanceService.markBulkAttendance(
          centerId,
          sessionId,
          { status: "PRESENT" },
          markedByUserId
        )
      ).rejects.toThrow("Cannot mark attendance for cancelled sessions");
    });
  });

  describe("getSessionAttendance", () => {
    const sessionId = "session-123";

    it("should return students with attendance status", async () => {
      const mockSession = {
        id: sessionId,
        startTime: new Date("2026-02-01T09:00:00Z"),
        endTime: new Date("2026-02-01T10:00:00Z"),
        status: "COMPLETED",
        class: {
          name: "Math 101",
          course: { name: "Mathematics", color: "#FF0000" },
          students: [
            {
              studentId: "student-1",
              student: { id: "student-1", name: "Alice", email: "alice@test.com", avatarUrl: null },
            },
            {
              studentId: "student-2",
              student: { id: "student-2", name: "Bob", email: "bob@test.com", avatarUrl: null },
            },
          ],
        },
        attendance: [
          { studentId: "student-1", status: "PRESENT", updatedAt: new Date() },
        ],
      };

      mockTenantedClient.classSession.findUniqueOrThrow.mockResolvedValue(mockSession);

      const result = await attendanceService.getSessionAttendance(centerId, sessionId);

      expect(result.session.id).toBe(sessionId);
      expect(result.session.class.name).toBe("Math 101");
      expect(result.students).toHaveLength(2);

      const alice = result.students.find((s) => s.id === "student-1");
      expect(alice?.attendance?.status).toBe("PRESENT");

      const bob = result.students.find((s) => s.id === "student-2");
      expect(bob?.attendance).toBeNull();
    });

    it("should sort students alphabetically by name", async () => {
      mockTenantedClient.classSession.findUniqueOrThrow.mockResolvedValue({
        id: sessionId,
        startTime: new Date(),
        endTime: new Date(),
        status: "SCHEDULED",
        class: {
          name: "Class",
          course: { name: "Course", color: null },
          students: [],
        },
        attendance: [],
      });

      await attendanceService.getSessionAttendance(centerId, sessionId);

      expect(mockTenantedClient.classSession.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            class: expect.objectContaining({
              include: expect.objectContaining({
                students: expect.objectContaining({
                  orderBy: { student: { name: "asc" } },
                }),
              }),
            }),
          }),
        })
      );
    });
  });

  describe("getStudentAttendanceStats", () => {
    const studentId = "student-123";

    it("should calculate attendance percentage correctly", async () => {
      mockTenantedClient.classStudent.findMany.mockResolvedValue([
        { classId: "class-1" },
        { classId: "class-2" },
      ]);

      // 10 total sessions
      mockTenantedClient.classSession.count.mockResolvedValue(10);

      // 7 present, 1 late, 1 excused, 1 absent = 9 attended (90%)
      mockTenantedClient.attendance.findMany.mockResolvedValue([
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "LATE" },
        { status: "EXCUSED" },
        { status: "ABSENT" },
      ]);

      const result = await attendanceService.getStudentAttendanceStats(centerId, studentId);

      expect(result.totalSessions).toBe(10);
      expect(result.presentCount).toBe(7);
      expect(result.lateCount).toBe(1);
      expect(result.excusedCount).toBe(1);
      expect(result.absentCount).toBe(1);
      // (7 + 1 + 1) / 10 * 100 = 90%
      expect(result.attendancePercentage).toBe(90);
    });

    it("should return zeros when student has no enrollments", async () => {
      mockTenantedClient.classStudent.findMany.mockResolvedValue([]);

      const result = await attendanceService.getStudentAttendanceStats(centerId, studentId);

      expect(result.attendancePercentage).toBe(0);
      expect(result.totalSessions).toBe(0);
      expect(result.presentCount).toBe(0);
    });

    it("should filter by date range when provided", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-01-31");

      mockTenantedClient.classStudent.findMany.mockResolvedValue([{ classId: "class-1" }]);
      mockTenantedClient.classSession.count.mockResolvedValue(5);
      mockTenantedClient.attendance.findMany.mockResolvedValue([
        { status: "PRESENT" },
        { status: "PRESENT" },
        { status: "PRESENT" },
      ]);

      await attendanceService.getStudentAttendanceStats(
        centerId,
        studentId,
        startDate,
        endDate
      );

      expect(mockTenantedClient.classSession.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({
              gte: startDate,
            }),
          }),
        })
      );
    });

    it("should only count past sessions (not future)", async () => {
      mockTenantedClient.classStudent.findMany.mockResolvedValue([{ classId: "class-1" }]);
      mockTenantedClient.classSession.count.mockResolvedValue(3);
      mockTenantedClient.attendance.findMany.mockResolvedValue([]);

      await attendanceService.getStudentAttendanceStats(centerId, studentId);

      expect(mockTenantedClient.classSession.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe("getStudentAttendanceHistory", () => {
    const studentId = "student-123";

    it("should return attendance records with session details", async () => {
      const mockRecords = [
        {
          id: "att-1",
          sessionId: "session-1",
          studentId,
          status: "PRESENT",
          markedBy: "teacher-1",
          centerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          session: {
            id: "session-1",
            startTime: new Date("2026-02-01T09:00:00Z"),
            class: {
              name: "Math 101",
              course: { name: "Mathematics" },
            },
          },
        },
      ];

      mockTenantedClient.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await attendanceService.getStudentAttendanceHistory(centerId, studentId);

      expect(result).toHaveLength(1);
      expect(result[0].session.class.name).toBe("Math 101");
    });

    it("should order by session start time descending", async () => {
      mockTenantedClient.attendance.findMany.mockResolvedValue([]);

      await attendanceService.getStudentAttendanceHistory(centerId, studentId);

      expect(mockTenantedClient.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { session: { startTime: "desc" } },
        })
      );
    });
  });

  describe("getClassAttendanceStats", () => {
    const classId = "class-123";

    it("should calculate average attendance percentage for class", async () => {
      mockTenantedClient.classStudent.count.mockResolvedValue(5); // 5 students
      mockTenantedClient.classSession.count.mockResolvedValue(4); // 4 sessions
      // 5 students * 4 sessions = 20 expected, 15 attended = 75%
      mockTenantedClient.attendance.count.mockResolvedValue(15);

      const result = await attendanceService.getClassAttendanceStats(centerId, classId);

      expect(result.totalStudents).toBe(5);
      expect(result.totalSessions).toBe(4);
      expect(result.averageAttendancePercentage).toBe(75);
    });

    it("should return zero percentage when no students", async () => {
      mockTenantedClient.classStudent.count.mockResolvedValue(0);
      mockTenantedClient.classSession.count.mockResolvedValue(5);

      const result = await attendanceService.getClassAttendanceStats(centerId, classId);

      expect(result.averageAttendancePercentage).toBe(0);
    });

    it("should return zero percentage when no sessions", async () => {
      mockTenantedClient.classStudent.count.mockResolvedValue(5);
      mockTenantedClient.classSession.count.mockResolvedValue(0);

      const result = await attendanceService.getClassAttendanceStats(centerId, classId);

      expect(result.averageAttendancePercentage).toBe(0);
    });

    it("should only count attended statuses (present, late, excused)", async () => {
      mockTenantedClient.classStudent.count.mockResolvedValue(2);
      mockTenantedClient.classSession.count.mockResolvedValue(2);
      mockTenantedClient.attendance.count.mockResolvedValue(3);

      await attendanceService.getClassAttendanceStats(centerId, classId);

      expect(mockTenantedClient.attendance.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["PRESENT", "LATE", "EXCUSED"] },
          }),
        })
      );
    });
  });

  describe("tenant isolation", () => {
    it("should use tenanted client with correct centerId", async () => {
      const differentCenterId = "center-different";

      mockTenantedClient.classSession.findUniqueOrThrow.mockResolvedValue({
        id: "session-1",
        startTime: new Date(),
        endTime: new Date(),
        status: "SCHEDULED",
        class: {
          name: "Class",
          course: { name: "Course", color: null },
          students: [],
        },
        attendance: [],
      });

      await attendanceService.getSessionAttendance(differentCenterId, "session-1");

      // Verify $extends was called (which creates tenanted client)
      expect(mockPrisma.$extends).toHaveBeenCalled();
    });
  });
});
