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
} from "@workspace/types";
import { getTenantedClient } from "@workspace/db";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

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
      } catch (error: any) {
        request.log.error(error);
        const statusCode = error.message.startsWith("CONFLICT") ? 409 : 400;
        return reply.status(statusCode).send({
          message: error.message || "Registration failed",
        });
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
      } catch (error: any) {
        request.log.error(error);
        const statusCode = error.message.startsWith("CONFLICT") ? 409 : 400;
        return reply.status(statusCode).send({
          message: error.message || "Registration failed",
        });
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
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(401).send({
          message: error.message || "Authentication failed",
        });
      }
    },
  );

  // Protected route example to verify RBAC and Tenanted Client
  typedFastify.get(
    "/me",
    {
      schema: {
        response: {
          200: AuthUserSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
      preHandler: [
        authMiddleware,
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
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        const statusCode = error.message.startsWith("NOT_FOUND") ? 404 : 400;
        return reply.status(statusCode).send({
          message: error.message || "Failed to get user profile",
        });
      }
    },
  );

  // --- Login Attempt Tracking (Account Lockout) ---

  // Check if account is locked
  typedFastify.get(
    "/login-attempt/:email",
    {
      schema: {
        params: z.object({
          email: z.string(),
        }),
        response: {
          200: LoginAttemptCheckResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { email } = request.params;
        const result = await authService.checkLoginAttempt(email);
        return reply.status(200).send({ data: result, message: "OK" });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          message: error.message || "Failed to check login status",
        });
      }
    },
  );

  // Record login attempt (success or failure)
  typedFastify.post(
    "/login-attempt",
    {
      schema: {
        body: RecordLoginAttemptRequestSchema,
        response: {
          200: RecordLoginAttemptResponseSchema,
          423: ErrorResponseSchema, // Locked
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { email, success } = request.body;
        const result = await authService.recordLoginAttempt(email, success);

        if (result.locked) {
          return reply.status(423).send({
            message: `Account locked. Try again in ${result.retryAfterMinutes} minutes.`,
          });
        }

        return reply.status(200).send({ data: result, message: "OK" });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          message: error.message || "Failed to record login attempt",
        });
      }
    },
  );
}
