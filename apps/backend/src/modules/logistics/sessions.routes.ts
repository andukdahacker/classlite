import {
  CreateClassSessionSchema,
  UpdateClassSessionSchema,
  ClassSessionResponseSchema,
  ClassSessionListResponseSchema,
  GenerateSessionsSchema,
  GenerateSessionsResponseSchema,
  ErrorResponseSchema,
  UpdateClassSessionInput,
  CreateClassSessionInput,
  GenerateSessionsInput,
} from "@workspace/types";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { SessionsController } from "./sessions.controller.js";
import { SessionsService } from "./sessions.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import z from "zod";

export async function sessionsRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const sessionsService = new SessionsService(fastify.prisma);
  const notificationsService = new NotificationsService(fastify.prisma);
  const sessionsController = new SessionsController(
    sessionsService,
    notificationsService,
  );

  // All sessions routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  api.get("/", {
    schema: {
      querystring: z.object({
        startDate: z.string(),
        endDate: z.string(),
        classId: z.string().optional(),
      }),
      response: {
        200: ClassSessionListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{
        Querystring: { startDate: string; endDate: string; classId?: string };
      }>,
      reply,
    ) => {
      const result = await sessionsController.listSessions(
        request.jwtPayload!,
        request.query.startDate,
        request.query.endDate,
        request.query.classId,
      );
      return reply.send(result);
    },
  });

  api.get("/week", {
    schema: {
      querystring: z.object({
        weekStart: z.string(),
        classId: z.string().optional(),
      }),
      response: {
        200: ClassSessionListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{
        Querystring: { weekStart: string; classId?: string };
      }>,
      reply,
    ) => {
      const result = await sessionsController.getSessionsForWeek(
        request.jwtPayload!,
        request.query.weekStart,
        request.query.classId,
      );
      return reply.send(result);
    },
  });

  api.get("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: ClassSessionResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      const result = await sessionsController.getSession(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.post("/", {
    schema: {
      body: CreateClassSessionSchema,
      response: {
        201: ClassSessionResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateClassSessionInput }>,
      reply,
    ) => {
      const result = await sessionsController.createSession(
        request.body,
        request.jwtPayload!,
      );
      return reply.status(201).send(result);
    },
  });

  api.patch("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: UpdateClassSessionSchema,
      response: {
        200: ClassSessionResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateClassSessionInput;
      }>,
      reply,
    ) => {
      const result = await sessionsController.updateSession(
        request.params.id,
        request.body,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.delete("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      const result = await sessionsController.deleteSession(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.post("/generate", {
    schema: {
      body: GenerateSessionsSchema,
      response: {
        201: GenerateSessionsResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: GenerateSessionsInput }>,
      reply,
    ) => {
      const result = await sessionsController.generateSessions(
        request.body,
        request.jwtPayload!,
      );
      return reply.status(201).send(result);
    },
  });
}
