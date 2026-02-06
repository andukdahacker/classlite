import { vi, describe, it, expect, beforeEach } from "vitest";
import { ExercisesService } from "./exercises.service.js";

describe("ExercisesService", () => {
  let service: ExercisesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  const centerId = "center-123";
  const userId = "user-456";

  const mockExercise = {
    id: "ex-1",
    centerId,
    title: "Reading Test 1",
    instructions: null,
    skill: "READING",
    status: "DRAFT",
    passageContent: null,
    passageFormat: null,
    createdById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: userId, name: "Teacher" },
    sections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      exercise: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockDb),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new ExercisesService(mockPrisma as any);
  });

  describe("listExercises", () => {
    it("should return all exercises ordered by updatedAt desc", async () => {
      const mockExercises = [mockExercise];
      mockDb.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await service.listExercises(centerId);

      expect(result).toEqual(mockExercises);
      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: "desc" },
        }),
      );
    });

    it("should filter by skill when provided", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { skill: "READING" });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { skill: "READING" },
        }),
      );
    });

    it("should filter by status when provided", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { status: "PUBLISHED" });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "PUBLISHED" },
        }),
      );
    });
  });

  describe("getExercise", () => {
    it("should return exercise with sections and questions", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);

      const result = await service.getExercise(centerId, "ex-1");

      expect(result).toEqual(mockExercise);
      expect(mockDb.exercise.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          include: expect.objectContaining({
            sections: expect.any(Object),
            createdBy: expect.any(Object),
          }),
        }),
      );
    });

    it("should throw 404 if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(service.getExercise(centerId, "nonexistent")).rejects.toThrow(
        "Exercise not found",
      );
    });
  });

  describe("createExercise", () => {
    it("should create exercise with default DRAFT status", async () => {
      mockDb.exercise.create.mockResolvedValue(mockExercise);

      const result = await service.createExercise(centerId, {
        title: "Reading Test 1",
        skill: "READING",
      }, userId);

      expect(result).toEqual(mockExercise);
      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            centerId,
            title: "Reading Test 1",
            skill: "READING",
            createdById: userId,
          }),
        }),
      );
    });
  });

  describe("updateExercise", () => {
    it("should update a draft exercise", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        title: "Updated Title",
      });

      const result = await service.updateExercise(centerId, "ex-1", {
        title: "Updated Title",
      });

      expect(result.title).toBe("Updated Title");
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.updateExercise(centerId, "ex-1", { title: "New" }),
      ).rejects.toThrow("Only draft exercises can be fully edited");
    });

    it("should throw 404 if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.updateExercise(centerId, "nonexistent", { title: "New" }),
      ).rejects.toThrow("Exercise not found");
    });
  });

  describe("deleteExercise", () => {
    it("should delete a draft exercise", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.delete.mockResolvedValue(mockExercise);

      await service.deleteExercise(centerId, "ex-1");

      expect(mockDb.exercise.delete).toHaveBeenCalledWith({
        where: { id: "ex-1" },
      });
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.deleteExercise(centerId, "ex-1"),
      ).rejects.toThrow("Only draft exercises can be deleted");
    });

    it("should throw 404 if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteExercise(centerId, "nonexistent"),
      ).rejects.toThrow("Exercise not found");
    });
  });

  describe("publishExercise", () => {
    it("should publish a draft exercise", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      const published = { ...mockExercise, status: "PUBLISHED" };
      mockDb.exercise.update.mockResolvedValue(published);

      const result = await service.publishExercise(centerId, "ex-1");

      expect(result.status).toBe("PUBLISHED");
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          data: { status: "PUBLISHED" },
        }),
      );
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "ARCHIVED",
      });

      await expect(
        service.publishExercise(centerId, "ex-1"),
      ).rejects.toThrow("Only draft exercises can be published");
    });
  });

  describe("archiveExercise", () => {
    it("should archive a published exercise", async () => {
      const published = { ...mockExercise, status: "PUBLISHED" };
      mockDb.exercise.findUnique.mockResolvedValue(published);
      const archived = { ...mockExercise, status: "ARCHIVED" };
      mockDb.exercise.update.mockResolvedValue(archived);

      const result = await service.archiveExercise(centerId, "ex-1");

      expect(result.status).toBe("ARCHIVED");
    });

    it("should throw if exercise is already archived", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "ARCHIVED",
      });

      await expect(
        service.archiveExercise(centerId, "ex-1"),
      ).rejects.toThrow("Exercise is already archived");
    });
  });
});
