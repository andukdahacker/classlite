import {
  StudentHealthDashboardQuerySchema,
  StudentHealthDashboardApiResponseSchema,
  ErrorResponseSchema,
} from "@workspace/types";
import { FastifyInstance, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { StudentHealthController } from "./student-health.controller.js";
import { StudentHealthService } from "./student-health.service.js";
import z from "zod";

function handleRouteError(
  error: unknown,
  request: { log: { error: (e: unknown) => void } },
  reply: FastifyReply,
) {
  request.log.error(error);
  if (error instanceof AppError) {
    return reply
      .status(error.statusCode as 500)
      .send({ message: error.message });
  }
  const mapped = mapPrismaError(error);
  if (mapped) {
    return reply
      .status(mapped.statusCode as 500)
      .send({ message: mapped.message });
  }
  return reply.status(500).send({ message: "Internal server error" });
}

export async function studentHealthRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const service = new StudentHealthService(fastify.prisma);
  const controller = new StudentHealthController(service);

  fastify.addHook("preHandler", authMiddleware);

  // GET /dashboard — Student health dashboard
  api.get("/dashboard", {
    schema: {
      querystring: StudentHealthDashboardQuerySchema,
      response: {
        200: StudentHealthDashboardApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply
            .status(400)
            .send({ message: "Center ID required" });
        }
        const filters = request.query as z.infer<
          typeof StudentHealthDashboardQuerySchema
        >;
        const result = await controller.getDashboard(
          payload.centerId,
          filters,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });
}
