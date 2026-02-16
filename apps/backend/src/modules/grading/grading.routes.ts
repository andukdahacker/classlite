import {
  GradingQueueFiltersSchema,
  GradingQueueResponseSchema,
  SubmissionDetailResponseSchema,
  SubmissionFeedbackResponseSchema,
  GradingJobResponseSchema,
  ErrorResponseSchema,
} from "@workspace/types";
import { FastifyInstance, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { GradingController } from "./grading.controller.js";
import { GradingService } from "./grading.service.js";
import z from "zod";

function handleRouteError(
  error: unknown,
  request: { log: { error: (e: unknown) => void } },
  reply: FastifyReply,
) {
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

export async function gradingRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const service = new GradingService(fastify.prisma);
  const controller = new GradingController(service);

  // All grading routes require authentication + TEACHER/ADMIN/OWNER role
  fastify.addHook("preHandler", authMiddleware);

  // GET /submissions — List submissions with AI analysis status (grading queue)
  api.get("/submissions", {
    schema: {
      querystring: GradingQueueFiltersSchema,
      response: {
        200: GradingQueueResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["TEACHER", "ADMIN", "OWNER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply.status(400).send({ message: "User does not belong to a center" });
        }
        const filters = request.query as z.infer<typeof GradingQueueFiltersSchema>;
        const result = await controller.getGradingQueue(
          { uid: payload.uid, centerId: payload.centerId },
          filters,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /submissions/:submissionId — Get full submission detail with AI feedback
  api.get("/submissions/:submissionId", {
    schema: {
      params: z.object({ submissionId: z.string() }),
      response: {
        200: SubmissionDetailResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["TEACHER", "ADMIN", "OWNER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply.status(400).send({ message: "User does not belong to a center" });
        }
        const { submissionId } = request.params as { submissionId: string };
        const result = await controller.getSubmissionDetail(
          submissionId,
          { uid: payload.uid, centerId: payload.centerId },
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /submissions/:submissionId/feedback — Get AI-generated feedback
  api.get("/submissions/:submissionId/feedback", {
    schema: {
      params: z.object({ submissionId: z.string() }),
      response: {
        200: SubmissionFeedbackResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["TEACHER", "ADMIN", "OWNER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply.status(400).send({ message: "User does not belong to a center" });
        }
        const { submissionId } = request.params as { submissionId: string };
        const result = await controller.getSubmissionFeedback(
          submissionId,
          { uid: payload.uid, centerId: payload.centerId },
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // POST /submissions/:submissionId/analyze — Trigger or re-trigger AI analysis
  api.post("/submissions/:submissionId/analyze", {
    schema: {
      params: z.object({ submissionId: z.string() }),
      response: {
        200: GradingJobResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["TEACHER", "ADMIN", "OWNER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply.status(400).send({ message: "User does not belong to a center" });
        }
        const { submissionId } = request.params as { submissionId: string };
        const result = await controller.triggerAnalysis(
          submissionId,
          { uid: payload.uid, centerId: payload.centerId },
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });
}
