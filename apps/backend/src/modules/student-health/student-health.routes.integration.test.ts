import Fastify, { FastifyInstance } from "fastify";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { studentHealthRoutes } from "./student-health.routes.js";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

describe("Student Health Routes Integration", () => {
  let app: FastifyInstance;

  const mockDb = {
    centerMembership: { findMany: vi.fn().mockResolvedValue([]) },
    classStudent: { findMany: vi.fn().mockResolvedValue([]) },
    classSession: { findMany: vi.fn().mockResolvedValue([]) },
    attendance: { findMany: vi.fn().mockResolvedValue([]) },
    assignment: { findMany: vi.fn().mockResolvedValue([]) },
    assignmentStudent: { findMany: vi.fn().mockResolvedValue([]) },
  };

  const mockPrisma = {
    $extends: vi.fn(),
    submission: { findMany: vi.fn().mockResolvedValue([]) },
  };

  const mockFirebaseAuth = {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: "firebase-owner-1",
      email: "owner@test.com",
      role: "OWNER",
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

    await app.register(studentHealthRoutes, {
      prefix: "/api/v1/student-health",
    });
    await app.ready();
  });

  it("should return 200 with correct shape", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/dashboard",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveProperty("students");
    expect(body.data).toHaveProperty("summary");
    expect(body.data.summary).toEqual({
      total: 0,
      atRisk: 0,
      warning: 0,
      onTrack: 0,
    });
    expect(body.message).toBe("Student health dashboard loaded");
  });

  it("should accept classId filter", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/dashboard?classId=class-1",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
  });

  it("should return 403 for Teacher role", async () => {
    mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: "firebase-teacher-1",
      email: "teacher@test.com",
      role: "TEACHER",
      center_id: "center-1",
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/dashboard",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 401 without auth header", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/dashboard",
    });

    expect(response.statusCode).toBe(401);
  });

  // --- Profile endpoint tests ---

  it("GET /profile/:studentId should return 200 with correct shape", async () => {
    mockDb.centerMembership.findFirst = vi.fn().mockResolvedValue({
      id: "membership-1",
      centerId: "center-1",
      userId: "student-1",
      role: "STUDENT",
      status: "ACTIVE",
      user: {
        id: "student-1",
        name: "Alice",
        email: "alice@test.com",
        avatarUrl: null,
      },
    });
    mockDb.classStudent.findMany.mockResolvedValue([]);
    mockDb.classSession.findMany.mockResolvedValue([]);
    mockDb.attendance.findMany.mockResolvedValue([]);
    mockDb.assignment.findMany.mockResolvedValue([]);
    mockDb.assignmentStudent.findMany.mockResolvedValue([]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/profile/student-1",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveProperty("student");
    expect(body.data).toHaveProperty("attendanceHistory");
    expect(body.data).toHaveProperty("assignmentHistory");
    expect(body.data).toHaveProperty("weeklyTrends");
    expect(body.message).toBe("Student profile loaded");
  });

  it("GET /profile/:studentId should return 404 for unknown student", async () => {
    mockDb.centerMembership.findFirst = vi.fn().mockResolvedValue(null);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/profile/unknown-id",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Student not found");
  });

  it("GET /profile/:studentId should return 403 for Teacher role", async () => {
    mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: "firebase-teacher-1",
      email: "teacher@test.com",
      role: "TEACHER",
      center_id: "center-1",
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/profile/student-1",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("GET /profile/:studentId should return 401 without auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/profile/student-1",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should return 400 when centerId is null", async () => {
    mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: "firebase-owner-1",
      email: "owner@test.com",
      role: "OWNER",
      center_id: null,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/student-health/dashboard",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Center ID required");
  });
});
