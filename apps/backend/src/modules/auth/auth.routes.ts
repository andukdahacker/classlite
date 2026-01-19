import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  LoginRequestSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
} from "@workspace/types";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, fastify.firebaseAuth);
  const authController = new AuthController(authService);

  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

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
}
