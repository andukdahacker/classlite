import { PrismaClient, getTenantedClient } from "@workspace/db";
import { CreateClassInput, UpdateClassInput } from "@workspace/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClassesService } from "./classes.service.js";

describe("ClassesService", () => {
  let classesService: ClassesService;
  let mockBasePrisma: any;
  const centerId = "center-123";

  beforeEach(() => {
    vi.clearAllMocks();

    mockBasePrisma = {
      class: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      classStudent: {
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
      centerMembership: {
        findFirst: vi.fn(),
      },
      $extends: vi.fn().mockImplementation(function (
        this: any,
        extension: any,
      ) {
        const client = this;
        return {
          class: {
            findMany: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Class",
                operation: "findMany",
                args,
                query: (a: any) => client.class.findMany(a),
              }),
            create: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Class",
                operation: "create",
                args,
                query: (a: any) => client.class.create(a),
              }),
            update: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Class",
                operation: "update",
                args,
                query: (a: any) => client.class.update(a),
              }),
            delete: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "Class",
                operation: "delete",
                args,
                query: (a: any) => client.class.delete(a),
              }),
          },
          classStudent: {
            create: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "ClassStudent",
                operation: "create",
                args,
                query: (a: any) => client.classStudent.create(a),
              }),
            delete: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "ClassStudent",
                operation: "delete",
                args,
                query: (a: any) => client.classStudent.delete(a),
              }),
            findMany: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "ClassStudent",
                operation: "findMany",
                args,
                query: (a: any) => client.classStudent.findMany(a),
              }),
          },
          centerMembership: {
            findFirst: (args: any) =>
              extension.query.$allModels.$allOperations({
                model: "CenterMembership",
                operation: "findFirst",
                args,
                query: (a: any) => client.centerMembership.findFirst(a),
              }),
          },
        };
      }),
    };

    classesService = new ClassesService(mockBasePrisma as any);
  });

  it("should list all classes and verify centerId injection", async () => {
    mockBasePrisma.class.findMany.mockResolvedValue([]);
    await classesService.listClasses(centerId);
    expect(mockBasePrisma.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ centerId }),
      }),
    );
  });

  it("should verify student membership before adding to class", async () => {
    const classId = "cl1";
    const studentId = "st1";

    // Mock student NOT in center
    mockBasePrisma.centerMembership.findFirst.mockResolvedValue(null);

    await expect(
      classesService.addStudent(centerId, classId, studentId),
    ).rejects.toThrow("Student does not belong to this center");

    expect(mockBasePrisma.centerMembership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: studentId, centerId }),
      }),
    );
  });

  it("should add student if membership verified", async () => {
    const classId = "cl1";
    const studentId = "st1";

    mockBasePrisma.centerMembership.findFirst.mockResolvedValue({ id: "m1" });
    mockBasePrisma.classStudent.create.mockResolvedValue({});

    await classesService.addStudent(centerId, classId, studentId);

    expect(mockBasePrisma.classStudent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ classId, studentId, centerId }),
      }),
    );
  });

  it("should remove student and verify centerId injection", async () => {
    const classId = "cl1";
    const studentId = "st1";
    await classesService.removeStudent(centerId, classId, studentId);
    expect(mockBasePrisma.classStudent.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ centerId }),
      }),
    );
  });
});
