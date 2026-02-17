import { vi, describe, it, expect, beforeEach } from "vitest";
import { GradingService } from "./grading.service.js";

// Mock inngest
vi.mock("../inngest/client.js", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("GradingService", () => {
  let service: GradingService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  const centerId = "center-123";
  const submissionId = "sub-1";
  const firebaseUid = "firebase-teacher-1";

  const mockSubmission = {
    id: submissionId,
    centerId,
    assignmentId: "assign-1",
    studentId: "student-1",
    status: "SUBMITTED",
    submittedAt: new Date(),
    assignment: {
      exercise: { skill: "WRITING", title: "Essay Test" },
      class: { id: "class-1", name: "IELTS A", teacherId: "teacher-1" },
    },
    answers: [],
  };

  const mockGradingJob = {
    id: "job-1",
    centerId,
    submissionId,
    status: "pending",
    error: null,
    errorCategory: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeedback = {
    id: "fb-1",
    centerId,
    submissionId,
    overallScore: 6.5,
    criteriaScores: { taskAchievement: 6.0, coherence: 7.0, lexicalResource: 6.5, grammaticalRange: 6.5 },
    generalFeedback: "Good essay with room for improvement.",
    teacherFinalScore: null,
    teacherCriteriaScores: null,
    teacherGeneralFeedback: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: "item-1",
        centerId,
        submissionFeedbackId: "fb-1",
        type: "grammar",
        content: "Subject-verb agreement error",
        startOffset: 10,
        endOffset: 20,
        originalContextSnippet: "the students was",
        suggestedFix: "were",
        severity: "error",
        confidence: 0.95,
        isApproved: null,
        approvedAt: null,
        teacherOverrideText: null,
        createdAt: new Date(),
      },
    ],
  };

  const mockAuthAccount = {
    userId: "teacher-1",
    provider: "FIREBASE",
    providerUserId: firebaseUid,
  };

  const mockTeacherMembership = {
    role: "TEACHER",
  };

  const mockAdminMembership = {
    role: "ADMIN",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      submission: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      gradingJob: {
        create: vi.fn().mockResolvedValue(mockGradingJob),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue(mockGradingJob),
      },
      submissionFeedback: {
        findUnique: vi.fn(),
        deleteMany: vi.fn(),
      },
      authAccount: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(mockAuthAccount),
      },
      centerMembership: {
        findFirst: vi.fn().mockResolvedValue(mockTeacherMembership),
      },
      teacherComment: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockPrisma = { $extends: vi.fn().mockReturnValue(mockDb) } as any;
    service = new GradingService(mockPrisma);
  });

  describe("triggerAnalysis", () => {
    it("should create grading job and send inngest event for Writing submission", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue(null);

      const { inngest } = await import("../inngest/client.js");
      const result = await service.triggerAnalysis(centerId, submissionId, firebaseUid);

      expect(result).toEqual(mockGradingJob);
      expect(mockDb.gradingJob.create).toHaveBeenCalledWith({
        data: { centerId, submissionId, status: "pending" },
      });
      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "grading/analyze-submission",
          data: { jobId: mockGradingJob.id, submissionId, centerId },
        }),
      );
    });

    it("should update existing grading job on retrigger", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue(mockGradingJob);

      await service.triggerAnalysis(centerId, submissionId, firebaseUid);

      expect(mockDb.gradingJob.update).toHaveBeenCalledWith({
        where: { id: mockGradingJob.id },
        data: { status: "pending", error: null, errorCategory: null },
      });
      expect(mockDb.gradingJob.create).not.toHaveBeenCalled();
    });

    it("should throw if submission not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.triggerAnalysis(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("Submission not found");
    });

    it("should throw for Reading submission (not AI-gradable)", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          exercise: { skill: "READING" },
          class: { teacherId: "teacher-1" },
        },
      });

      await expect(
        service.triggerAnalysis(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("AI analysis is only available for Writing and Speaking");
    });

    it("should throw if submission is not SUBMITTED", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: "IN_PROGRESS",
      });

      await expect(
        service.triggerAnalysis(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("Submission must be in SUBMITTED status");
    });

    it("should throw forbidden when teacher does not teach the class", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          exercise: { skill: "WRITING" },
          class: { teacherId: "other-teacher" },
        },
      });

      await expect(
        service.triggerAnalysis(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("You can only access submissions from your classes");
    });

    it("should allow ADMIN to access submissions from any class", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          exercise: { skill: "WRITING" },
          class: { teacherId: "other-teacher" },
        },
      });
      mockDb.centerMembership.findFirst.mockResolvedValue(mockAdminMembership);
      mockDb.gradingJob.findUnique.mockResolvedValue(null);

      const result = await service.triggerAnalysis(centerId, submissionId, firebaseUid);

      expect(result).toEqual(mockGradingJob);
    });
  });

  describe("getAnalysisResults", () => {
    it("should return submission with analysis status and feedback", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue({ ...mockGradingJob, status: "completed" });
      mockDb.submissionFeedback.findUnique.mockResolvedValue(mockFeedback);

      const result = await service.getAnalysisResults(centerId, submissionId, firebaseUid);

      expect(result.analysisStatus).toBe("ready");
      expect(result.feedback).toBeTruthy();
    });

    it("should return analyzing status when job is processing", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue({ ...mockGradingJob, status: "processing" });
      mockDb.submissionFeedback.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisResults(centerId, submissionId, firebaseUid);

      expect(result.analysisStatus).toBe("analyzing");
      expect(result.feedback).toBeNull();
    });

    it("should return failed status when job failed", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue({ ...mockGradingJob, status: "failed" });
      mockDb.submissionFeedback.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisResults(centerId, submissionId, firebaseUid);

      expect(result.analysisStatus).toBe("failed");
    });

    it("should return not_applicable for Reading submissions", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          ...mockSubmission.assignment,
          exercise: { skill: "READING", title: "Reading Test" },
        },
      });
      mockDb.gradingJob.findUnique.mockResolvedValue(null);
      mockDb.submissionFeedback.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisResults(centerId, submissionId, firebaseUid);

      expect(result.analysisStatus).toBe("not_applicable");
    });

    it("should return failed when no grading job exists for Writing", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue(null);
      mockDb.submissionFeedback.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisResults(centerId, submissionId, firebaseUid);

      expect(result.analysisStatus).toBe("failed");
    });

    it("should throw if submission not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.getAnalysisResults(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("Submission not found");
    });

    it("should throw forbidden when teacher does not teach the class", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          ...mockSubmission.assignment,
          class: { id: "class-1", name: "IELTS A", teacherId: "other-teacher" },
        },
      });

      await expect(
        service.getAnalysisResults(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("You can only access submissions from your classes");
    });
  });

  describe("getGradingQueue", () => {
    it("should return paginated queue of Writing/Speaking submissions", async () => {
      mockDb.submission.count.mockResolvedValue(1);
      mockDb.submission.findMany.mockResolvedValue([
        {
          id: submissionId,
          submittedAt: new Date("2026-02-16"),
          student: { name: "Student A" },
          assignment: { exercise: { title: "Essay 1", skill: "WRITING" } },
          gradingJob: { status: "completed", error: null },
        },
      ]);

      const result = await service.getGradingQueue(centerId, firebaseUid, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.analysisStatus).toBe("ready");
      expect(result.items[0]!.studentName).toBe("Student A");
      expect(result.total).toBe(1);
    });

    it("should filter by analysis status with correct total", async () => {
      // When status filter is used, all submissions are fetched and filtered in JS
      mockDb.submission.findMany.mockResolvedValue([
        {
          id: "sub-1",
          submittedAt: new Date(),
          student: { name: "A" },
          assignment: { exercise: { title: "E1", skill: "WRITING" } },
          gradingJob: { status: "completed", error: null },
        },
        {
          id: "sub-2",
          submittedAt: new Date(),
          student: { name: "B" },
          assignment: { exercise: { title: "E2", skill: "WRITING" } },
          gradingJob: { status: "failed", error: "timeout" },
        },
      ]);

      const result = await service.getGradingQueue(centerId, firebaseUid, {
        page: 1,
        limit: 20,
        status: "failed",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.analysisStatus).toBe("failed");
      // Total reflects filtered count, not total DB count
      expect(result.total).toBe(1);
    });
  });

  describe("getSubmissionFeedback", () => {
    it("should return feedback with items", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.submissionFeedback.findUnique.mockResolvedValue(mockFeedback);

      const result = await service.getSubmissionFeedback(centerId, submissionId, firebaseUid);

      expect(result).toBeTruthy();
    });

    it("should throw if submission not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.getSubmissionFeedback(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("Submission not found");
    });

    it("should throw if no feedback available", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.submissionFeedback.findUnique.mockResolvedValue(null);

      await expect(
        service.getSubmissionFeedback(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("No feedback available");
    });

    it("should throw forbidden when teacher does not teach the class", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          ...mockSubmission.assignment,
          class: { teacherId: "other-teacher" },
        },
      });

      await expect(
        service.getSubmissionFeedback(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("You can only access submissions from your classes");
    });
  });

  describe("createComment", () => {
    const createData = {
      content: "Great use of vocabulary here!",
      startOffset: 10,
      endOffset: 30,
      originalContextSnippet: "the students were",
      visibility: "student_facing" as const,
    };

    const mockCreatedComment = {
      id: "comment-1",
      centerId,
      submissionId,
      authorId: "teacher-1",
      content: createData.content,
      startOffset: createData.startOffset,
      endOffset: createData.endOffset,
      originalContextSnippet: createData.originalContextSnippet,
      visibility: createData.visibility,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { name: "Teacher One", avatarUrl: null },
    };

    it("should create a comment with anchor offsets", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.create.mockResolvedValue(mockCreatedComment);

      const result = await service.createComment(centerId, submissionId, firebaseUid, createData);

      expect(mockDb.teacherComment.create).toHaveBeenCalledWith({
        data: {
          centerId,
          submissionId,
          authorId: "teacher-1",
          content: createData.content,
          startOffset: createData.startOffset,
          endOffset: createData.endOffset,
          originalContextSnippet: createData.originalContextSnippet,
          visibility: createData.visibility,
        },
        include: { author: { select: { name: true, avatarUrl: true } } },
      });
      expect(result.authorName).toBe("Teacher One");
    });

    it("should create a general comment (no offsets)", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.create.mockResolvedValue({
        ...mockCreatedComment,
        startOffset: null,
        endOffset: null,
        originalContextSnippet: null,
      });

      const result = await service.createComment(centerId, submissionId, firebaseUid, {
        content: "General comment",
        startOffset: null,
        endOffset: null,
        visibility: "student_facing",
      });

      expect(result).toBeTruthy();
      expect(mockDb.teacherComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startOffset: null,
            endOffset: null,
          }),
        }),
      );
    });

    it("should throw if submission not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment(centerId, submissionId, firebaseUid, createData),
      ).rejects.toThrow("Submission not found");
    });

    it("should throw for negative offsets", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.createComment(centerId, submissionId, firebaseUid, {
          ...createData,
          startOffset: -1,
        }),
      ).rejects.toThrow("Offsets must be non-negative");
    });

    it("should throw if endOffset <= startOffset", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.createComment(centerId, submissionId, firebaseUid, {
          ...createData,
          startOffset: 20,
          endOffset: 10,
        }),
      ).rejects.toThrow("endOffset must be greater than startOffset");
    });
  });

  describe("getComments", () => {
    const mockComments = [
      {
        id: "c1",
        submissionId,
        content: "Comment 1",
        visibility: "student_facing",
        createdAt: new Date("2026-01-01"),
        author: { name: "Teacher", avatarUrl: null },
      },
    ];

    it("should return comments ordered by createdAt", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findMany.mockResolvedValue(mockComments);

      const result = await service.getComments(centerId, submissionId, firebaseUid);

      expect(result).toHaveLength(1);
      expect(result[0]!.authorName).toBe("Teacher");
      expect(mockDb.teacherComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        }),
      );
    });

    it("should filter by visibility when provided", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findMany.mockResolvedValue(mockComments);

      await service.getComments(centerId, submissionId, firebaseUid, "private");

      expect(mockDb.teacherComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { submissionId, visibility: "private" },
        }),
      );
    });

    it("should throw if submission not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.getComments(centerId, submissionId, firebaseUid),
      ).rejects.toThrow("Submission not found");
    });
  });

  describe("updateComment", () => {
    const commentId = "comment-1";
    const mockComment = {
      id: commentId,
      submissionId,
      authorId: "teacher-1",
      content: "Original",
      visibility: "student_facing",
    };

    it("should update comment content", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findFirst.mockResolvedValue(mockComment);
      mockDb.teacherComment.update.mockResolvedValue({
        ...mockComment,
        content: "Updated",
        author: { name: "Teacher", avatarUrl: null },
      });

      const result = await service.updateComment(
        centerId, submissionId, commentId, firebaseUid, { content: "Updated" },
      );

      expect(result.authorName).toBe("Teacher");
      expect(mockDb.teacherComment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { content: "Updated" },
        include: { author: { select: { name: true, avatarUrl: true } } },
      });
    });

    it("should throw if comment not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findFirst.mockResolvedValue(null);

      await expect(
        service.updateComment(centerId, submissionId, commentId, firebaseUid, { content: "X" }),
      ).rejects.toThrow("Comment not found");
    });

    it("should throw if teacher is not the author", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findFirst.mockResolvedValue({
        ...mockComment,
        authorId: "other-teacher",
      });

      await expect(
        service.updateComment(centerId, submissionId, commentId, firebaseUid, { content: "X" }),
      ).rejects.toThrow("You can only edit your own comments");
    });
  });

  describe("deleteComment", () => {
    const commentId = "comment-1";
    const mockComment = {
      id: commentId,
      submissionId,
      authorId: "teacher-1",
    };

    it("should delete the comment", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findFirst.mockResolvedValue(mockComment);
      mockDb.teacherComment.delete.mockResolvedValue(mockComment);

      await service.deleteComment(centerId, submissionId, commentId, firebaseUid);

      expect(mockDb.teacherComment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });
    });

    it("should throw if comment not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteComment(centerId, submissionId, commentId, firebaseUid),
      ).rejects.toThrow("Comment not found");
    });

    it("should throw if teacher is not the author", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.teacherComment.findFirst.mockResolvedValue({
        ...mockComment,
        authorId: "other-teacher",
      });

      await expect(
        service.deleteComment(centerId, submissionId, commentId, firebaseUid),
      ).rejects.toThrow("You can only delete your own comments");
    });
  });

  describe("getAnalysisResults - teacherComments", () => {
    it("should include teacherComments in result", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue({ ...mockGradingJob, status: "completed" });
      mockDb.submissionFeedback.findUnique.mockResolvedValue(mockFeedback);
      mockDb.teacherComment.findMany.mockResolvedValue([
        {
          id: "tc-1",
          content: "Nice work",
          submissionId,
          author: { name: "Teacher A", avatarUrl: "http://img.png" },
        },
      ]);

      const result = await service.getAnalysisResults(centerId, submissionId, firebaseUid);

      expect(result.teacherComments).toHaveLength(1);
      expect((result.teacherComments[0] as { authorName: string }).authorName).toBe("Teacher A");
    });
  });
});
