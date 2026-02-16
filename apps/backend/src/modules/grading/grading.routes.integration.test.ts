import Fastify, { FastifyInstance } from "fastify";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { gradingRoutes } from "./grading.routes.js";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

describe("Grading Routes Integration", () => {
  let app: FastifyInstance;

  const mockGradingJob = {
    id: "job-1",
    centerId: "center-1",
    submissionId: "sub-1",
    status: "pending",
    error: null,
    errorCategory: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubmission = {
    id: "sub-1",
    centerId: "center-1",
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

  const mockFeedback = {
    id: "fb-1",
    centerId: "center-1",
    submissionId: "sub-1",
    overallScore: 6.5,
    criteriaScores: { taskAchievement: 6.0 },
    generalFeedback: "Good essay.",
    teacherFinalScore: null,
    teacherCriteriaScores: null,
    teacherGeneralFeedback: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  const mockPrisma = {
    $extends: vi.fn(),
  };

  const mockDb = {
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    gradingJob: {
      create: vi.fn().mockResolvedValue(mockGradingJob),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    submissionFeedback: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    authAccount: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        userId: "teacher-1",
        provider: "FIREBASE",
        providerUserId: "firebase-teacher-1",
      }),
    },
    centerMembership: {
      findFirst: vi.fn().mockResolvedValue({ role: "TEACHER" }),
    },
  };

  const mockFirebaseAuth = {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: "firebase-teacher-1",
      email: "teacher@test.com",
      role: "TEACHER",
      center_id: "center-1",
    }),
  };

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

  describe("GET /submissions", () => {
    it("should return 200 with grading queue", async () => {
      mockDb.submission.count.mockResolvedValue(1);
      mockDb.submission.findMany.mockResolvedValue([
        {
          id: "sub-1",
          submittedAt: new Date("2026-02-16"),
          student: { name: "Student A" },
          assignment: { exercise: { title: "Essay 1", skill: "WRITING" } },
          gradingJob: { status: "completed", error: null },
        },
      ]);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.items).toHaveLength(1);
      expect(body.message).toBe("Grading queue retrieved");
    });

    it("should return 401 without auth header", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should return 403 for STUDENT role", async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
        uid: "firebase-student-1",
        email: "student@test.com",
        role: "STUDENT",
        center_id: "center-1",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions",
        headers: { authorization: "Bearer student-token" },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /submissions/:submissionId", () => {
    it("should return 200 with submission detail", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.gradingJob.findUnique.mockResolvedValue({ ...mockGradingJob, status: "completed" });
      mockDb.submissionFeedback.findUnique.mockResolvedValue(mockFeedback);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions/sub-1",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.analysisStatus).toBe("ready");
      expect(body.message).toBe("Submission detail retrieved");
    });

    it("should return 404 when submission not found", async () => {
      mockDb.submission.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions/nonexistent",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should return 403 when teacher does not teach the class", async () => {
      mockDb.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          ...mockSubmission.assignment,
          class: { id: "class-1", name: "IELTS A", teacherId: "other-teacher" },
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions/sub-1",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /submissions/:submissionId/feedback", () => {
    it("should return 200 with feedback data", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.submissionFeedback.findUnique.mockResolvedValue(mockFeedback);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions/sub-1/feedback",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Feedback retrieved");
    });

    it("should return 404 when no feedback exists", async () => {
      mockDb.submission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.submissionFeedback.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/grading/submissions/sub-1/feedback",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /submissions/:submissionId/analyze", () => {
    it("should return 200 when triggering analysis", async () => {
      mockDb.submission.findUnique
        .mockResolvedValueOnce(mockSubmission) // retriggerAnalysis lookup
        .mockResolvedValueOnce(mockSubmission); // triggerAnalysis lookup
      mockDb.gradingJob.findUnique.mockResolvedValue(null);

      // Mock inngest.send
      const inngestModule = await import("../inngest/client.js");
      vi.spyOn(inngestModule.inngest, "send").mockResolvedValue(undefined as never);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/grading/submissions/sub-1/analyze",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("AI analysis triggered");
    });
  });
});
