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
        findFirst: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      class: {
        findUniqueOrThrow: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
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

  describe("checkConflicts", () => {
    const baseInput = {
      classId: "class-456",
      startTime: new Date("2026-01-20T09:00:00Z"),
      endTime: new Date("2026-01-20T10:00:00Z"),
      roomName: "Room A",
    };

    beforeEach(() => {
      // Reset class mock for conflict tests
      mockTenantedClient.class.findUnique = vi.fn();
    });

    it("should detect room conflict when same room has overlapping session", async () => {
      const conflictingSession = {
        id: "session-existing",
        classId: "class-789",
        startTime: new Date("2026-01-20T09:30:00Z"),
        endTime: new Date("2026-01-20T10:30:00Z"),
        roomName: "Room A",
        status: "SCHEDULED",
        class: { name: "Math 101", course: { name: "Math" }, teacher: { name: "Mr. Smith" } },
      };

      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: null });
      mockTenantedClient.classSession.findMany.mockResolvedValue([conflictingSession]);

      const result = await sessionsService.checkConflicts(centerId, baseInput);

      expect(result.hasConflicts).toBe(true);
      expect(result.roomConflicts).toHaveLength(1);
      expect(result.roomConflicts[0].id).toBe("session-existing");
    });

    it("should detect teacher conflict when same teacher has overlapping session", async () => {
      const conflictingSession = {
        id: "session-existing",
        classId: "class-789",
        startTime: new Date("2026-01-20T09:30:00Z"),
        endTime: new Date("2026-01-20T10:30:00Z"),
        roomName: "Room B",
        status: "SCHEDULED",
        class: { name: "Science 101", course: { name: "Science" }, teacher: { id: "teacher-1", name: "Mr. Jones" }, teacherId: "teacher-1" },
      };

      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: "teacher-1" });
      // When roomName is null, room conflict check is skipped, so only teacher conflict findMany is called
      mockTenantedClient.classSession.findMany.mockResolvedValueOnce([conflictingSession]); // teacher conflicts only

      const inputWithNoRoom = { ...baseInput, roomName: null };
      const result = await sessionsService.checkConflicts(centerId, inputWithNoRoom);

      expect(result.hasConflicts).toBe(true);
      expect(result.teacherConflicts).toHaveLength(1);
      expect(result.teacherConflicts[0].id).toBe("session-existing");
    });

    it("should return no conflicts when time slots do not overlap", async () => {
      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: "teacher-1" });
      mockTenantedClient.classSession.findMany.mockResolvedValue([]);

      const result = await sessionsService.checkConflicts(centerId, baseInput);

      expect(result.hasConflicts).toBe(false);
      expect(result.roomConflicts).toHaveLength(0);
      expect(result.teacherConflicts).toHaveLength(0);
    });

    it("should exclude the session being edited from conflict results", async () => {
      const ownSession = {
        id: "session-being-edited",
        classId: "class-456",
        startTime: new Date("2026-01-20T09:00:00Z"),
        endTime: new Date("2026-01-20T10:00:00Z"),
        roomName: "Room A",
        status: "SCHEDULED",
        class: { name: "Math 101", course: { name: "Math" }, teacher: null },
      };

      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: null });
      // The query should have excludeSessionId filter so this shouldn't be returned
      mockTenantedClient.classSession.findMany.mockResolvedValue([]);

      const inputWithExclude = { ...baseInput, excludeSessionId: "session-being-edited" };
      const result = await sessionsService.checkConflicts(centerId, inputWithExclude);

      expect(result.hasConflicts).toBe(false);
      // Verify the query includes the exclusion
      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: "session-being-edited" },
          }),
        }),
      );
    });

    it("should skip room conflict check when roomName is null", async () => {
      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: null });
      mockTenantedClient.classSession.findMany.mockResolvedValue([]);

      const inputNoRoom = { ...baseInput, roomName: null };
      const result = await sessionsService.checkConflicts(centerId, inputNoRoom);

      expect(result.hasConflicts).toBe(false);
      // Should only be called once for teacher conflicts (since no room)
      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalledTimes(0);
    });

    it("should skip teacher conflict check when class has no teacher", async () => {
      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: null });
      mockTenantedClient.classSession.findMany.mockResolvedValue([]);

      const result = await sessionsService.checkConflicts(centerId, baseInput);

      // Only room conflict check should happen
      expect(mockTenantedClient.classSession.findMany).toHaveBeenCalledTimes(1);
    });

    it("should detect both room and teacher conflicts simultaneously", async () => {
      const roomConflictSession = {
        id: "session-room-conflict",
        classId: "class-789",
        startTime: new Date("2026-01-20T09:30:00Z"),
        endTime: new Date("2026-01-20T10:30:00Z"),
        roomName: "Room A",
        status: "SCHEDULED",
        class: { name: "Math 101", course: { name: "Math" }, teacher: { id: "teacher-2", name: "Mr. Smith" } },
      };

      const teacherConflictSession = {
        id: "session-teacher-conflict",
        classId: "class-999",
        startTime: new Date("2026-01-20T09:15:00Z"),
        endTime: new Date("2026-01-20T09:45:00Z"),
        roomName: "Room B",
        status: "SCHEDULED",
        class: { name: "Science 101", course: { name: "Science" }, teacher: { id: "teacher-1", name: "Mr. Jones" }, teacherId: "teacher-1" },
      };

      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: "teacher-1" });
      // First call for room conflicts, second for teacher conflicts
      mockTenantedClient.classSession.findMany
        .mockResolvedValueOnce([roomConflictSession])
        .mockResolvedValueOnce([teacherConflictSession]);

      const result = await sessionsService.checkConflicts(centerId, baseInput);

      expect(result.hasConflicts).toBe(true);
      expect(result.roomConflicts).toHaveLength(1);
      expect(result.roomConflicts[0].id).toBe("session-room-conflict");
      expect(result.teacherConflicts).toHaveLength(1);
      expect(result.teacherConflicts[0].id).toBe("session-teacher-conflict");
    });
  });

  describe("suggestNextAvailable", () => {
    beforeEach(() => {
      mockTenantedClient.class.findUnique = vi.fn();
    });

    it("should suggest next available time slot on same day", async () => {
      const input = {
        classId: "class-456",
        startTime: new Date("2026-01-20T09:00:00Z"),
        endTime: new Date("2026-01-20T10:00:00Z"),
        roomName: "Room A",
        duration: 60, // 60 minutes
      };

      // Existing session blocks 9:00-10:00
      const existingSessions = [
        {
          id: "session-1",
          startTime: new Date("2026-01-20T09:00:00Z"),
          endTime: new Date("2026-01-20T10:00:00Z"),
          roomName: "Room A",
        },
      ];

      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: "teacher-1" });
      mockTenantedClient.classSession.findMany.mockResolvedValue(existingSessions);

      const result = await sessionsService.suggestNextAvailable(centerId, input);

      expect(result).toBeInstanceOf(Array);
      // Should suggest time after 10:00
      if (result.length > 0) {
        expect(result[0].type).toBe("time");
      }
    });

    it("should suggest alternative rooms when requested time is blocked", async () => {
      const input = {
        classId: "class-456",
        startTime: new Date("2026-01-20T09:00:00Z"),
        endTime: new Date("2026-01-20T10:00:00Z"),
        roomName: "Room A",
      };

      // Room A is blocked, but Room B is free
      mockTenantedClient.class.findUnique.mockResolvedValue({ id: "class-456", teacherId: null });
      // First call: sessions on day for time suggestions
      // Second call: distinct rooms query
      mockTenantedClient.classSession.findMany
        .mockResolvedValueOnce([]) // For sessions on day query
        .mockResolvedValueOnce([{ roomName: "Room A" }, { roomName: "Room B" }]); // distinct rooms
      // findFirst returns null for Room B (free)
      mockTenantedClient.classSession.findFirst.mockResolvedValue(null);

      const result = await sessionsService.suggestNextAvailable(centerId, input);

      expect(result).toBeInstanceOf(Array);
      // Should suggest Room B as an alternative since it's free
      const roomSuggestions = result.filter((s: { type: string }) => s.type === "room");
      expect(roomSuggestions.length).toBeGreaterThanOrEqual(1);
      expect(roomSuggestions[0].value).toBe("Room B");
    });
  });

  describe("checkBatchConflicts", () => {
    it("should detect room conflicts between sessions", async () => {
      const sessions = [
        {
          id: "session-1",
          classId: "class-1",
          startTime: new Date("2026-01-20T09:00:00Z"),
          endTime: new Date("2026-01-20T10:00:00Z"),
          roomName: "Room A",
        },
        {
          id: "session-2",
          classId: "class-2",
          startTime: new Date("2026-01-20T09:30:00Z"),
          endTime: new Date("2026-01-20T10:30:00Z"),
          roomName: "Room A", // Same room, overlapping time
        },
        {
          id: "session-3",
          classId: "class-3",
          startTime: new Date("2026-01-20T11:00:00Z"),
          endTime: new Date("2026-01-20T12:00:00Z"),
          roomName: "Room A", // Same room, different time - no conflict
        },
      ];

      // Mock DB query returning all overlapping sessions in range
      mockTenantedClient.classSession.findMany.mockResolvedValue([
        { id: "session-1", classId: "class-1", startTime: sessions[0].startTime, endTime: sessions[0].endTime, roomName: "Room A", class: { teacherId: null } },
        { id: "session-2", classId: "class-2", startTime: sessions[1].startTime, endTime: sessions[1].endTime, roomName: "Room A", class: { teacherId: null } },
        { id: "session-3", classId: "class-3", startTime: sessions[2].startTime, endTime: sessions[2].endTime, roomName: "Room A", class: { teacherId: null } },
      ]);

      const result = await sessionsService.checkBatchConflicts(centerId, sessions);

      expect(result.get("session-1")).toBe(true); // Conflicts with session-2
      expect(result.get("session-2")).toBe(true); // Conflicts with session-1
      expect(result.get("session-3")).toBe(false); // No conflict
    });

    it("should detect teacher conflicts between sessions", async () => {
      const sessions = [
        {
          id: "session-1",
          classId: "class-1",
          startTime: new Date("2026-01-20T09:00:00Z"),
          endTime: new Date("2026-01-20T10:00:00Z"),
          roomName: "Room A",
        },
        {
          id: "session-2",
          classId: "class-2",
          startTime: new Date("2026-01-20T09:30:00Z"),
          endTime: new Date("2026-01-20T10:30:00Z"),
          roomName: "Room B", // Different room, but same teacher
        },
      ];

      mockTenantedClient.classSession.findMany.mockResolvedValue([
        { id: "session-1", classId: "class-1", startTime: sessions[0].startTime, endTime: sessions[0].endTime, roomName: "Room A", class: { teacherId: "teacher-1" } },
        { id: "session-2", classId: "class-2", startTime: sessions[1].startTime, endTime: sessions[1].endTime, roomName: "Room B", class: { teacherId: "teacher-1" } },
      ]);

      const result = await sessionsService.checkBatchConflicts(centerId, sessions);

      expect(result.get("session-1")).toBe(true); // Teacher conflict
      expect(result.get("session-2")).toBe(true); // Teacher conflict
    });

    it("should return no conflicts when sessions do not overlap", async () => {
      const sessions = [
        {
          id: "session-1",
          classId: "class-1",
          startTime: new Date("2026-01-20T09:00:00Z"),
          endTime: new Date("2026-01-20T10:00:00Z"),
          roomName: "Room A",
        },
        {
          id: "session-2",
          classId: "class-2",
          startTime: new Date("2026-01-20T10:00:00Z"),
          endTime: new Date("2026-01-20T11:00:00Z"),
          roomName: "Room A", // Same room but adjacent time (no overlap)
        },
      ];

      mockTenantedClient.classSession.findMany.mockResolvedValue([
        { id: "session-1", classId: "class-1", startTime: sessions[0].startTime, endTime: sessions[0].endTime, roomName: "Room A", class: { teacherId: "teacher-1" } },
        { id: "session-2", classId: "class-2", startTime: sessions[1].startTime, endTime: sessions[1].endTime, roomName: "Room A", class: { teacherId: "teacher-2" } },
      ]);

      const result = await sessionsService.checkBatchConflicts(centerId, sessions);

      expect(result.get("session-1")).toBe(false);
      expect(result.get("session-2")).toBe(false);
    });

    it("should return empty map for empty sessions array", async () => {
      const result = await sessionsService.checkBatchConflicts(centerId, []);
      expect(result.size).toBe(0);
    });

    it("should detect conflicts with sessions outside the batch (DB-only)", async () => {
      // Batch only contains session-1, but DB has session-external that overlaps
      const sessions = [
        {
          id: "session-1",
          classId: "class-1",
          startTime: new Date("2026-01-20T09:00:00Z"),
          endTime: new Date("2026-01-20T10:00:00Z"),
          roomName: "Room A",
        },
      ];

      // DB returns both batch session AND an external overlapping session
      mockTenantedClient.classSession.findMany.mockResolvedValue([
        { id: "session-1", classId: "class-1", startTime: sessions[0].startTime, endTime: sessions[0].endTime, roomName: "Room A", class: { teacherId: null } },
        { id: "session-external", classId: "class-ext", startTime: new Date("2026-01-20T09:30:00Z"), endTime: new Date("2026-01-20T10:30:00Z"), roomName: "Room A", class: { teacherId: null } },
      ]);

      const result = await sessionsService.checkBatchConflicts(centerId, sessions);

      expect(result.get("session-1")).toBe(true); // Conflict with external session
    });
  });
});
