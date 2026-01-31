import { PrismaClient } from "@workspace/db";
import { addDays, setHours, setMinutes } from "date-fns";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPrisma, closeTestPrisma, isTestDatabaseAvailable } from "../../test/db.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { SessionsController } from "./sessions.controller.js";
import { SessionsService } from "./sessions.service.js";

describe("Sessions Integration - Move Session Notify Flow", () => {
  let prisma: PrismaClient;
  let dbAvailable = false;
  let sessionsService: SessionsService;
  let notificationsService: NotificationsService;
  let sessionsController: SessionsController;

  const centerId = "center-session-test";
  let courseId: string;
  let classId: string;
  let teacherUserId: string;
  let studentUserId: string;
  let sessionId: string;

  beforeAll(async () => {
    dbAvailable = await isTestDatabaseAvailable();
    if (dbAvailable) {
      prisma = await getTestPrisma();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    try {
      sessionsService = new SessionsService(prisma);
      notificationsService = new NotificationsService(prisma);
      sessionsController = new SessionsController(
        sessionsService,
        notificationsService,
      );

      // Cleanup
      await prisma.notification.deleteMany({ where: { centerId } });
      await prisma.classSession.deleteMany({ where: { centerId } });
      await prisma.classSchedule.deleteMany({ where: { centerId } });
      await prisma.classStudent.deleteMany({ where: { centerId } });
      await prisma.class.deleteMany({ where: { centerId } });
      await prisma.course.deleteMany({ where: { centerId } });
      await prisma.centerMembership.deleteMany({ where: { centerId } });
      await prisma.center.deleteMany({ where: { id: centerId } });
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ["teacher-session@test.com", "student-session@test.com"],
          },
        },
      });

      // Setup Center
      await prisma.center.create({
        data: {
          id: centerId,
          name: "Session Test Center",
          slug: "center-session-test",
        },
      });

      // Setup Users
      const teacher = await prisma.user.create({
        data: { email: "teacher-session@test.com", name: "Test Teacher" },
      });
      teacherUserId = teacher.id;

      const student = await prisma.user.create({
        data: { email: "student-session@test.com", name: "Test Student" },
      });
      studentUserId = student.id;

      // Add users to center
      await prisma.centerMembership.create({
        data: { centerId, userId: teacherUserId, role: "TEACHER" },
      });
      await prisma.centerMembership.create({
        data: { centerId, userId: studentUserId, role: "STUDENT" },
      });

      // Create Course
      const course = await prisma.course.create({
        data: { name: "Integration Test Course", centerId },
      });
      courseId = course.id;

      // Create Class with teacher
      const cls = await prisma.class.create({
        data: {
          name: "Integration Test Class",
          courseId: course.id,
          teacherId: teacherUserId,
          centerId,
        },
      });
      classId = cls.id;

      // Add student to class
      await prisma.classStudent.create({
        data: { classId: cls.id, studentId: studentUserId, centerId },
      });

      // Create a session
      const tomorrow = addDays(new Date(), 1);
      const sessionStart = setMinutes(setHours(tomorrow, 10), 0);
      const sessionEnd = setMinutes(setHours(tomorrow, 11), 0);

      const session = await prisma.classSession.create({
        data: {
          classId: cls.id,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: "SCHEDULED",
          centerId,
        },
      });
      sessionId = session.id;
    } catch (e) {
      console.warn("Database integration test setup failed:", e);
    }
  });

  afterAll(async () => {
    if (dbAvailable && prisma) {
      try {
        // Final Cleanup
        await prisma.notification.deleteMany({ where: { centerId } });
        await prisma.classSession.deleteMany({ where: { centerId } });
        await prisma.classSchedule.deleteMany({ where: { centerId } });
        await prisma.classStudent.deleteMany({ where: { centerId } });
        await prisma.class.deleteMany({ where: { centerId } });
        await prisma.course.deleteMany({ where: { centerId } });
        await prisma.centerMembership.deleteMany({ where: { centerId } });
        await prisma.center.deleteMany({ where: { id: centerId } });
        await prisma.user.deleteMany({
          where: {
            email: {
              in: ["teacher-session@test.com", "student-session@test.com"],
            },
          },
        });
      } catch {}
    }
    await closeTestPrisma();
  });

  it("should create notifications for teacher and students when session is moved", async () => {
    if (!dbAvailable) return;

    // Verify initial state - no notifications
    const initialNotificationsTeacher =
      await notificationsService.listNotifications(centerId, teacherUserId);
    const initialNotificationsStudent =
      await notificationsService.listNotifications(centerId, studentUserId);
    expect(initialNotificationsTeacher).toHaveLength(0);
    expect(initialNotificationsStudent).toHaveLength(0);

    // Move the session to a new time (2 hours later)
    const dayAfterTomorrow = addDays(new Date(), 2);
    const newStart = setMinutes(setHours(dayAfterTomorrow, 14), 0);
    const newEnd = setMinutes(setHours(dayAfterTomorrow, 15), 0);

    const mockJwtPayload = {
      centerId,
      userId: "admin-user-id",
      role: "ADMIN",
    };

    const result = await sessionsController.updateSession(
      sessionId,
      {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      },
      mockJwtPayload as any,
    );

    expect(result.message).toBe("Session updated successfully");
    expect(new Date(result?.data?.startTime ?? "").getTime()).toBe(
      newStart.getTime(),
    );

    // Verify notifications were created
    const teacherNotifications = await notificationsService.listNotifications(
      centerId,
      teacherUserId,
    );
    const studentNotifications = await notificationsService.listNotifications(
      centerId,
      studentUserId,
    );

    expect(teacherNotifications).toHaveLength(1);
    expect(teacherNotifications[0]?.title).toBe("Session Rescheduled");
    expect(teacherNotifications[0]?.read).toBe(false);

    expect(studentNotifications).toHaveLength(1);
    expect(studentNotifications[0]?.title).toBe("Session Rescheduled");
    expect(studentNotifications[0]?.read).toBe(false);
  });

  it("should NOT create notifications when session time is unchanged", async () => {
    if (!dbAvailable) return;

    // Update only the room name (not time)
    const mockJwtPayload = {
      centerId,
      userId: "admin-user-id",
      role: "ADMIN",
    };

    await sessionsController.updateSession(
      sessionId,
      { roomName: "Room 101" },
      mockJwtPayload as any,
    );

    // Verify no notifications were created
    const teacherNotifications = await notificationsService.listNotifications(
      centerId,
      teacherUserId,
    );
    const studentNotifications = await notificationsService.listNotifications(
      centerId,
      studentUserId,
    );

    expect(teacherNotifications).toHaveLength(0);
    expect(studentNotifications).toHaveLength(0);
  });

  it("should return sessions for the correct center", async () => {
    if (!dbAvailable) return;

    // Create a fresh session for this test
    const tomorrow = addDays(new Date(), 1);
    const sessionStart = setMinutes(setHours(tomorrow, 15), 0);
    const sessionEnd = setMinutes(setHours(tomorrow, 16), 0);

    await prisma.classSession.create({
      data: {
        classId,
        startTime: sessionStart,
        endTime: sessionEnd,
        status: "SCHEDULED",
        centerId,
      },
    });

    // List sessions for this center - use a wide date range
    const startRange = new Date();
    const endRange = addDays(new Date(), 14);

    const sessions = await sessionsService.listSessions(
      centerId,
      startRange,
      endRange,
    );
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    // Verify all returned sessions belong to the correct center
    for (const session of sessions) {
      expect(session.centerId).toBe(centerId);
    }
  });
});
