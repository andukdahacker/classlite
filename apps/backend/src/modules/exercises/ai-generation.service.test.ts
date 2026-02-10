import { vi, describe, it, expect, beforeEach } from "vitest";
import { AIGenerationService } from "./ai-generation.service.js";

// Mock inngest — the service imports inngest from this module
vi.mock("../inngest/client.js", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @google/genai — the service instantiates GoogleGenAI in constructor
vi.mock("@google/genai", () => {
  class MockGoogleGenAI {
    models = {
      generateContent: vi.fn(),
    };
  }
  return { GoogleGenAI: MockGoogleGenAI };
});

describe("AIGenerationService", () => {
  let service: AIGenerationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  const centerId = "center-123";
  const exerciseId = "ex-1";

  const mockExercise = {
    id: exerciseId,
    centerId,
    title: "Reading Test",
    skill: "READING",
    status: "DRAFT",
    passageContent: "This is a test passage about climate change.",
    createdById: "user-1",
  };

  const mockJob = {
    id: "job-1",
    centerId,
    exerciseId,
    status: "pending",
    questionTypes: [{ type: "R1_MCQ_SINGLE", count: 5 }],
    difficulty: "medium",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDb = {
      exercise: {
        findUnique: vi.fn(),
      },
      questionSection: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      aIGenerationJob: {
        create: vi.fn().mockResolvedValue(mockJob),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockDb),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AIGenerationService(mockPrisma as any);
  });

  describe("requestGeneration", () => {
    it("should create a job and send inngest event", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);

      const { inngest } = await import("../inngest/client.js");
      const questionTypes = [{ type: "R1_MCQ_SINGLE" as const, count: 5 }];

      const result = await service.requestGeneration(
        centerId,
        exerciseId,
        questionTypes,
        "medium",
      );

      expect(result).toEqual(mockJob);
      expect(mockDb.aIGenerationJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          centerId,
          exerciseId,
          status: "pending",
          difficulty: "medium",
        }),
      });
      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "exercises/generate-questions",
          data: expect.objectContaining({
            jobId: mockJob.id,
            exerciseId,
            centerId,
          }),
        }),
      );
    });

    it("should throw if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.requestGeneration(centerId, exerciseId, [
          { type: "R1_MCQ_SINGLE" as const, count: 5 },
        ]),
      ).rejects.toThrow("Exercise not found");
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.requestGeneration(centerId, exerciseId, [
          { type: "R1_MCQ_SINGLE" as const, count: 5 },
        ]),
      ).rejects.toThrow("Can only generate questions for draft exercises");
    });

    it("should throw if exercise is not READING skill", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        skill: "LISTENING",
      });

      await expect(
        service.requestGeneration(centerId, exerciseId, [
          { type: "R1_MCQ_SINGLE" as const, count: 5 },
        ]),
      ).rejects.toThrow("AI generation currently only supports Reading exercises");
    });

    it("should throw if exercise has no passage content", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        passageContent: null,
      });

      await expect(
        service.requestGeneration(centerId, exerciseId, [
          { type: "R1_MCQ_SINGLE" as const, count: 5 },
        ]),
      ).rejects.toThrow(
        "Exercise must have passage content before generating questions",
      );
    });
  });

  describe("getJobStatus", () => {
    it("should return job by id", async () => {
      mockDb.aIGenerationJob.findUnique.mockResolvedValue(mockJob);

      const result = await service.getJobStatus(centerId, "job-1");

      expect(result).toEqual(mockJob);
      expect(mockDb.aIGenerationJob.findUnique).toHaveBeenCalledWith({
        where: { id: "job-1" },
      });
    });

    it("should throw if job not found", async () => {
      mockDb.aIGenerationJob.findUnique.mockResolvedValue(null);

      await expect(
        service.getJobStatus(centerId, "nonexistent"),
      ).rejects.toThrow("Generation job not found");
    });
  });

  describe("getLatestJob", () => {
    it("should return latest job for exercise", async () => {
      mockDb.aIGenerationJob.findFirst.mockResolvedValue(mockJob);

      const result = await service.getLatestJob(centerId, exerciseId);

      expect(result).toEqual(mockJob);
      expect(mockDb.aIGenerationJob.findFirst).toHaveBeenCalledWith({
        where: { exerciseId },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return null if no jobs exist", async () => {
      mockDb.aIGenerationJob.findFirst.mockResolvedValue(null);

      const result = await service.getLatestJob(centerId, exerciseId);

      expect(result).toBeNull();
    });
  });

  describe("requestRegeneration", () => {
    const mockSection = {
      id: "sec-1",
      exerciseId,
      sectionType: "R3_TFNG",
      questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
    };

    it("should delete existing section and create new job", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.questionSection.findUnique.mockResolvedValue(mockSection);

      const { inngest } = await import("../inngest/client.js");

      const result = await service.requestRegeneration(
        centerId,
        exerciseId,
        "sec-1",
        "hard",
      );

      expect(result).toEqual(mockJob);
      expect(mockDb.questionSection.delete).toHaveBeenCalledWith({
        where: { id: "sec-1" },
      });
      expect(mockDb.aIGenerationJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          centerId,
          exerciseId,
          status: "pending",
          difficulty: "hard",
        }),
      });
      expect(inngest.send).toHaveBeenCalled();
    });

    it("should throw if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.requestRegeneration(centerId, exerciseId, "sec-1"),
      ).rejects.toThrow("Exercise not found");
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.requestRegeneration(centerId, exerciseId, "sec-1"),
      ).rejects.toThrow("Can only regenerate questions for draft exercises");
    });

    it("should throw if section not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.questionSection.findUnique.mockResolvedValue(null);

      await expect(
        service.requestRegeneration(centerId, exerciseId, "sec-1"),
      ).rejects.toThrow("Section not found");
    });

    it("should throw if section belongs to different exercise", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.questionSection.findUnique.mockResolvedValue({
        ...mockSection,
        exerciseId: "different-exercise",
      });

      await expect(
        service.requestRegeneration(centerId, exerciseId, "sec-1"),
      ).rejects.toThrow("Section not found");
    });
  });
});
