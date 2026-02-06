import Fastify, { FastifyInstance } from "fastify";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { authMiddleware } from "./auth.middleware.js";
import { requireRole } from "./role.middleware.js";

describe("roleMiddleware Integration", () => {
  let app: FastifyInstance;
  const mockFirebaseAuth = {
    verifyIdToken: vi.fn(),
  };

  beforeEach(async () => {
    app = Fastify();

    // Mock firebaseAuth on the server
    (app as any).firebaseAuth = mockFirebaseAuth;

    app.get(
      "/protected/owner",
      {
        preHandler: [authMiddleware, requireRole("OWNER")],
      },
      async () => ({ success: true }),
    );

    app.get(
      "/protected/staff",
      {
        preHandler: [authMiddleware, requireRole(["OWNER", "TEACHER"])],
      },
      async () => ({ success: true }),
    );

    await app.ready();
  });

  it("should return 401 if no token provided", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/protected/owner",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 if user has insufficient role", async () => {
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "user-123",
      email: "student@test.com",
      role: "STUDENT",
    });

    const response = await app.inject({
      method: "GET",
      url: "/protected/owner",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("FORBIDDEN");
  });

  it("should allow access if user has required role", async () => {
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "user-123",
      email: "owner@test.com",
      role: "OWNER",
    });

    const response = await app.inject({
      method: "GET",
      url: "/protected/owner",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
  });

  it("should allow access if user has one of several allowed roles", async () => {
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "user-456",
      email: "teacher@test.com",
      role: "TEACHER",
    });

    const response = await app.inject({
      method: "GET",
      url: "/protected/staff",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
