import Fastify, { FastifyInstance } from "fastify";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { gradingRoutes } from "./grading.routes.js";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

describe("Student Feedback Routes Integration", () => {
  let app: FastifyInstance;

  const mockApprovedItem = {
    id: "item-1",
    centerId: "center-1",
    submissionFeedbackId: "fb-1",
    questionId: null,
    type: "grammar",
    content: "Subject-verb agreement error",
    startOffset: 5,
    endOffset: 15,
    originalContextSnippet: "they was good",
    suggestedFix: "they were good",
    severity: "error",
    confidence: 0.95,
    isApproved: true,
    approvedAt: new Date(),
    teacherOverrideText: null,
    createdAt: new Date(),
  };

  const mockRejectedItem = {
    id: "item-2",
    centerId: "center-1",
    submissionFeedbackId: "fb-1",
    questionId: null,
    type: "vocabulary",
    content: "Consider using a different word",
    startOffset: 20,
    endOffset: 30,
    originalContextSnippet: "nice weather",
    suggestedFix: "pleasant weather",
    severity: "suggestion",
    confidence: 0.6,
    isApproved: false,
    approvedAt: null,
    teacherOverrideText: null,
    createdAt: new Date(),
  };

  const mockStudentFacingComment = {
    id: "comment-1",
    centerId: "center-1",
    submissionId: "sub-1",
    authorId: "teacher-1",
    content: "Great improvement!",
    startOffset: null,
    endOffset: null,
    originalContextSnippet: null,
    visibility: "student_facing",
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { name: "Teacher One", avatarUrl: null },
  };

  const mockPrivateComment = {
    id: "comment-2",
    centerId: "center-1",
    submissionId: "sub-1",
    authorId: "teacher-1",
    content: "Need to discuss with parent",
    startOffset: null,
    endOffset: null,
    originalContextSnippet: null,
    visibility: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { name: "Teacher One", avatarUrl: null },
  };

  const mockSubmission = {
    id: "sub-1",
    centerId: "center-1",
    assignmentId: "assign-1",
    studentId: "student-1",
    status: "GRADED",
    submittedAt: new Date("2026-02-16"),
    answers: [{ id: "ans-1", questionId: "q-1", answer: { text: "they was good weather" }, score: null }],
    assignment: {
      exercise: { skill: "WRITING" },
    },
    feedback: {
      id: "fb-1",
      centerId: "center-1",
      submissionId: "sub-1",
      overallScore: 5.5,
      criteriaScores: { taskAchievement: 5, coherence: 6, lexicalResource: 5.5, grammaticalRange: 5.5 },
      generalFeedback: "AI generated feedback",
      teacherFinalScore: 6.0,
      teacherCriteriaScores: { taskAchievement: 6, coherence: 6, lexicalResource: 6, grammaticalRange: 6 },
      teacherGeneralFeedback: "Teacher override feedback",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [mockApprovedItem, mockRejectedItem],
    },
    teacherComments: [mockStudentFacingComment, mockPrivateComment],
  };

  const mockPrisma = {
    $extends: vi.fn(),
  };

  const mockDb = {
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    gradingJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    submissionFeedback: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    aIFeedbackItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    authAccount: {
      findUniqueOrThrow: vi.fn(),
    },
    centerMembership: {
      findFirst: vi.fn(),
    },
    teacherComment: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const mockFirebaseAuth = {
    verifyIdToken: vi.fn(),
  };

  function mockStudentAuth() {
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "firebase-student-1",
      email: "student@test.com",
      role: "STUDENT",
      center_id: "center-1",
    });
    mockDb.authAccount.findUniqueOrThrow.mockResolvedValue({
      userId: "student-1",
      provider: "FIREBASE",
      providerUserId: "firebase-student-1",
    });
    mockDb.centerMembership.findFirst.mockResolvedValue({ role: "STUDENT" });
  }

  function mockTeacherAuth() {
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "firebase-teacher-1",
      email: "teacher@test.com",
      role: "TEACHER",
      center_id: "center-1",
    });
    mockDb.authAccount.findUniqueOrThrow.mockResolvedValue({
      userId: "teacher-1",
      provider: "FIREBASE",
      providerUserId: "firebase-teacher-1",
    });
    mockDb.centerMembership.findFirst.mockResolvedValue({ role: "TEACHER" });
  }

  function mockOtherStudentAuth() {
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "firebase-student-2",
      email: "other@test.com",
      role: "STUDENT",
      center_id: "center-1",
    });
    mockDb.authAccount.findUniqueOrThrow.mockResolvedValue({
      userId: "student-2",
      provider: "FIREBASE",
      providerUserId: "firebase-student-2",
    });
    mockDb.centerMembership.findFirst.mockResolvedValue({ role: "STUDENT" });
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    mockPrisma.$extends.mockReturnValue(mockDb);

    app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).prisma = mockPrisma;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).firebaseAuth = mockFirebaseAuth;

    await app.register(gradingRoutes, { prefix: "/api/v1/grading" });
    await app.ready();
  });

  describe("GET /student/submissions/:submissionId", () => {
    it("should return 200 — student can fetch their own graded submission", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Student feedback retrieved");
      expect(body.data.submission.id).toBe("sub-1");
    });

    it("should return 403 — student CANNOT fetch another student's submission", async () => {
      mockOtherStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer other-student-token" },
      });

      expect(response.statusCode).toBe(403);
    });

    it("should contain only approved AI feedback items", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const items = body.data.feedback.items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("item-1");
      expect(items[0].isApproved).toBe(true);
    });

    it("should contain only student_facing teacher comments", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const comments = body.data.teacherComments;
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe("comment-1");
      expect(comments[0].visibility).toBe("student_facing");
    });

    it("should prefer teacher override scores over AI scores", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Teacher override: 6.0, AI: 5.5 — should use teacher override
      expect(body.data.feedback.overallScore).toBe(6.0);
      expect(body.data.feedback.criteriaScores.taskAchievement).toBe(6);
      expect(body.data.feedback.generalFeedback).toBe("Teacher override feedback");
    });

    it("should fall back to AI scores when no teacher overrides", async () => {
      mockStudentAuth();
      const noOverrideSubmission = {
        ...mockSubmission,
        feedback: {
          ...mockSubmission.feedback,
          teacherFinalScore: null,
          teacherCriteriaScores: null,
          teacherGeneralFeedback: null,
        },
      };
      mockDb.submission.findUnique.mockResolvedValue(noOverrideSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.feedback.overallScore).toBe(5.5);
      expect(body.data.feedback.generalFeedback).toBe("AI generated feedback");
    });

    it("should allow teacher/admin to access any student's feedback", async () => {
      mockTeacherAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer teacher-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.submission.id).toBe("sub-1");
    });

    it("should return 404 when submission not found", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/nonexistent",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should return 401 without auth header", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should include exerciseSkill in response", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.submission.exerciseSkill).toBe("WRITING");
    });

    it("should return 400 for non-GRADED submission", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: "SUBMITTED",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /student/submissions/:submissionId/history", () => {
    it("should return submission history entries", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue({
        assignmentId: "assign-1",
        studentId: "student-1",
      });
      mockDb.submission.findMany.mockResolvedValue([
        {
          id: "sub-1",
          submittedAt: new Date("2026-02-16"),
          status: "GRADED",
          feedback: { teacherFinalScore: 6.0, overallScore: 5.5 },
        },
        {
          id: "sub-0",
          submittedAt: new Date("2026-02-14"),
          status: "GRADED",
          feedback: { teacherFinalScore: null, overallScore: 5.0 },
        },
      ]);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1/history",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].score).toBe(6.0); // Teacher override
      expect(body.data[1].score).toBe(5.0); // AI score (no teacher override)
      expect(body.message).toBe("Submission history retrieved");
    });

    it("should return 403 for another student's history", async () => {
      mockOtherStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue({
        assignmentId: "assign-1",
        studentId: "student-1",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/sub-1/history",
        headers: { authorization: "Bearer other-student-token" },
      });

      expect(response.statusCode).toBe(403);
    });

    it("should return 404 when submission not found", async () => {
      mockStudentAuth();
      mockDb.submission.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/student/submissions/nonexistent/history",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
