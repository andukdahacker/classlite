import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  LoginRequestSchema,
  CenterSignupRequestSchema,
  CenterSignupWithGoogleRequestSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
  AuthUserSchema,
  LoginAttemptCheckResponseSchema,
  RecordLoginAttemptRequestSchema,
  RecordLoginAttemptResponseSchema,
  createResponseSchema,
} from "@workspace/types";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";

// Simple IP-based rate limiter for login-attempt endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;

const loginAttemptRateLimit = async (
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
) => {
  const ip = request.ip;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return reply.status(429).send({
      message: "Too many requests. Please try again later.",
    });
  }
};

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, fastify.firebaseAuth);
  const authController = new AuthController(authService);

  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

  typedFastify.post(
    "/signup/center",
    {
      schema: {
        body: CenterSignupRequestSchema,
        response: {
          201: AuthResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authController.centerSignup(request.body);
        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply.status(error.statusCode as 400).send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply.status(prismaErr.statusCode as 400).send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Registration failed" });
      }
    },
  );

  typedFastify.post(
    "/signup/center/google",
    {
      schema: {
        body: CenterSignupWithGoogleRequestSchema,
        response: {
          201: AuthResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authController.centerSignupWithGoogle(
          request.body,
        );
        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply.status(error.statusCode as 400).send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply.status(prismaErr.statusCode as 400).send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Registration failed" });
      }
    },
  );

  typedFastify.post(
    "/login",
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authController.login(request.body.idToken);
        // Record successful login to reset lockout counter
        if (result.data?.user?.email) {
          await authService
            .recordLoginAttempt(result.data.user.email, true)
            .catch(() => {});
        }
        return reply.status(200).send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply.status(error.statusCode as 401).send({ message: error.message });
        }
        return reply.status(401).send({
          message: "Authentication failed",
        });
      }
    },
  );

  // Protected route to get current user profile
  typedFastify.get(
    "/me",
    {
      schema: {
        response: {
          200: createResponseSchema(AuthUserSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
      preHandler: [
        authMiddleware,
        // Intentional: all roles allowed — requireRole used for RBAC documentation and middleware chain consistency
        requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"]),
      ],
    },
    async (request, reply) => {
      const user = request.jwtPayload!;

      if (!user.centerId) {
        return reply
          .status(400)
          .send({ message: "User does not belong to a center" });
      }

      try {
        const result = await authController.getCurrentUser(
          user.uid,
          user.centerId,
        );
        return reply.status(200).send({ data: result, message: "User profile retrieved" });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply.status(error.statusCode as 400).send({ message: error.message });
        }
        return reply.status(500).send({
          message: "Failed to get user profile",
        });
      }
    },
  );

  // --- Login Attempt Tracking (Account Lockout) ---

  // Check if account is locked
  typedFastify.get(
    "/login-attempt",
    {
      schema: {
        querystring: z.object({
          email: z.string().email(),
        }),
        response: {
          200: LoginAttemptCheckResponseSchema,
          429: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
      preHandler: [loginAttemptRateLimit],
    },
    async (request, reply) => {
      try {
        const { email } = request.query;
        const result = await authService.checkLoginAttempt(email);
        return reply.status(200).send({ data: result, message: "OK" });
      } catch (error: unknown) {
        request.log.error(error);
        return reply.status(500).send({
          message: "Failed to check login status",
        });
      }
    },
  );

  // Record failed login attempt (always records a failure — success is handled by POST /login)
  typedFastify.post(
    "/login-attempt",
    {
      schema: {
        body: RecordLoginAttemptRequestSchema,
        response: {
          200: RecordLoginAttemptResponseSchema,
          423: ErrorResponseSchema, // Locked
          429: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
      preHandler: [loginAttemptRateLimit],
    },
    async (request, reply) => {
      try {
        const { email } = request.body;
        const result = await authService.recordLoginAttempt(email, false);

        if (result.locked) {
          return reply.status(423).send({
            message: `Account locked. Try again in ${result.retryAfterMinutes} minutes.`,
          });
        }

        return reply.status(200).send({ data: result, message: "OK" });
      } catch (error: unknown) {
        request.log.error(error);
        return reply.status(500).send({
          message: "Failed to record login attempt",
        });
      }
    },
  );

  // Reset login attempts for an email (E2E testing only - dev mode)
  // This endpoint allows E2E tests to clear lockouts before each test
  typedFastify.delete(
    "/login-attempt",
    {
      schema: {
        querystring: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.object({ message: z.string() }),
          403: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      // Fail-closed: only allow in development/test mode
      if (
        process.env.NODE_ENV !== "development" &&
        process.env.NODE_ENV !== "test"
      ) {
        return reply.status(403).send({
          message: "This endpoint is only available in development mode",
        });
      }

      try {
        const { email } = request.query;
        await authService.resetLoginAttempts(email);
        return reply.status(200).send({ message: "Login attempts reset" });
      } catch (error: unknown) {
        request.log.error(error);
        return reply.status(500).send({
          message: "Failed to reset login attempts",
        });
      }
    },
  );
}
