import { vi, describe, it, expect, beforeEach } from "vitest";
import { SessionsService } from "./sessions.service.js";

describe("SessionsService", () => {
  let sessionsService: SessionsService;
  let mockPrisma: any;
  let mockTenantedClient: any;
  const centerId = "center-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the tenanted client methods directly
    mockTenantedClient = {
      classSession: {
        findMany: vi.fn().mockResolvedValue([]),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      class: {
        findUniqueOrThrow: vi.fn(),
      },
      classSchedule: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    // Mock base prisma with $extends that returns our tenanted client
    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockTenantedClient),
    };

    sessionsService = new SessionsService(mockPrisma as any);
  });

  describe("listSessions", () => {
    it("should list sessions within date range", async () => {
      const startDate = new Date("2026-01-20");
      const endDate = new Date("2026-01-26");
      const mockSessions = [
        { id: "s1", classId: "c1", startTime: new Date("2026-01-21T09:00:00Z") },
        { id: "s2", classId: "c1", startTime: new Date("2026-01-22T09:00:00Z") },
      ];
      mockTenantedClient.classSession.findMany.mockResolvedValue(mockSessions);

      const result = await sessionsService.listSessions(centerId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: { gte: startDate },
            endTime: { lte: endDate },
          }),
        }),
      );
    });

    it("should filter by classId when provided", async () => {
      const startDate = new Date("2026-01-20");
      const endDate = new Date("2026-01-26");
      const classId = "class-456";

      await sessionsService.listSessions(centerId, startDate, endDate, classId);

      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ classId }),
        }),
      );
    });

    it("should include class, course, teacher, and student count relations", async () => {
      const startDate = new Date("2026-01-20");
      const endDate = new Date("2026-01-26");

      await sessionsService.listSessions(centerId, startDate, endDate);

      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            class: expect.objectContaining({
              include: expect.objectContaining({
                course: true,
                teacher: { select: { id: true, name: true } },
                _count: { select: { students: true } },
              }),
            }),
          }),
        }),
      );
    });
  });

  describe("createSession", () => {
    it("should verify class exists before creating session", async () => {
      const input = {
        classId: "class-456",
        startTime: new Date("2026-01-20T09:00:00Z"),
        endTime: new Date("2026-01-20T10:00:00Z"),
      };

      mockTenantedClient.class.findUniqueOrThrow.mockResolvedValue({ id: "class-456" });
      mockTenantedClient.classSession.create.mockResolvedValue({
        id: "session-1",
        ...input,
        centerId,
        status: "SCHEDULED",
      });

      await sessionsService.createSession(centerId, input);

      expect(mockTenantedClient.class.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: input.classId },
      });
    });

    it("should create session with provided data and centerId", async () => {
      const input = {
        classId: "class-456",
        startTime: new Date("2026-01-20T09:00:00Z"),
        endTime: new Date("2026-01-20T10:00:00Z"),
        roomName: "Room A",
      };

      mockTenantedClient.class.findUniqueOrThrow.mockResolvedValue({ id: "class-456" });
      mockTenantedClient.classSession.create.mockResolvedValue({
        id: "session-1",
        ...input,
        centerId,
        status: "SCHEDULED",
      });

      const result = await sessionsService.createSession(centerId, input);

      expect(mockTenantedClient.classSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            classId: input.classId,
            centerId,
            roomName: "Room A",
            status: "SCHEDULED",
          }),
        }),
      );
      expect(result.id).toBe("session-1");
    });

    it("should set default status to SCHEDULED", async () => {
      const input = {
        classId: "class-456",
        startTime: new Date("2026-01-20T09:00:00Z"),
        endTime: new Date("2026-01-20T10:00:00Z"),
      };

      mockTenantedClient.class.findUniqueOrThrow.mockResolvedValue({ id: "class-456" });
      mockTenantedClient.classSession.create.mockResolvedValue({
        id: "session-1",
        ...input,
        centerId,
        status: "SCHEDULED",
      });

      await sessionsService.createSession(centerId, input);

      expect(mockTenantedClient.classSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "SCHEDULED",
          }),
        }),
      );
    });
  });

  describe("updateSession", () => {
    it("should return previous times for notification comparison", async () => {
      const sessionId = "session-1";
      const previousStart = new Date("2026-01-20T09:00:00Z");
      const previousEnd = new Date("2026-01-20T10:00:00Z");
      const newStart = new Date("2026-01-20T11:00:00Z");
      const newEnd = new Date("2026-01-20T12:00:00Z");

      mockTenantedClient.classSession.findUniqueOrThrow.mockResolvedValue({
        id: sessionId,
        classId: "class-456",
        startTime: previousStart,
        endTime: previousEnd,
        centerId,
      });

      mockTenantedClient.classSession.update.mockResolvedValue({
        id: sessionId,
        classId: "class-456",
        startTime: newStart,
        endTime: newEnd,
        centerId,
      });

      const result = await sessionsService.updateSession(centerId, sessionId, {
        startTime: newStart,
        endTime: newEnd,
      });

      expect(result.previousStartTime).toEqual(previousStart);
      expect(result.previousEndTime).toEqual(previousEnd);
      expect(result.session.startTime).toEqual(newStart);
    });

    it("should only update provided fields", async () => {
      const sessionId = "session-1";
      mockTenantedClient.classSession.findUniqueOrThrow.mockResolvedValue({
        id: sessionId,
        startTime: new Date(),
        endTime: new Date(),
        roomName: "Room A",
        centerId,
      });
      mockTenantedClient.classSession.update.mockResolvedValue({
        id: sessionId,
        roomName: "Room B",
        centerId,
      });

      await sessionsService.updateSession(centerId, sessionId, {
        roomName: "Room B",
      });

      expect(mockTenantedClient.classSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { roomName: "Room B" },
        }),
      );
    });

    it("should allow updating status", async () => {
      const sessionId = "session-1";
      mockTenantedClient.classSession.findUniqueOrThrow.mockResolvedValue({
        id: sessionId,
        startTime: new Date(),
        endTime: new Date(),
        status: "SCHEDULED",
        centerId,
      });
      mockTenantedClient.classSession.update.mockResolvedValue({
        id: sessionId,
        status: "CANCELLED",
        centerId,
      });

      await sessionsService.updateSession(centerId, sessionId, {
        status: "CANCELLED",
      });

      expect(mockTenantedClient.classSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "CANCELLED" }),
        }),
      );
    });
  });

  describe("getClassParticipants", () => {
    it("should return teacher and student IDs", async () => {
      const classId = "class-456";
      mockTenantedClient.class.findUniqueOrThrow.mockResolvedValue({
        id: classId,
        teacherId: "teacher-1",
        students: [
          { studentId: "student-1" },
          { studentId: "student-2" },
        ],
      });

      const result = await sessionsService.getClassParticipants(centerId, classId);

      expect(result.teacherId).toBe("teacher-1");
      expect(result.studentIds).toEqual(["student-1", "student-2"]);
    });

    it("should handle class with no teacher", async () => {
      const classId = "class-456";
      mockTenantedClient.class.findUniqueOrThrow.mockResolvedValue({
        id: classId,
        teacherId: null,
        students: [{ studentId: "student-1" }],
      });

      const result = await sessionsService.getClassParticipants(centerId, classId);

      expect(result.teacherId).toBeNull();
      expect(result.studentIds).toEqual(["student-1"]);
    });

    it("should handle class with no students", async () => {
      const classId = "class-456";
      mockTenantedClient.class.findUniqueOrThrow.mockResolvedValue({
        id: classId,
        teacherId: "teacher-1",
        students: [],
      });

      const result = await sessionsService.getClassParticipants(centerId, classId);

      expect(result.teacherId).toBe("teacher-1");
      expect(result.studentIds).toEqual([]);
    });
  });

  describe("generateSessions", () => {
    it("should generate sessions from schedules for date range", async () => {
      const input = {
        startDate: "2026-01-20",
        endDate: "2026-01-26",
      };

      mockTenantedClient.classSchedule.findMany.mockResolvedValue([
        {
          id: "schedule-1",
          classId: "class-1",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "10:00",
          roomName: "Room A",
        },
      ]);

      mockTenantedClient.classSession.findMany.mockResolvedValue([]);
      mockTenantedClient.classSession.createMany.mockResolvedValue({ count: 1 });

      const result = await sessionsService.generateSessions(centerId, input);

      expect(mockTenantedClient.classSchedule.findMany).toHaveBeenCalled();
      expect(mockTenantedClient.classSession.createMany).toHaveBeenCalled();
      expect(result.generatedCount).toBeGreaterThanOrEqual(0);
    });

    it("should not create duplicate sessions", async () => {
      const input = {
        startDate: "2026-01-20",
        endDate: "2026-01-26",
      };

      const existingSessionStart = new Date("2026-01-20T09:00:00Z");
      mockTenantedClient.classSchedule.findMany.mockResolvedValue([
        {
          id: "schedule-1",
          classId: "class-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          roomName: "Room A",
        },
      ]);

      // Existing session that matches the schedule
      mockTenantedClient.classSession.findMany
        .mockResolvedValueOnce([
          { classId: "class-1", startTime: existingSessionStart },
        ])
        .mockResolvedValueOnce([]); // For the final query

      mockTenantedClient.classSession.createMany.mockResolvedValue({ count: 0 });

      const result = await sessionsService.generateSessions(centerId, input);

      // Should check for existing sessions
      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalled();
    });
  });

  describe("deleteSession", () => {
    it("should delete session by id", async () => {
      const sessionId = "session-1";
      mockTenantedClient.classSession.delete.mockResolvedValue({ id: sessionId });

      await sessionsService.deleteSession(centerId, sessionId);

      expect(mockTenantedClient.classSession.delete).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
    });
  });
});
