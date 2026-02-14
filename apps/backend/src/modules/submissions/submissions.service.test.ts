import { vi, describe, it, expect, beforeEach } from "vitest";
import { SubmissionsService } from "./submissions.service.js";

describe("SubmissionsService", () => {
  let service: SubmissionsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStorage: any;
  const bucketName = "test-bucket";

  const centerId = "center-123";
  const firebaseUid = "firebase-uid-456";
  const userId = "user-456";
  const assignmentId = "assign-1";
  const submissionId = "sub-1";
  const questionId = "q-1";

  const mockAuthAccount = { userId };
  const mockAssignment = {
    id: assignmentId,
    centerId,
    status: "OPEN",
    exerciseId: "ex-1",
  };

  const mockSubmission = {
    id: submissionId,
    centerId,
    assignmentId,
    studentId: userId,
    status: "IN_PROGRESS",
    startedAt: new Date(),
    submittedAt: null,
    timeSpentSec: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    answers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      submission: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      studentAnswer: {
        upsert: vi.fn(),
        update: vi.fn(),
      },
      assignment: {
        findUnique: vi.fn(),
      },
      assignmentStudent: {
        findFirst: vi.fn(),
      },
      authAccount: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(mockAuthAccount),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: vi.fn((fn: (tx: typeof mockDb) => Promise<unknown>) => fn(mockDb)),
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockDb),
    };

    const mockBucket = {
      file: vi.fn().mockReturnValue({
        save: vi.fn().mockResolvedValue(undefined),
        makePublic: vi.fn().mockResolvedValue(undefined),
      }),
      name: bucketName,
    };
    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };

    service = new SubmissionsService(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma as any,
      mockStorage,
      bucketName,
    );
  });

  describe("startSubmission", () => {
    it("should create a new submission for a valid assignment", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue({ assignmentId, studentId: userId });
      mockDb.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockDb.submission.findFirst.mockResolvedValue(null);
      mockDb.submission.create.mockResolvedValue(mockSubmission);

      const result = await service.startSubmission(centerId, assignmentId, firebaseUid);

      expect(result).toEqual(mockSubmission);
      expect(mockDb.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            centerId,
            assignmentId,
            studentId: userId,
            status: "IN_PROGRESS",
          }),
        }),
      );
    });

    it("should return existing submission if already started (idempotent)", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue({ assignmentId, studentId: userId });
      mockDb.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockDb.submission.findFirst.mockResolvedValue(mockSubmission);

      const result = await service.startSubmission(centerId, assignmentId, firebaseUid);

      expect(result).toEqual(mockSubmission);
      expect(mockDb.submission.create).not.toHaveBeenCalled();
    });

    it("should throw NotFound if student not assigned to assignment", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue(null);

      await expect(
        service.startSubmission(centerId, assignmentId, firebaseUid),
      ).rejects.toThrow("Assignment not found or you are not assigned to it");
    });

    it("should reject closed assignment", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue({ assignmentId, studentId: userId });
      mockDb.assignment.findUnique.mockResolvedValue({ ...mockAssignment, status: "CLOSED" });

      await expect(
        service.startSubmission(centerId, assignmentId, firebaseUid),
      ).rejects.toThrow("This assignment is no longer accepting submissions");
    });

    it("should reject archived assignment", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue({ assignmentId, studentId: userId });
      mockDb.assignment.findUnique.mockResolvedValue({ ...mockAssignment, status: "ARCHIVED" });

      await expect(
        service.startSubmission(centerId, assignmentId, firebaseUid),
      ).rejects.toThrow("This assignment is no longer accepting submissions");
    });
  });

  describe("getSubmission", () => {
    it("should return submission with answers for own submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await service.getSubmission(centerId, submissionId, firebaseUid);

      expect(result).toEqual(mockSubmission);
    });

    it("should throw NotFound for invalid submission ID", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.getSubmission(centerId, "invalid-id", firebaseUid),
      ).rejects.toThrow("Submission not found");
    });

    it("should throw Forbidden if accessing another student's submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        studentId: "other-student",
      });

      await expect(
        service.getSubmission(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("You can only access your own submissions");
    });
  });

  describe("saveAnswers", () => {
    it("should upsert answers for IN_PROGRESS submission", async () => {
      mockDb.submission.findUnique
        .mockResolvedValueOnce(mockSubmission) // first call for validation
        .mockResolvedValueOnce({ ...mockSubmission, answers: [{ questionId, answer: { answer: "A" } }] }); // second call for return
      mockDb.studentAnswer.upsert.mockResolvedValue({});

      const answers = [{ questionId, answer: { answer: "A" } }];
      const result = await service.saveAnswers(centerId, submissionId, answers, firebaseUid);

      expect(mockDb.studentAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            submissionId_questionId: { submissionId, questionId },
          },
        }),
      );
      expect(result).toBeDefined();
    });

    it("should reject saving to submitted submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: "SUBMITTED",
      });

      await expect(
        service.saveAnswers(centerId, submissionId, [{ questionId }], firebaseUid),
      ).rejects.toThrow("Cannot modify a submitted submission");
    });

    it("should reject saving to another student's submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        studentId: "other-student",
      });

      await expect(
        service.saveAnswers(centerId, submissionId, [{ questionId }], firebaseUid),
      ).rejects.toThrow("You can only modify your own submissions");
    });
  });

  describe("submitSubmission", () => {
    const mockSubmissionWithExercise = {
      ...mockSubmission,
      answers: [
        {
          id: "ans-1",
          questionId: "q-mcq",
          answer: { answer: "A" },
          submissionId,
          centerId,
        },
      ],
      assignment: {
        exercise: {
          caseSensitive: false,
          sections: [
            {
              questions: [
                {
                  id: "q-mcq",
                  questionType: "R1_MCQ_SINGLE",
                  correctAnswer: { answer: "A" },
                },
              ],
            },
          ],
        },
      },
    };

    it("should mark submission as SUBMITTED and auto-grade", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmissionWithExercise);
      mockDb.studentAnswer.update.mockResolvedValue({});
      mockDb.submission.update.mockResolvedValue({
        ...mockSubmission,
        status: "SUBMITTED",
        submittedAt: new Date(),
      });

      const result = await service.submitSubmission(centerId, submissionId, 300, firebaseUid);

      expect(result.status).toBe("SUBMITTED");
      expect(mockDb.studentAnswer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ans-1" },
          data: { isCorrect: true, score: 1 },
        }),
      );
    });

    it("should auto-grade incorrect MCQ answer", async () => {
      const wrongAnswerSubmission = {
        ...mockSubmissionWithExercise,
        answers: [
          {
            id: "ans-1",
            questionId: "q-mcq",
            answer: { answer: "B" },
            submissionId,
            centerId,
          },
        ],
      };
      mockDb.submission.findUnique.mockResolvedValue(wrongAnswerSubmission);
      mockDb.studentAnswer.update.mockResolvedValue({});
      mockDb.submission.update.mockResolvedValue({
        ...mockSubmission,
        status: "SUBMITTED",
      });

      await service.submitSubmission(centerId, submissionId, undefined, firebaseUid);

      expect(mockDb.studentAnswer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isCorrect: false, score: 0 },
        }),
      );
    });

    it("should reject already submitted submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmissionWithExercise,
        status: "SUBMITTED",
      });

      await expect(
        service.submitSubmission(centerId, submissionId, undefined, firebaseUid),
      ).rejects.toThrow("This submission has already been submitted");
    });

    it("should reject submitting another student's submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmissionWithExercise,
        studentId: "other-student",
      });

      await expect(
        service.submitSubmission(centerId, submissionId, undefined, firebaseUid),
      ).rejects.toThrow("You can only submit your own submissions");
    });
  });

  describe("uploadPhoto", () => {
    it("should upload photo and upsert student answer", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.studentAnswer.upsert.mockResolvedValue({});

      const buffer = Buffer.from("fake-image-data");
      const result = await service.uploadPhoto(
        centerId, submissionId, questionId, buffer, "image/jpeg", firebaseUid,
      );

      expect(result.photoUrl).toContain("storage.googleapis.com");
      expect(result.photoUrl).toContain(submissionId);
      expect(mockDb.studentAnswer.upsert).toHaveBeenCalled();
    });

    it("should reject invalid file type", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const buffer = Buffer.from("fake");
      await expect(
        service.uploadPhoto(centerId, submissionId, questionId, buffer, "application/pdf", firebaseUid),
      ).rejects.toThrow("Invalid file type");
    });

    it("should reject file exceeding 5MB", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const buffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      await expect(
        service.uploadPhoto(centerId, submissionId, questionId, buffer, "image/jpeg", firebaseUid),
      ).rejects.toThrow("File size exceeds 5MB limit");
    });

    it("should reject upload to submitted submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: "SUBMITTED",
      });

      const buffer = Buffer.from("fake");
      await expect(
        service.uploadPhoto(centerId, submissionId, questionId, buffer, "image/jpeg", firebaseUid),
      ).rejects.toThrow("Cannot upload to a submitted submission");
    });
  });

  describe("hasSubmissions", () => {
    it("should return true when submissions exist", async () => {
      mockDb.submission.count.mockResolvedValue(3);

      const result = await service.hasSubmissions(centerId, assignmentId);

      expect(result).toBe(true);
    });

    it("should return false when no submissions exist", async () => {
      mockDb.submission.count.mockResolvedValue(0);

      const result = await service.hasSubmissions(centerId, assignmentId);

      expect(result).toBe(false);
    });
  });

  describe("getSubmissionByAssignment", () => {
    it("should return submission status for an assignment", async () => {
      mockDb.submission.findFirst.mockResolvedValue({ id: submissionId, status: "IN_PROGRESS" });

      const result = await service.getSubmissionByAssignment(centerId, assignmentId, firebaseUid);

      expect(result).toEqual({ id: submissionId, status: "IN_PROGRESS" });
      expect(mockDb.submission.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assignmentId, studentId: userId },
          select: { id: true, status: true },
        }),
      );
    });

    it("should return null when no submission exists", async () => {
      mockDb.submission.findFirst.mockResolvedValue(null);

      const result = await service.getSubmissionByAssignment(centerId, assignmentId, firebaseUid);

      expect(result).toBeNull();
    });
  });

  describe("getStudentAssignmentWithExercise", () => {
    it("should return assignment with exercise content excluding correctAnswer", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue({ assignmentId, studentId: userId });
      mockDb.assignment.findUnique.mockResolvedValue({
        id: assignmentId,
        exercise: {
          id: "ex-1",
          title: "Test Exercise",
          sections: [
            {
              questions: [
                {
                  id: "q-1",
                  questionText: "What is?",
                  questionType: "R1_MCQ_SINGLE",
                  options: { items: [{ label: "A", text: "Option A" }] },
                  // No correctAnswer — excluded by select
                  orderIndex: 0,
                },
              ],
            },
          ],
        },
      });

      const result = await service.getStudentAssignmentWithExercise(centerId, assignmentId, firebaseUid);

      expect(result).toBeDefined();
      expect(result.exercise.sections[0].questions[0]).not.toHaveProperty("correctAnswer");
    });

    it("should throw NotFound if student not assigned", async () => {
      mockDb.assignmentStudent.findFirst.mockResolvedValue(null);

      await expect(
        service.getStudentAssignmentWithExercise(centerId, assignmentId, firebaseUid),
      ).rejects.toThrow("Assignment not found or you are not assigned to it");
    });
  });
});
