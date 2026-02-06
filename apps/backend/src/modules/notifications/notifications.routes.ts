import {
  NotificationListResponseSchema,
  UnreadCountResponseSchema,
  MarkNotificationReadSchema,
  ErrorResponseSchema,
  MarkNotificationReadInput,
} from "@workspace/types";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { NotificationsController } from "./notifications.controller.js";
import { NotificationsService } from "./notifications.service.js";
import z from "zod";

export async function notificationsRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const notificationsService = new NotificationsService(fastify.prisma);
  const notificationsController = new NotificationsController(notificationsService);

  // All notifications routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  api.get("/", {
    schema: {
      querystring: z.object({
        limit: z.coerce.number().optional(),
      }),
      response: {
        200: NotificationListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"])],
    handler: async (
      request: FastifyRequest<{ Querystring: { limit?: number } }>,
      reply,
    ) => {
      const result = await notificationsController.listNotifications(
        request.jwtPayload!,
        request.query.limit,
      );
      return reply.send(result);
    },
  });

  api.get("/unread-count", {
    schema: {
      response: {
        200: UnreadCountResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"])],
    handler: async (request, reply) => {
      const result = await notificationsController.getUnreadCount(request.jwtPayload!);
      return reply.send(result);
    },
  });

  api.post("/mark-read", {
    schema: {
      body: MarkNotificationReadSchema,
      response: {
        200: z.object({
          message: z.string(),
          markedCount: z.number(),
        }),
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"])],
    handler: async (
      request: FastifyRequest<{ Body: MarkNotificationReadInput }>,
      reply,
    ) => {
      const result = await notificationsController.markAsRead(
        request.body,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.post("/mark-all-read", {
    schema: {
      response: {
        200: z.object({
          message: z.string(),
          markedCount: z.number(),
        }),
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"])],
    handler: async (request, reply) => {
      const result = await notificationsController.markAllAsRead(request.jwtPayload!);
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
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      const result = await notificationsController.deleteNotification(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });
}
