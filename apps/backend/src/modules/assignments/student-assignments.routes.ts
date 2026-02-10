import { ErrorResponseSchema, StudentAssignmentListResponseSchema, StudentAssignmentResponseSchema } from "@workspace/types";
import { FastifyInstance, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { StudentAssignmentsController } from "./student-assignments.controller.js";
import { AssignmentsService } from "./assignments.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import z from "zod";

function handleRouteError(error: unknown, request: { log: { error: (e: unknown) => void } }, reply: FastifyReply) {
  request.log.error(error);
  if (error instanceof AppError) {
    return reply.status(error.statusCode as 500).send({ message: error.message });
  }
  const mapped = mapPrismaError(error);
  if (mapped) {
    return reply.status(mapped.statusCode as 500).send({ message: mapped.message });
  }
  return reply.status(500).send({ message: "Internal server error" });
}

export async function studentAssignmentsRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const notificationsService = new NotificationsService(fastify.prisma);
  const service = new AssignmentsService(fastify.prisma, notificationsService);
  const controller = new StudentAssignmentsController(service);

  fastify.addHook("preHandler", authMiddleware);

  // GET / - List my assignments (student)
  api.get("/", {
    schema: {
      querystring: z.object({
        skill: z.string().optional(),
        status: z.enum(["OPEN", "CLOSED"]).optional(),
      }),
      response: {
        200: StudentAssignmentListResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["STUDENT"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply.status(400).send({ message: "User does not belong to a center" });
        }
        const filters = request.query as { skill?: string; status?: "OPEN" | "CLOSED" };
        const result = await controller.list({ uid: payload.uid, centerId: payload.centerId }, filters);
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /:id - Get single assignment detail (student)
  api.get("/:id", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: StudentAssignmentResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["STUDENT"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply.status(400).send({ message: "User does not belong to a center" });
        }
        const { id } = request.params as { id: string };
        const result = await controller.get(id, { uid: payload.uid, centerId: payload.centerId });
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });
}
