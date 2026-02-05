import {
  CreateRoomInputSchema,
  UpdateRoomInputSchema,
  RoomResponseSchema,
  RoomListResponseSchema,
  ErrorResponseSchema,
  CreateRoomInput,
  UpdateRoomInput,
} from "@workspace/types";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { RoomsController } from "./rooms.controller.js";
import { RoomsService } from "./rooms.service.js";
import z from "zod";

export async function roomsRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const roomsService = new RoomsService(fastify.prisma);
  const roomsController = new RoomsController(roomsService);

  // All rooms routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  api.get("/", {
    schema: {
      response: {
        200: RoomListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      const result = await roomsController.listRooms(request.jwtPayload!);
      return reply.send(result);
    },
  });

  api.post("/", {
    schema: {
      body: CreateRoomInputSchema,
      response: {
        201: RoomResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateRoomInput }>,
      reply,
    ) => {
      try {
        const result = await roomsController.createRoom(
          request.body,
          request.jwtPayload!,
        );
        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Room name already exists") {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  api.patch("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: UpdateRoomInputSchema,
      response: {
        200: RoomResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateRoomInput;
      }>,
      reply,
    ) => {
      try {
        const result = await roomsController.updateRoom(
          request.params.id,
          request.body,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Room name already exists") {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
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
      try {
        const result = await roomsController.deleteRoom(
          request.params.id,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Room not found") {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
