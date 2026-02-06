import { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { requireRole } from "./role.middleware.js";

describe("roleMiddleware", () => {
  const mockLog = {
    warn: vi.fn(),
    error: vi.fn(),
  };

  const createMockRequest = (role?: any) =>
    ({
      jwtPayload: role ? { role } : undefined,
      url: "/api/test",
      method: "POST",
      server: {
        log: mockLog,
      },
    }) as unknown as FastifyRequest;

  const createMockReply = () => {
    const reply: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    return reply as FastifyReply;
  };

  it("should allow access if user has the required role", async () => {
    const middleware = requireRole("OWNER");
    const req = createMockRequest("OWNER");
    const reply = createMockReply();

    await middleware(req, reply);

    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("should allow access if user has one of the required roles", async () => {
    const middleware = requireRole(["OWNER", "TEACHER"]);
    const req = createMockRequest("OWNER");
    const reply = createMockReply();

    await middleware(req, reply);

    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("should return 403 if user does not have the required role", async () => {
    const middleware = requireRole("OWNER");
    const req = createMockRequest("STUDENT");
    const reply = createMockReply();

    await middleware(req, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("FORBIDDEN"),
      }),
    );
    expect(mockLog.warn).toHaveBeenCalled();
  });

  it("should return 401 if jwtPayload is missing (authMiddleware didn't run)", async () => {
    const middleware = requireRole("OWNER");
    const req = createMockRequest();
    const reply = createMockReply();

    await middleware(req, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("UNAUTHORIZED"),
      }),
    );
  });
});
