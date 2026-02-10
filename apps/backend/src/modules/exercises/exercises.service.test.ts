import { vi, describe, it, expect, beforeEach } from "vitest";
import { Prisma } from "@workspace/db";
import { ExercisesService } from "./exercises.service.js";

describe("ExercisesService", () => {
  let service: ExercisesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStorage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFile: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockBucket: any;
  const centerId = "center-123";
  const firebaseUid = "firebase-uid-456";
  const userId = "user-456";
  const bucketName = "test-bucket";

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

    mockFile = {
      save: vi.fn().mockResolvedValue(undefined),
      makePublic: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockBucket = {
      name: bucketName,
      file: vi.fn().mockReturnValue(mockFile),
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };

    mockDb = {
      exercise: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
      questionSection: {
        create: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      question: {
        create: vi.fn(),
      },
      exerciseTagAssignment: {
        create: vi.fn(),
        createMany: vi.fn(),
      },
      authAccount: {
        findUniqueOrThrow: vi.fn(),
      },
      $transaction: vi.fn((fn: (tx: typeof mockDb) => Promise<unknown>) => fn(mockDb)),
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockDb),
      authAccount: {
        findUnique: vi.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new ExercisesService(mockPrisma as any, mockStorage, bucketName);
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
    it("should resolve Firebase UID and create exercise", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
      });
      mockDb.exercise.create.mockResolvedValue(mockExercise);

      const result = await service.createExercise(centerId, {
        title: "Reading Test 1",
        skill: "READING",
      }, firebaseUid);

      expect(result).toEqual(mockExercise);
      expect(mockPrisma.authAccount.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: "FIREBASE",
            providerUserId: firebaseUid,
          },
        },
      });
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

    it("should throw if auth account not found", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.createExercise(centerId, {
          title: "Test",
          skill: "READING",
        }, "unknown-uid"),
      ).rejects.toThrow("User account not found");
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

    it("should allow title and bandLevel update on PUBLISHED exercises", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
        title: "New Title",
      });

      const result = await service.updateExercise(centerId, "ex-1", { title: "New Title" });

      expect(result.title).toBe("New Title");
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { title: "New Title", bandLevel: undefined },
        }),
      );
    });

    it("should reject content fields on PUBLISHED exercises", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.updateExercise(centerId, "ex-1", { instructions: "new" }),
      ).rejects.toThrow("Published exercises only allow updating: title, bandLevel");
    });

    it("should reject updates on ARCHIVED exercises", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "ARCHIVED",
      });

      await expect(
        service.updateExercise(centerId, "ex-1", { title: "New" }),
      ).rejects.toThrow("Archived exercises cannot be updated");
    });

    it("should throw 404 if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.updateExercise(centerId, "nonexistent", { title: "New" }),
      ).rejects.toThrow("Exercise not found");
    });

    it("should reject wordCountMax < wordCountMin when both in request", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);

      await expect(
        service.updateExercise(centerId, "ex-1", {
          wordCountMin: 250,
          wordCountMax: 100,
        }),
      ).rejects.toThrow("wordCountMax must be >= wordCountMin");
    });

    it("should reject wordCountMax < existing wordCountMin on partial update", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        wordCountMin: 150,
      });

      await expect(
        service.updateExercise(centerId, "ex-1", {
          wordCountMax: 50,
        }),
      ).rejects.toThrow("wordCountMax must be >= wordCountMin");
    });

    it("should reject wordCountMin > existing wordCountMax on partial update", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        wordCountMax: 200,
      });

      await expect(
        service.updateExercise(centerId, "ex-1", {
          wordCountMin: 300,
        }),
      ).rejects.toThrow("wordCountMax must be >= wordCountMin");
    });

    it("should accept valid wordCount partial update", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        wordCountMin: 150,
      });
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        wordCountMin: 150,
        wordCountMax: 300,
      });

      const result = await service.updateExercise(centerId, "ex-1", {
        wordCountMax: 300,
      });

      expect(result.wordCountMax).toBe(300);
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

  describe("createExercise — speaking fields", () => {
    it("should pass speaking fields through to Prisma create", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
      });
      mockDb.exercise.create.mockResolvedValue(mockExercise);

      await service.createExercise(centerId, {
        title: "Speaking Test",
        skill: "SPEAKING",
        speakingPrepTime: 60,
        speakingTime: 120,
        maxRecordingDuration: 60,
        enableTranscription: true,
      }, firebaseUid);

      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            speakingPrepTime: 60,
            speakingTime: 120,
            maxRecordingDuration: 60,
            enableTranscription: true,
          }),
        }),
      );
    });

    it("should default speaking fields to null/false when not provided", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
      });
      mockDb.exercise.create.mockResolvedValue(mockExercise);

      await service.createExercise(centerId, {
        title: "Speaking Test",
        skill: "SPEAKING",
      }, firebaseUid);

      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            speakingPrepTime: null,
            speakingTime: null,
            maxRecordingDuration: null,
            enableTranscription: false,
          }),
        }),
      );
    });
  });

  describe("updateExercise — speaking fields", () => {
    it("should update speaking fields via conditional spread", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        speakingPrepTime: 90,
        speakingTime: 150,
      });

      const result = await service.updateExercise(centerId, "ex-1", {
        speakingPrepTime: 90,
        speakingTime: 150,
      });

      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            speakingPrepTime: 90,
            speakingTime: 150,
          }),
        }),
      );
      expect(result.speakingPrepTime).toBe(90);
    });

    it("should only include provided speaking fields in update", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        enableTranscription: true,
      });

      await service.updateExercise(centerId, "ex-1", {
        enableTranscription: true,
      });

      const updateCall = mockDb.exercise.update.mock.calls[0][0];
      expect(updateCall.data.enableTranscription).toBe(true);
      // Other speaking fields should not be present since they weren't in input
      expect("speakingPrepTime" in updateCall.data).toBe(false);
      expect("speakingTime" in updateCall.data).toBe(false);
      expect("maxRecordingDuration" in updateCall.data).toBe(false);
    });
  });

  describe("autosaveExercise — speaking fields", () => {
    it("should autosave speaking fields through updateDraftExercise", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        speakingPrepTime: 60,
        speakingTime: 120,
        maxRecordingDuration: 90,
        enableTranscription: true,
      });

      const result = await service.autosaveExercise(centerId, "ex-1", {
        speakingPrepTime: 60,
        speakingTime: 120,
        maxRecordingDuration: 90,
        enableTranscription: true,
      });

      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            speakingPrepTime: 60,
            speakingTime: 120,
            maxRecordingDuration: 90,
            enableTranscription: true,
          }),
        }),
      );
      expect(result.speakingPrepTime).toBe(60);
      expect(result.enableTranscription).toBe(true);
    });
  });

  describe("uploadAudio", () => {
    const fileBuffer = Buffer.from("fake-audio-data");

    it("should upload audio and return URL", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        audioUrl: `https://storage.googleapis.com/${bucketName}/exercises/${centerId}/ex-1/audio/12345.mp3`,
      });

      const result = await service.uploadAudio(centerId, "ex-1", fileBuffer, "audio/mpeg");

      expect(result.audioUrl).toContain(`https://storage.googleapis.com/${bucketName}/`);
      expect(result.audioUrl).toContain("/audio/");
      expect(result.audioUrl).toContain(".mp3");
      expect(mockFile.save).toHaveBeenCalledWith(
        fileBuffer,
        expect.objectContaining({
          metadata: expect.objectContaining({
            contentType: "audio/mpeg",
          }),
        }),
      );
      expect(mockFile.makePublic).toHaveBeenCalled();
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          data: expect.objectContaining({
            audioUrl: expect.stringContaining(".mp3"),
          }),
        }),
      );
    });

    it("should map audio/wav to .wav extension", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadAudio(centerId, "ex-1", fileBuffer, "audio/wav");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringContaining(".wav"),
      );
    });

    it("should map audio/mp4 to .m4a extension", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadAudio(centerId, "ex-1", fileBuffer, "audio/mp4");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringContaining(".m4a"),
      );
    });

    it("should map audio/x-m4a to .m4a extension", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadAudio(centerId, "ex-1", fileBuffer, "audio/x-m4a");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringContaining(".m4a"),
      );
    });

    it("should include centerId and exerciseId in storage path", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadAudio(centerId, "ex-1", fileBuffer, "audio/mpeg");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`exercises/${centerId}/ex-1/audio/\\d+\\.mp3`)),
      );
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.uploadAudio(centerId, "ex-1", fileBuffer, "audio/mpeg"),
      ).rejects.toThrow("Only draft exercises can have audio uploaded");
    });

    it("should throw if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadAudio(centerId, "nonexistent", fileBuffer, "audio/mpeg"),
      ).rejects.toThrow();
    });
  });

  describe("deleteAudio", () => {
    const audioUrl = `https://storage.googleapis.com/${bucketName}/exercises/${centerId}/ex-1/audio/12345.mp3`;
    const exerciseWithAudio = {
      ...mockExercise,
      audioUrl,
      audioDuration: 300,
      audioSections: [{ label: "Section 1", startTime: 0, endTime: 150 }],
    };

    it("should delete audio file from storage and clear DB fields", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(exerciseWithAudio);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.deleteAudio(centerId, "ex-1");

      expect(mockFile.delete).toHaveBeenCalled();
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          data: expect.objectContaining({
            audioUrl: null,
            audioDuration: null,
          }),
        }),
      );
    });

    it("should clear audioSectionIndex on all related question sections", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(exerciseWithAudio);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.deleteAudio(centerId, "ex-1");

      expect(mockDb.questionSection.updateMany).toHaveBeenCalledWith({
        where: { exerciseId: "ex-1" },
        data: { audioSectionIndex: null },
      });
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...exerciseWithAudio,
        status: "PUBLISHED",
      });

      await expect(
        service.deleteAudio(centerId, "ex-1"),
      ).rejects.toThrow("Only draft exercises can have audio removed");
    });

    it("should handle exercise with no audioUrl gracefully", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        audioUrl: null,
      });
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.deleteAudio(centerId, "ex-1");

      // Should not attempt to delete from storage
      expect(mockFile.delete).not.toHaveBeenCalled();
      // Should still clear DB fields
      expect(mockDb.exercise.update).toHaveBeenCalled();
    });

    it("should continue if storage file deletion fails", async () => {
      mockFile.delete.mockRejectedValue(new Error("File not found"));
      mockDb.exercise.findUnique.mockResolvedValue(exerciseWithAudio);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      // Should not throw
      await service.deleteAudio(centerId, "ex-1");

      expect(mockDb.exercise.update).toHaveBeenCalled();
    });
  });

  describe("uploadStimulusImage", () => {
    const fileBuffer = Buffer.from("fake-image-data");

    it("should upload image and return URL", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        stimulusImageUrl: `https://storage.googleapis.com/${bucketName}/exercises/${centerId}/ex-1/stimulus-image/12345.png`,
      });

      const result = await service.uploadStimulusImage(centerId, "ex-1", fileBuffer, "image/png");

      expect(result.stimulusImageUrl).toContain(`https://storage.googleapis.com/${bucketName}/`);
      expect(result.stimulusImageUrl).toContain("/stimulus-image/");
      expect(result.stimulusImageUrl).toContain(".png");
      expect(mockFile.save).toHaveBeenCalledWith(
        fileBuffer,
        expect.objectContaining({
          metadata: expect.objectContaining({
            contentType: "image/png",
          }),
        }),
      );
      expect(mockFile.makePublic).toHaveBeenCalled();
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          data: expect.objectContaining({
            stimulusImageUrl: expect.stringContaining(".png"),
          }),
        }),
      );
    });

    it("should map image/jpeg to .jpg extension", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadStimulusImage(centerId, "ex-1", fileBuffer, "image/jpeg");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringContaining(".jpg"),
      );
    });

    it("should map image/svg+xml to .svg extension", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadStimulusImage(centerId, "ex-1", fileBuffer, "image/svg+xml");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringContaining(".svg"),
      );
    });

    it("should include centerId and exerciseId in storage path", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.uploadStimulusImage(centerId, "ex-1", fileBuffer, "image/png");

      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`exercises/${centerId}/ex-1/stimulus-image/\\d+\\.png`)),
      );
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.uploadStimulusImage(centerId, "ex-1", fileBuffer, "image/png"),
      ).rejects.toThrow("Only draft exercises can have stimulus images uploaded");
    });

    it("should throw if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadStimulusImage(centerId, "nonexistent", fileBuffer, "image/png"),
      ).rejects.toThrow();
    });
  });

  describe("deleteStimulusImage", () => {
    const stimulusImageUrl = `https://storage.googleapis.com/${bucketName}/exercises/${centerId}/ex-1/stimulus-image/12345.png`;
    const exerciseWithStimulus = {
      ...mockExercise,
      stimulusImageUrl,
    };

    it("should delete stimulus image from storage and clear DB field", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(exerciseWithStimulus);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.deleteStimulusImage(centerId, "ex-1");

      expect(mockFile.delete).toHaveBeenCalled();
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          data: expect.objectContaining({
            stimulusImageUrl: null,
          }),
        }),
      );
    });

    it("should throw if exercise is not DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...exerciseWithStimulus,
        status: "PUBLISHED",
      });

      await expect(
        service.deleteStimulusImage(centerId, "ex-1"),
      ).rejects.toThrow("Only draft exercises can have stimulus images removed");
    });

    it("should handle exercise with no stimulusImageUrl gracefully", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        stimulusImageUrl: null,
      });
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.deleteStimulusImage(centerId, "ex-1");

      expect(mockFile.delete).not.toHaveBeenCalled();
      expect(mockDb.exercise.update).toHaveBeenCalled();
    });

    it("should continue if storage file deletion fails", async () => {
      mockFile.delete.mockRejectedValue(new Error("File not found"));
      mockDb.exercise.findUnique.mockResolvedValue(exerciseWithStimulus);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      // Should not throw
      await service.deleteStimulusImage(centerId, "ex-1");

      expect(mockDb.exercise.update).toHaveBeenCalled();
    });
  });

  // --- Timer & Test Conditions (Story 3.10) ---

  describe("createExercise — timer fields", () => {
    it("should pass timer fields through to Prisma create", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
      });
      mockDb.exercise.create.mockResolvedValue(mockExercise);

      await service.createExercise(
        centerId,
        {
          title: "Timed Reading",
          skill: "READING",
          timeLimit: 3600,
          timerPosition: "top-bar",
          warningAlerts: [600, 300],
          autoSubmitOnExpiry: true,
          gracePeriodSeconds: 60,
          enablePause: false,
        },
        firebaseUid,
      );

      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeLimit: 3600,
            timerPosition: "top-bar",
            warningAlerts: [600, 300],
            autoSubmitOnExpiry: true,
            gracePeriodSeconds: 60,
            enablePause: false,
          }),
        }),
      );
    });

    it("should default timer fields when not provided", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
      });
      mockDb.exercise.create.mockResolvedValue(mockExercise);

      await service.createExercise(
        centerId,
        {
          title: "Untimed Reading",
          skill: "READING",
        },
        firebaseUid,
      );

      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeLimit: null,
            timerPosition: null,
            autoSubmitOnExpiry: true,
            gracePeriodSeconds: null,
            enablePause: false,
          }),
        }),
      );
      // warningAlerts is a Json field — must default to Prisma.DbNull, not null
      const callArgs = mockDb.exercise.create.mock.calls[0][0];
      expect(callArgs.data.warningAlerts).toBe(Prisma.DbNull);
    });
  });

  describe("updateExercise — timer fields", () => {
    it("should update timer fields with conditional spread", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.updateExercise(centerId, "ex-1", {
        timeLimit: 1800,
        timerPosition: "floating",
        warningAlerts: [300],
        autoSubmitOnExpiry: false,
        gracePeriodSeconds: null,
        enablePause: true,
      });

      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeLimit: 1800,
            timerPosition: "floating",
            warningAlerts: [300],
            autoSubmitOnExpiry: false,
            gracePeriodSeconds: null,
            enablePause: true,
          }),
        }),
      );
    });

    it("should use Prisma.DbNull when warningAlerts is null", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.updateExercise(centerId, "ex-1", {
        warningAlerts: null,
      });

      const callArgs = mockDb.exercise.update.mock.calls[0][0];
      expect(callArgs.data.warningAlerts).toBe(Prisma.DbNull);
    });

    it("should not include timer fields when not in input", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.updateExercise(centerId, "ex-1", {
        title: "Updated Title",
      });

      const callArgs = mockDb.exercise.update.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty("timeLimit");
      expect(callArgs.data).not.toHaveProperty("timerPosition");
      expect(callArgs.data).not.toHaveProperty("warningAlerts");
    });
  });

  describe("autosaveExercise — timer fields", () => {
    it("should autosave timer fields", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue(mockExercise);

      await service.autosaveExercise(centerId, "ex-1", {
        timeLimit: 3600,
        timerPosition: "top-bar",
        warningAlerts: [600, 300],
        autoSubmitOnExpiry: true,
        gracePeriodSeconds: 60,
        enablePause: false,
      });

      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeLimit: 3600,
            timerPosition: "top-bar",
            autoSubmitOnExpiry: true,
            gracePeriodSeconds: 60,
            enablePause: false,
          }),
        }),
      );
    });
  });

  // --- Story 3.14: Exercise Library Management ---

  describe("listExercises — questionType filter", () => {
    it("should filter by questionType", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { questionType: "R1_MCQ_SINGLE" });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sections: { some: { sectionType: "R1_MCQ_SINGLE" } },
          }),
        }),
      );
    });
  });

  describe("listExercises — excludeArchived filter", () => {
    it("should exclude archived exercises when excludeArchived=true", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { excludeArchived: true });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: "ARCHIVED" },
          }),
        }),
      );
    });

    it("should let explicit status filter take precedence over excludeArchived", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { excludeArchived: true, status: "ARCHIVED" });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ARCHIVED",
          }),
        }),
      );
    });
  });

  describe("duplicateExercise", () => {
    const sourceExercise = {
      ...mockExercise,
      status: "PUBLISHED",
      instructions: "Read carefully",
      passageContent: "A long passage",
      passageFormat: "plain",
      passageSourceType: null,
      passageSourceUrl: null,
      caseSensitive: false,
      partialCredit: true,
      audioUrl: null,
      audioDuration: null,
      playbackMode: null,
      audioSections: null,
      showTranscriptAfterSubmit: false,
      stimulusImageUrl: null,
      writingPrompt: null,
      letterTone: null,
      wordCountMin: null,
      wordCountMax: null,
      wordCountMode: null,
      sampleResponse: null,
      showSampleAfterGrading: false,
      speakingPrepTime: null,
      speakingTime: null,
      maxRecordingDuration: null,
      enableTranscription: false,
      timeLimit: 3600,
      timerPosition: "top-bar",
      warningAlerts: [300],
      autoSubmitOnExpiry: true,
      gracePeriodSeconds: 60,
      enablePause: false,
      bandLevel: "6-7",
      sections: [
        {
          id: "sec-1",
          sectionType: "R1_MCQ_SINGLE",
          instructions: "Choose one",
          orderIndex: 0,
          audioSectionIndex: null,
          sectionTimeLimit: null,
          questions: [
            {
              id: "q-1",
              questionText: "What is?",
              questionType: "R1_MCQ_SINGLE",
              options: { items: [{ label: "A", text: "Option A" }] },
              correctAnswer: { answer: "A" },
              orderIndex: 0,
              wordLimit: null,
            },
          ],
        },
      ],
      tagAssignments: [{ tagId: "tag-1" }],
    };

    beforeEach(() => {
      mockDb.authAccount.findUniqueOrThrow.mockResolvedValue({ userId });
    });

    it("should create a copy in DRAFT with 'Copy of' title", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(sourceExercise);
      mockDb.exercise.create.mockResolvedValue({ ...mockExercise, id: "ex-copy" });
      mockDb.questionSection.create.mockResolvedValue({ id: "sec-copy" });
      mockDb.question.create.mockResolvedValue({});
      mockDb.exerciseTagAssignment.createMany.mockResolvedValue({ count: 1 });
      mockDb.exercise.findUniqueOrThrow.mockResolvedValue({
        ...mockExercise,
        id: "ex-copy",
        title: `Copy of ${sourceExercise.title}`,
        status: "DRAFT",
      });

      const result = await service.duplicateExercise(centerId, "ex-1", firebaseUid);

      expect(result.title).toBe(`Copy of ${sourceExercise.title}`);
      expect(result.status).toBe("DRAFT");
      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: `Copy of ${sourceExercise.title}`,
            status: "DRAFT",
            timeLimit: 3600,
            bandLevel: "6-7",
            createdById: userId,
          }),
        }),
      );
    });

    it("should copy sections and questions", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(sourceExercise);
      mockDb.exercise.create.mockResolvedValue({ ...mockExercise, id: "ex-copy" });
      mockDb.questionSection.create.mockResolvedValue({ id: "sec-copy" });
      mockDb.question.create.mockResolvedValue({});
      mockDb.exerciseTagAssignment.createMany.mockResolvedValue({ count: 1 });
      mockDb.exercise.findUniqueOrThrow.mockResolvedValue({ ...mockExercise, id: "ex-copy" });

      await service.duplicateExercise(centerId, "ex-1", firebaseUid);

      expect(mockDb.questionSection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            exerciseId: "ex-copy",
            sectionType: "R1_MCQ_SINGLE",
          }),
        }),
      );
      expect(mockDb.question.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sectionId: "sec-copy",
            questionText: "What is?",
          }),
        }),
      );
    });

    it("should copy tag assignments", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(sourceExercise);
      mockDb.exercise.create.mockResolvedValue({ ...mockExercise, id: "ex-copy" });
      mockDb.questionSection.create.mockResolvedValue({ id: "sec-copy" });
      mockDb.question.create.mockResolvedValue({});
      mockDb.exerciseTagAssignment.createMany.mockResolvedValue({ count: 1 });
      mockDb.exercise.findUniqueOrThrow.mockResolvedValue({ ...mockExercise, id: "ex-copy" });

      await service.duplicateExercise(centerId, "ex-1", firebaseUid);

      expect(mockDb.exerciseTagAssignment.createMany).toHaveBeenCalledWith({
        data: [{ exerciseId: "ex-copy", tagId: "tag-1", centerId }],
      });
    });

    it("should throw 404 if source exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.duplicateExercise(centerId, "nonexistent", firebaseUid),
      ).rejects.toThrow("Exercise not found");
    });
  });

  describe("restoreExercise", () => {
    it("should transition ARCHIVED → DRAFT", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "ARCHIVED",
      });
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        status: "DRAFT",
      });

      const result = await service.restoreExercise(centerId, "ex-1");

      expect(result.status).toBe("DRAFT");
      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "DRAFT" },
        }),
      );
    });

    it("should reject non-ARCHIVED exercises", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise); // status: DRAFT

      await expect(
        service.restoreExercise(centerId, "ex-1"),
      ).rejects.toThrow("Only archived exercises can be restored");
    });

    it("should reject PUBLISHED exercises", async () => {
      mockDb.exercise.findUnique.mockResolvedValue({
        ...mockExercise,
        status: "PUBLISHED",
      });

      await expect(
        service.restoreExercise(centerId, "ex-1"),
      ).rejects.toThrow("Only archived exercises can be restored");
    });

    it("should throw 404 if exercise not found", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.restoreExercise(centerId, "nonexistent"),
      ).rejects.toThrow("Exercise not found");
    });
  });

  describe("bulkArchive", () => {
    it("should archive multiple exercises, skip already-archived", async () => {
      mockDb.exercise.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkArchive(centerId, ["ex-1", "ex-2", "ex-3"]);

      expect(result).toBe(2);
      expect(mockDb.exercise.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["ex-1", "ex-2", "ex-3"] }, status: { not: "ARCHIVED" } },
        data: { status: "ARCHIVED" },
      });
    });
  });

  describe("bulkDuplicate", () => {
    it("should create copies of multiple exercises", async () => {
      const source = {
        ...mockExercise,
        passageSourceType: null,
        passageSourceUrl: null,
        caseSensitive: false,
        partialCredit: false,
        audioUrl: null,
        audioDuration: null,
        playbackMode: null,
        audioSections: null,
        showTranscriptAfterSubmit: false,
        stimulusImageUrl: null,
        writingPrompt: null,
        letterTone: null,
        wordCountMin: null,
        wordCountMax: null,
        wordCountMode: null,
        sampleResponse: null,
        showSampleAfterGrading: false,
        speakingPrepTime: null,
        speakingTime: null,
        maxRecordingDuration: null,
        enableTranscription: false,
        timeLimit: null,
        timerPosition: null,
        warningAlerts: null,
        autoSubmitOnExpiry: true,
        gracePeriodSeconds: null,
        enablePause: false,
        bandLevel: null,
        sections: [],
        tagAssignments: [],
      };
      mockDb.authAccount.findUniqueOrThrow.mockResolvedValue({ userId });
      mockDb.exercise.findUnique.mockResolvedValue(source);
      mockDb.exercise.create.mockResolvedValue({ ...mockExercise, id: "ex-copy" });
      mockDb.exercise.findUniqueOrThrow.mockResolvedValue({ ...mockExercise, id: "ex-copy" });

      const result = await service.bulkDuplicate(centerId, ["ex-1", "ex-2"], firebaseUid);

      expect(result).toHaveLength(2);
    });
  });

  describe("bulkTag", () => {
    it("should add tags, ignoring duplicates", async () => {
      mockDb.exerciseTagAssignment.create.mockResolvedValue({});

      const result = await service.bulkTag(centerId, ["ex-1", "ex-2"], ["tag-1"]);

      expect(result).toBe(2);
      expect(mockDb.exerciseTagAssignment.create).toHaveBeenCalledTimes(2);
    });

    it("should count only successfully added tags (ignore P2002)", async () => {
      const uniqueError = Object.assign(new Error("unique violation"), { code: "P2002" });
      mockDb.exerciseTagAssignment.create
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(uniqueError);

      const result = await service.bulkTag(centerId, ["ex-1", "ex-2"], ["tag-1"]);

      expect(result).toBe(1);
    });

    it("should rethrow non-P2002 errors", async () => {
      const fkError = Object.assign(new Error("FK violation"), { code: "P2003" });
      mockDb.exerciseTagAssignment.create.mockRejectedValue(fkError);

      await expect(
        service.bulkTag(centerId, ["ex-1"], ["bad-tag"]),
      ).rejects.toThrow("FK violation");
    });
  });

  describe("bandLevel support", () => {
    it("should include bandLevel in createExercise", async () => {
      mockPrisma.authAccount.findUnique.mockResolvedValue({
        userId,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
      });
      mockDb.exercise.create.mockResolvedValue({
        ...mockExercise,
        bandLevel: "6-7",
        tagAssignments: [],
      });

      await service.createExercise(
        centerId,
        { title: "Test", skill: "READING", bandLevel: "6-7" },
        firebaseUid,
      );

      expect(mockDb.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bandLevel: "6-7",
          }),
        }),
      );
    });

    it("should include bandLevel in updateExercise", async () => {
      mockDb.exercise.findUnique.mockResolvedValue(mockExercise);
      mockDb.exercise.update.mockResolvedValue({
        ...mockExercise,
        bandLevel: "7-8",
        tagAssignments: [],
      });

      await service.updateExercise(centerId, "ex-1", { bandLevel: "7-8" });

      expect(mockDb.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bandLevel: "7-8",
          }),
        }),
      );
    });

    it("should filter by bandLevel in listExercises", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { bandLevel: "5-6" });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bandLevel: "5-6",
          }),
        }),
      );
    });

    it("should filter by tagIds in listExercises", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId, { tagIds: ["t1", "t2"] });

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tagAssignments: { some: { tagId: { in: ["t1", "t2"] } } },
          }),
        }),
      );
    });

    it("should include tagAssignments in listExercises include", async () => {
      mockDb.exercise.findMany.mockResolvedValue([]);

      await service.listExercises(centerId);

      expect(mockDb.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            tagAssignments: expect.any(Object),
          }),
        }),
      );
    });
  });
});
