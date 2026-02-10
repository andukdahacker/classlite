import { vi, describe, it, expect, beforeEach } from "vitest";
import { MockTestsService } from "./mock-tests.service.js";

describe("MockTestsService", () => {
  let service: MockTestsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  const centerId = "center-123";
  const firebaseUid = "firebase-uid-456";
  const userId = "user-456";

  const mockMockTest = {
    id: "mt-1",
    centerId,
    title: "IELTS Mock Test 1",
    description: null,
    testType: "ACADEMIC",
    status: "DRAFT",
    createdById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: userId, name: "Teacher" },
    sections: [
      { id: "sec-1", skill: "LISTENING", orderIndex: 0, timeLimit: 1800, exercises: [] },
      { id: "sec-2", skill: "READING", orderIndex: 1, timeLimit: 3600, exercises: [] },
      { id: "sec-3", skill: "WRITING", orderIndex: 2, timeLimit: 3600, exercises: [] },
      { id: "sec-4", skill: "SPEAKING", orderIndex: 3, timeLimit: 900, exercises: [] },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      mockTest: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      mockTestSection: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      mockTestSectionExercise: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
      exercise: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockDb),
      authAccount: {
        findUnique: vi.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new MockTestsService(mockPrisma as any);
  });

  describe("createMockTest", () => {
    it("should create mock test with 4 auto-generated sections", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
      });
      mockDb.mockTest.create.mockResolvedValue(mockMockTest);

      const result = await service.createMockTest(
        centerId,
        { title: "IELTS Mock Test 1", testType: "ACADEMIC" },
        firebaseUid,
      );

      expect(result).toEqual(mockMockTest);
      expect(mockDb.mockTest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            centerId,
            title: "IELTS Mock Test 1",
            testType: "ACADEMIC",
            createdById: userId,
            sections: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ skill: "LISTENING", orderIndex: 0 }),
                expect.objectContaining({ skill: "READING", orderIndex: 1 }),
                expect.objectContaining({ skill: "WRITING", orderIndex: 2 }),
                expect.objectContaining({ skill: "SPEAKING", orderIndex: 3 }),
              ]),
            }),
          }),
        }),
      );
    });

    it("should resolve Firebase UID to user", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
      });
      mockDb.mockTest.create.mockResolvedValue(mockMockTest);

      await service.createMockTest(
        centerId,
        { title: "Test", testType: "ACADEMIC" },
        firebaseUid,
      );

      expect(mockPrisma.authAccount.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: "FIREBASE",
            providerUserId: firebaseUid,
          },
        },
      });
    });

    it("should throw if Firebase UID not found", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.createMockTest(
          centerId,
          { title: "Test", testType: "ACADEMIC" },
          "unknown-uid",
        ),
      ).rejects.toThrow("User account not found");
    });
  });

  describe("addExerciseToSection", () => {
    const mockSection = {
      id: "sec-1",
      mockTestId: "mt-1",
      skill: "LISTENING",
      orderIndex: 0,
      timeLimit: 1800,
    };
    const mockExercise = {
      id: "ex-1",
      skill: "LISTENING",
      status: "PUBLISHED",
      title: "Listening Exercise",
    };

    it("should only accept PUBLISHED exercises", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSection.findUnique.mockResolvedValue(mockSection);
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "DRAFT",
      });

      await expect(
        service.addExerciseToSection(centerId, "mt-1", "sec-1", "ex-1"),
      ).rejects.toThrow("Only published exercises can be added");
    });

    it("should validate skill match", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSection.findUnique.mockResolvedValue(mockSection);
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        skill: "READING",
      });

      await expect(
        service.addExerciseToSection(centerId, "mt-1", "sec-1", "ex-1"),
      ).rejects.toThrow("does not match section skill");
    });

    it("should prevent duplicate exercise in same section", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSection.findUnique.mockResolvedValue(mockSection);
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.mockTestSectionExercise.findFirst.mockResolvedValue({
        id: "mse-1",
        sectionId: "sec-1",
        exerciseId: "ex-1",
      });

      await expect(
        service.addExerciseToSection(centerId, "mt-1", "sec-1", "ex-1"),
      ).rejects.toThrow("Exercise already in this section");
    });

    it("should add exercise successfully", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSection.findUnique.mockResolvedValue(mockSection);
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.mockTestSectionExercise.findFirst
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce(null); // last exercise check
      mockDb.mockTestSectionExercise.create.mockResolvedValue({
        id: "mse-1",
        sectionId: "sec-1",
        exerciseId: "ex-1",
        orderIndex: 0,
        exercise: mockExercise,
      });

      const result = await service.addExerciseToSection(
        centerId,
        "mt-1",
        "sec-1",
        "ex-1",
      );

      expect(result.exerciseId).toBe("ex-1");
      expect(result.orderIndex).toBe(0);
    });
  });

  describe("removeExerciseFromSection", () => {
    it("should remove and reindex remaining exercises", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSectionExercise.findFirst.mockResolvedValue({
        id: "mse-2",
        sectionId: "sec-1",
        exerciseId: "ex-2",
        orderIndex: 1,
      });
      mockDb.mockTestSectionExercise.delete.mockResolvedValue({});
      mockDb.mockTestSectionExercise.findMany.mockResolvedValue([
        { id: "mse-1", orderIndex: 0 },
        { id: "mse-3", orderIndex: 2 },
      ]);
      mockDb.$transaction.mockResolvedValue([]);

      await service.removeExerciseFromSection(centerId, "mt-1", "sec-1", "ex-2");

      expect(mockDb.mockTestSectionExercise.delete).toHaveBeenCalledWith({
        where: { id: "mse-2" },
      });
      expect(mockDb.$transaction).toHaveBeenCalled();
    });
  });

  describe("reorderSectionExercises", () => {
    it("should update orderIndex correctly", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSectionExercise.findMany.mockResolvedValue([
        { id: "mse-1", exerciseId: "ex-1" },
        { id: "mse-2", exerciseId: "ex-2" },
      ]);
      mockDb.$transaction.mockResolvedValue([]);

      await service.reorderSectionExercises(
        centerId,
        "mt-1",
        "sec-1",
        ["ex-2", "ex-1"],
      );

      expect(mockDb.$transaction).toHaveBeenCalled();
    });

    it("should reject if exercise not in section", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSectionExercise.findMany.mockResolvedValue([
        { id: "mse-1", exerciseId: "ex-1" },
      ]);

      await expect(
        service.reorderSectionExercises(
          centerId,
          "mt-1",
          "sec-1",
          ["ex-1", "ex-999"],
        ),
      ).rejects.toThrow("does not belong to this section");
    });
  });

  describe("updateMockTest", () => {
    it("should reject non-DRAFT mock tests", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue({
        ...mockMockTest,
        status: "PUBLISHED",
      });

      await expect(
        service.updateMockTest(centerId, "mt-1", { title: "New Title" }),
      ).rejects.toThrow("Only draft mock tests can be updated");
    });

    it("should update DRAFT mock test", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTest.update.mockResolvedValue({
        ...mockMockTest,
        title: "Updated Title",
      });

      const result = await service.updateMockTest(centerId, "mt-1", {
        title: "Updated Title",
      });

      expect(result.title).toBe("Updated Title");
    });
  });

  describe("deleteMockTest", () => {
    it("should reject non-DRAFT mock tests", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue({
        ...mockMockTest,
        status: "PUBLISHED",
      });

      await expect(
        service.deleteMockTest(centerId, "mt-1"),
      ).rejects.toThrow("Only draft mock tests can be deleted");
    });

    it("should delete DRAFT mock test", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTest.delete.mockResolvedValue(mockMockTest);

      await service.deleteMockTest(centerId, "mt-1");

      expect(mockDb.mockTest.delete).toHaveBeenCalledWith({
        where: { id: "mt-1" },
      });
    });
  });

  describe("publishMockTest", () => {
    it("should validate all sections have exercises", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue({
        ...mockMockTest,
        sections: [
          { skill: "LISTENING", exercises: [{ exercise: { status: "PUBLISHED" } }] },
          { skill: "READING", exercises: [] },
          { skill: "WRITING", exercises: [{ exercise: { status: "PUBLISHED" } }] },
          { skill: "SPEAKING", exercises: [] },
        ],
      });

      await expect(
        service.publishMockTest(centerId, "mt-1"),
      ).rejects.toThrow("READING, SPEAKING section(s) have no exercises");
    });

    it("should validate all exercises are still PUBLISHED", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue({
        ...mockMockTest,
        sections: [
          { skill: "LISTENING", exercises: [{ exercise: { id: "ex-1", status: "PUBLISHED", title: "L1" } }] },
          { skill: "READING", exercises: [{ exercise: { id: "ex-2", status: "ARCHIVED", title: "R1" } }] },
          { skill: "WRITING", exercises: [{ exercise: { id: "ex-3", status: "PUBLISHED", title: "W1" } }] },
          { skill: "SPEAKING", exercises: [{ exercise: { id: "ex-4", status: "PUBLISHED", title: "S1" } }] },
        ],
      });

      await expect(
        service.publishMockTest(centerId, "mt-1"),
      ).rejects.toThrow("exercises no longer published");
    });

    it("should publish when all validations pass", async () => {
      const validMockTest = {
        ...mockMockTest,
        sections: [
          { skill: "LISTENING", exercises: [{ exercise: { id: "ex-1", status: "PUBLISHED", title: "L1" } }] },
          { skill: "READING", exercises: [{ exercise: { id: "ex-2", status: "PUBLISHED", title: "R1" } }] },
          { skill: "WRITING", exercises: [{ exercise: { id: "ex-3", status: "PUBLISHED", title: "W1" } }] },
          { skill: "SPEAKING", exercises: [{ exercise: { id: "ex-4", status: "PUBLISHED", title: "S1" } }] },
        ],
      };
      mockDb.mockTest.findUnique.mockResolvedValue(validMockTest);
      mockDb.mockTest.update.mockResolvedValue({
        ...validMockTest,
        status: "PUBLISHED",
      });

      const result = await service.publishMockTest(centerId, "mt-1");

      expect(result.status).toBe("PUBLISHED");
    });
  });

  describe("archiveMockTest", () => {
    it("should transition any status to ARCHIVED", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue({
        ...mockMockTest,
        status: "PUBLISHED",
      });
      mockDb.mockTest.update.mockResolvedValue({
        ...mockMockTest,
        status: "ARCHIVED",
      });

      const result = await service.archiveMockTest(centerId, "mt-1");

      expect(result.status).toBe("ARCHIVED");
    });

    it("should reject already archived", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue({
        ...mockMockTest,
        status: "ARCHIVED",
      });

      await expect(
        service.archiveMockTest(centerId, "mt-1"),
      ).rejects.toThrow("already archived");
    });
  });

  describe("listMockTests", () => {
    it("should list with filters", async () => {
      mockDb.mockTest.findMany.mockResolvedValue([mockMockTest]);

      const result = await service.listMockTests(centerId, {
        status: "DRAFT",
        testType: "ACADEMIC",
      });

      expect(result).toHaveLength(1);
      expect(mockDb.mockTest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "DRAFT", testType: "ACADEMIC" },
        }),
      );
    });
  });

  describe("getMockTest", () => {
    it("should return mock test with full details", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);

      const result = await service.getMockTest(centerId, "mt-1");

      expect(result.id).toBe("mt-1");
    });

    it("should throw if not found", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(null);

      await expect(
        service.getMockTest(centerId, "not-found"),
      ).rejects.toThrow("Mock test not found");
    });
  });

  describe("updateSection", () => {
    it("should update section time limit", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSection.findUnique.mockResolvedValue({
        id: "sec-1",
        mockTestId: "mt-1",
        skill: "LISTENING",
      });
      mockDb.mockTestSection.update.mockResolvedValue({
        id: "sec-1",
        timeLimit: 2400,
      });

      const result = await service.updateSection(
        centerId,
        "mt-1",
        "sec-1",
        { timeLimit: 2400 },
      );

      expect(result.timeLimit).toBe(2400);
    });

    it("should reject if section not found or wrong mock test", async () => {
      mockDb.mockTest.findUnique.mockResolvedValue(mockMockTest);
      mockDb.mockTestSection.findUnique.mockResolvedValue({
        id: "sec-1",
        mockTestId: "mt-other",
      });

      await expect(
        service.updateSection(centerId, "mt-1", "sec-1", { timeLimit: 2400 }),
      ).rejects.toThrow("Section not found");
    });
  });
});
