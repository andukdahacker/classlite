import {
  StudentHealthDashboardQuerySchema,
  StudentHealthDashboardApiResponseSchema,
  StudentProfileApiResponseSchema,
  ErrorResponseSchema,
  SendInterventionEmailRequestSchema,
  SendInterventionApiResponseSchema,
  InterventionHistoryApiResponseSchema,
  InterventionEmailPreviewApiResponseSchema,
  TeacherAtRiskWidgetApiResponseSchema,
  CreateStudentFlagRequestSchema,
  CreateStudentFlagApiResponseSchema,
  StudentFlagListApiResponseSchema,
  ResolveStudentFlagRequestSchema,
  ResolveStudentFlagApiResponseSchema,
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

  // GET /dashboard — Student health dashboard (OWNER, ADMIN, TEACHER)
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
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
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
        const teacherUserId =
          payload.role === "TEACHER" ? payload.uid : undefined;
        const result = await controller.getDashboard(
          payload.centerId,
          filters,
          teacherUserId,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /dashboard/teacher-widget — Teacher at-risk widget (TEACHER only)
  api.get("/dashboard/teacher-widget", {
    schema: {
      response: {
        200: TeacherAtRiskWidgetApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["TEACHER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply
            .status(400)
            .send({ message: "Center ID required" });
        }
        const result = await controller.getTeacherAtRiskWidget(
          payload.centerId,
          payload.uid,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /profile/:studentId — Student profile overlay (OWNER, ADMIN, TEACHER)
  api.get("/profile/:studentId", {
    schema: {
      params: z.object({ studentId: z.string() }),
      response: {
        200: StudentProfileApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply
            .status(400)
            .send({ message: "Center ID required" });
        }
        const { studentId } = request.params;
        const teacherUserId =
          payload.role === "TEACHER" ? payload.uid : undefined;
        const result = await controller.getStudentProfile(
          payload.centerId,
          studentId,
          teacherUserId,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // POST /flags — Create a student flag (TEACHER only)
  api.post("/flags", {
    schema: {
      body: CreateStudentFlagRequestSchema,
      response: {
        201: CreateStudentFlagApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["TEACHER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply
            .status(400)
            .send({ message: "Center ID required" });
        }
        const { studentId, note } = request.body;
        const result = await controller.createFlag(
          payload.centerId,
          studentId,
          payload.uid,
          note,
          payload.uid,
        );
        return reply.status(201).send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /flags/:studentId — Get flags for a student
  api.get("/flags/:studentId", {
    schema: {
      params: z.object({ studentId: z.string() }),
      response: {
        200: StudentFlagListApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.centerId) {
          return reply
            .status(400)
            .send({ message: "Center ID required" });
        }
        const { studentId } = request.params;
        const result = await controller.getStudentFlags(
          payload.centerId,
          studentId,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // PATCH /flags/:flagId/resolve — Resolve a flag (OWNER, ADMIN only)
  api.patch("/flags/:flagId/resolve", {
    schema: {
      params: z.object({ flagId: z.string() }),
      body: ResolveStudentFlagRequestSchema,
      response: {
        200: ResolveStudentFlagApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
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
        const { flagId } = request.params;
        const { resolvedNote } = request.body;
        const result = await controller.resolveFlag(
          payload.centerId,
          flagId,
          payload.uid,
          resolvedNote,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // POST /interventions — Send intervention email (OWNER, ADMIN only)
  api.post("/interventions", {
    schema: {
      body: SendInterventionEmailRequestSchema,
      response: {
        201: SendInterventionApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
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
        const result = await controller.sendIntervention(
          payload.centerId,
          payload.uid,
          request.body,
        );
        return reply.status(201).send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /interventions/:studentId — Intervention history (OWNER, ADMIN only)
  api.get("/interventions/:studentId", {
    schema: {
      params: z.object({ studentId: z.string() }),
      response: {
        200: InterventionHistoryApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
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
        const { studentId } = request.params;
        const result = await controller.getInterventionHistory(
          payload.centerId,
          studentId,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });

  // GET /interventions/:studentId/preview — Email preview (OWNER, ADMIN only)
  api.get("/interventions/:studentId/preview", {
    schema: {
      params: z.object({ studentId: z.string() }),
      response: {
        200: InterventionEmailPreviewApiResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
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
        const { studentId } = request.params;
        const result = await controller.getEmailPreview(
          payload.centerId,
          studentId,
        );
        return reply.send(result);
      } catch (error: unknown) {
        return handleRouteError(error, request, reply);
      }
    },
  });
}
