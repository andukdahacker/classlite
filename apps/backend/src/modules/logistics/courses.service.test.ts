import { PrismaClient, getTenantedClient } from "@workspace/db";
import { CreateCourseInput, UpdateCourseInput } from "@workspace/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoursesService } from "./courses.service.js";

describe("CoursesService", () => {
  let coursesService: CoursesService;
  let mockBasePrisma: any;
  const centerId = "center-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock base prisma
    mockBasePrisma = {
      course: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findFirstOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      class: {
        count: vi.fn().mockResolvedValue(0),
      },
      $extends: vi.fn().mockImplementation(function (
        this: any,
        extension: any,
      ) {
        // Return a proxy that uses the real extension logic
        const client = this;
        return {
          course: {
            findMany: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Course",
                operation: "findMany",
                args,
                query: (a: any) => client.course.findMany(a),
              }),
            findUniqueOrThrow: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Course",
                operation: "findUniqueOrThrow",
                args,
                query: (a: any) => client.course.findFirstOrThrow(a),
              }),
            create: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Course",
                operation: "create",
                args,
                query: (a: any) => client.course.create(a),
              }),
            update: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Course",
                operation: "update",
                args,
                query: (a: any) => client.course.update(a),
              }),
            delete: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Course",
                operation: "delete",
                args,
                query: (a: any) => client.course.delete(a),
              }),
          },
          class: {
            count: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Class",
                operation: "count",
                args,
                query: (a: any) => client.class.count(a),
              }),
          },
        };
      }),
    };

    coursesService = new CoursesService(mockBasePrisma as any);
  });

  it("should list all courses and verify centerId injection", async () => {
    mockBasePrisma.course.findMany.mockResolvedValue([]);

    await coursesService.listCourses(centerId);

    expect(mockBasePrisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ centerId }),
      }),
    );
  });

  it("should create course and verify centerId injection", async () => {
    const input: CreateCourseInput = { name: "New" };
    mockBasePrisma.course.create.mockResolvedValue({
      id: "1",
      ...input,
      centerId,
    });

    await coursesService.createCourse(centerId, input);

    expect(mockBasePrisma.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ centerId }),
      }),
    );
  });

  it("should get course and verify centerId injection in findFirstOrThrow", async () => {
    mockBasePrisma.course.findFirstOrThrow.mockResolvedValue({
      id: "1",
      centerId,
    });

    await coursesService.getCourse(centerId, "1");

    expect(mockBasePrisma.course.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "1", centerId }),
      }),
    );
  });

  it("should update course and verify centerId injection", async () => {
    const input: UpdateCourseInput = { name: "Updated" };
    mockBasePrisma.course.update.mockResolvedValue({
      id: "1",
      ...input,
      centerId,
    });

    await coursesService.updateCourse(centerId, "1", input);

    expect(mockBasePrisma.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "1", centerId }),
      }),
    );
  });

  it("should delete course and verify centerId injection", async () => {
    mockBasePrisma.course.delete.mockResolvedValue({ id: "1" });

    await coursesService.deleteCourse(centerId, "1");

    expect(mockBasePrisma.course.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "1", centerId }),
      }),
    );
  });
});
