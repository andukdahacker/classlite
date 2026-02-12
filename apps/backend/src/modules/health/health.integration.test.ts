import Fastify, { FastifyInstance } from "fastify";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("Health Check Integration", () => {
  let app: FastifyInstance;

  const mockPrisma = {
    $queryRaw: vi.fn(),
  };

  beforeEach(async () => {
    app = Fastify();
    (app as any).prisma = mockPrisma;

    // Import and register health routes
    const { healthRoutes } = await import("./health.routes.js");
    await app.register(healthRoutes, { prefix: "/api/v1" });
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /api/v1/health - should return 200 with status ok when database is reachable", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
  });

  it("GET /api/v1/health - should return 503 when database is unreachable", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(response.statusCode).toBe(503);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("error");
    expect(body.database).toBe("unreachable");
  });

  it("GET /api/v1/health - should not require authentication", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    // No Authorization header sent — should still succeed
    expect(response.statusCode).toBe(200);
  });
});
