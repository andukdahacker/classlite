import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@workspace/db";
import { CoursesService } from "./courses.service.js";
import { ClassesService } from "./classes.service.js";
import { getTestPrisma, closeTestPrisma, isTestDatabaseAvailable } from "../../test/db.js";

describe("Logistics Integration", () => {
  let prisma: PrismaClient;
  let dbAvailable = false;
  let coursesService: CoursesService;
  let classesService: ClassesService;

  const centerAId = "center-log-a";
  const centerBId = "center-log-b";
  const studentEmail = "student-logistics@test.com";

  beforeAll(async () => {
    dbAvailable = await isTestDatabaseAvailable();
    if (dbAvailable) {
      prisma = await getTestPrisma();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    try {
      coursesService = new CoursesService(prisma);
      classesService = new ClassesService(prisma);

      // Cleanup
      await prisma.classStudent.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.class.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.course.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.centerMembership.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.center.deleteMany({
        where: { id: { in: [centerAId, centerBId] } },
      });
      await prisma.user.deleteMany({
        where: { email: studentEmail },
      });

      // Setup Centers
      await prisma.center.create({
        data: { id: centerAId, name: "Center A", slug: "center-log-a" },
      });
      await prisma.center.create({
        data: { id: centerBId, name: "Center B", slug: "center-log-b" },
      });
    } catch (e) {
      console.warn("Database integration test setup failed:", e);
    }
  });

  afterAll(async () => {
    if (dbAvailable && prisma) {
      try {
        // Final Cleanup
        await prisma.classStudent.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.class.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.course.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.centerMembership.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.center.deleteMany({
          where: { id: { in: [centerAId, centerBId] } },
        });
        await prisma.user.deleteMany({
          where: { email: studentEmail },
        });
      } catch {}
    }
    await closeTestPrisma();
  });

  it("should isolate courses by center", async () => {
    if (!dbAvailable) return;

    await coursesService.createCourse(centerAId, { name: "Course A" });
    await coursesService.createCourse(centerBId, { name: "Course B" });

    const coursesA = await coursesService.listCourses(centerAId);
    expect(coursesA).toHaveLength(1);
    expect(coursesA[0]?.name).toBe("Course A");

    const coursesB = await coursesService.listCourses(centerBId);
    expect(coursesB).toHaveLength(1);
    expect(coursesB[0]?.name).toBe("Course B");
  });

  it("should update and delete courses within center isolation", async () => {
    if (!dbAvailable) return;

    const course = await coursesService.createCourse(centerAId, {
      name: "Original",
    });

    // Update
    await coursesService.updateCourse(centerAId, course.id, {
      name: "Updated",
    });
    const updated = await coursesService.getCourse(centerAId, course.id);
    expect(updated.name).toBe("Updated");

    // Try to update from Center B (should fail or not find)
    await expect(
      coursesService.updateCourse(centerBId, course.id, { name: "Hacked" }),
    ).rejects.toThrow();

    // Delete
    await coursesService.deleteCourse(centerAId, course.id);
    await expect(
      coursesService.getCourse(centerAId, course.id),
    ).rejects.toThrow();
  });

  it("should isolate classes and manage roster", async () => {
    if (!dbAvailable) return;

    // Create Course
    const course = await coursesService.createCourse(centerAId, {
      name: "IELTS",
    });

    // Create Class
    const cls = await classesService.createClass(centerAId, {
      name: "Class 101",
      courseId: course.id,
    });

    // Create a User for student
    const studentUser = await prisma.user.create({
      data: { email: studentEmail, name: "Student" },
    });

    // Add to Center
    await prisma.centerMembership.create({
      data: { centerId: centerAId, userId: studentUser.id, role: "STUDENT" },
    });

    // Add to Class
    await classesService.addStudent(centerAId, cls.id, studentUser.id);

    // Verify Roster
    const roster = await classesService.listRoster(centerAId, cls.id);
    expect(roster).toHaveLength(1);
    expect(roster[0]?.studentId).toBe(studentUser.id);

    // Verify Center B cannot see it
    const classesB = await classesService.listClasses(centerBId);
    expect(classesB).toHaveLength(0);

    // Update Class
    await classesService.updateClass(centerAId, cls.id, { name: "Class 102" });
    const updatedCls = await classesService.getClass(centerAId, cls.id);
    expect(updatedCls.name).toBe("Class 102");

    // Remove Student
    await classesService.removeStudent(centerAId, cls.id, studentUser.id);
    const emptyRoster = await classesService.listRoster(centerAId, cls.id);
    expect(emptyRoster).toHaveLength(0);

    // Delete Class
    await classesService.deleteClass(centerAId, cls.id);
    await expect(classesService.getClass(centerAId, cls.id)).rejects.toThrow();
  });
});
