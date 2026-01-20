import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  LoginRequestSchema,
  CenterSignupRequestSchema,
  CenterSignupWithGoogleRequestSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
  AuthUserSchema,
} from "@workspace/types";
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
    authController.centerSignup.bind(authController),
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
    authController.centerSignupWithGoogle.bind(authController),
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
    authController.login.bind(authController),
  );

  // Protected route example to verify RBAC
  typedFastify.get(
    "/me",
    {
      schema: {
        response: {
          200: AuthUserSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
      preHandler: [
        authMiddleware,
        requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"]),
      ],
    },
    async (request, reply) => {
      // In a real app, we would fetch fresh user data from DB
      // For now, return the jwtPayload content as proof of auth
      const user = request.jwtPayload!;
      return reply.status(200).send({
        id: user.uid,
        email: user.email,
        name: null, // JWT doesn't have name, in real app we'd fetch it
        role: user.role,
        centerId: user.centerId,
      });
    },
  );
}
