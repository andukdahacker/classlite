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

  // Protected route example to verify RBAC and Tenanted Client
  typedFastify.get(
    "/me",
    {
      schema: {
        response: {
          200: AuthUserSchema,
          400: ErrorResponseSchema,
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
      const user = request.jwtPayload!;

      if (!user.centerId) {
        return reply
          .status(400)
          .send({ message: "User does not belong to a center" });
      }

      // Use tenanted client to ensure isolation
      // We query CenterMembership because 'User' model is global, but 'CenterMembership' is tenanted
      const db = getTenantedClient(fastify.prisma, user.centerId);

      // We use findFirst to ensure the extension injects 'where: { centerId }'
      // If we used findUnique, strict typing might prevent injection depending on Prisma version
      const membership = await db.centerMembership.findFirst({
        where: {
          userId: user.uid,
          // centerId is injected automatically by the extension
        },
        include: {
          user: true, // Get the actual user profile data
        },
      });

      if (!membership) {
        return reply
          .status(401)
          .send({ message: "User not found in this center" });
      }

      return reply.status(200).send({
        id: membership.user.id,
        email: membership.user.email || "",
        name: membership.user.name || null,
        role: membership.role,
        centerId: membership.centerId,
      });
    },
  );
}
