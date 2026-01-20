import Fastify, { FastifyInstance } from "fastify";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { authRoutes } from "./auth.routes.js";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

describe("Auth Routes Integration", () => {
  let app: FastifyInstance;

  const mockPrisma = {
    $transaction: vi.fn(),
    center: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    authAccount: { upsert: vi.fn() },
    centerMembership: { create: vi.fn() },
  };

  const mockFirebaseAuth = {
    verifyIdToken: vi.fn(),
    setCustomUserClaims: vi.fn(),
  };

  beforeEach(async () => {
    app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    (app as any).prisma = mockPrisma;
    (app as any).firebaseAuth = mockFirebaseAuth;

    await app.register(authRoutes, { prefix: "/api/v1/auth" });
    await app.ready();
    vi.clearAllMocks();
  });

  it("POST /signup/center/google - should return 201 on success", async () => {
    const payload = {
      idToken: "valid-token",
      centerName: "Test Center",
      centerSlug: "test-center",
    };

    // Mock successful auth verification
    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "firebase-uid",
      email: "owner@test.com",
      name: "Owner",
    });

    // Mock DB checks (slug uniqueness)
    mockPrisma.center.findUnique.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Mock transaction result
    mockPrisma.$transaction.mockResolvedValue({
      user: {
        id: "user-123",
        email: "owner@test.com",
        name: "Owner",
        role: "OWNER",
        centerId: "center-123",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup/center/google",
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.data.user.role).toBe("OWNER");
    expect(body.message).toContain("registered successfully");
  });

  it("POST /signup/center/google - should return 409 on conflict", async () => {
    const payload = {
      idToken: "valid-token",
      centerName: "Test Center",
      centerSlug: "existing-slug",
    };

    mockFirebaseAuth.verifyIdToken.mockResolvedValue({
      uid: "uid",
      email: "email@test.com",
    });

    // Mock slug conflict found in pre-check
    mockPrisma.center.findUnique.mockResolvedValue({ id: "existing" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup/center/google",
      payload,
    });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body).message).toContain("already exists");
  });

  it("POST /signup/center/google - should return 400 on invalid payload", async () => {
    const payload = {
      idToken: "valid-token",
      // Missing centerName and centerSlug
    };

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup/center/google",
      payload,
    });

    expect(response.statusCode).toBe(400);
  });
});
