import {
  CreateClassSchema,
  UpdateClassSchema,
  ClassResponseSchema,
  ClassListResponseSchema,
  AddStudentToClassSchema,
  RosterResponseSchema,
  ErrorResponseSchema,
  CreateClassInput,
  UpdateClassInput,
  AddStudentToClassInput,
} from "@workspace/types";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { ClassesController } from "./classes.controller.js";
import { ClassesService } from "./classes.service.js";
import z from "zod";

export async function classesRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const classesService = new ClassesService(fastify.prisma);
  const classesController = new ClassesController(classesService);

  // All classes routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  api.get("/", {
    schema: {
      response: {
        200: ClassListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await classesController.listClasses(request.jwtPayload!);
      return reply.send(result);
    },
  });

  api.get("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: ClassResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      const result = await classesController.getClass(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.post("/", {
    schema: {
      body: CreateClassSchema,
      response: {
        201: ClassResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateClassInput }>,
      reply,
    ) => {
      const result = await classesController.createClass(
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
      body: UpdateClassSchema,
      response: {
        200: ClassResponseSchema,
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
        Body: UpdateClassInput;
        Params: { id: string };
      }>,
      reply,
    ) => {
      const result = await classesController.updateClass(
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
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply,
    ) => {
      const result = await classesController.deleteClass(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  // Roster management
  api.get("/:id/students", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: RosterResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply,
    ) => {
      const result = await classesController.listRoster(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.post("/:id/students", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: AddStudentToClassSchema,
      response: {
        201: z.object({
          message: z.string(),
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: AddStudentToClassInput;
      }>,
      reply,
    ) => {
      const result = await classesController.addStudent(
        request.params.id,
        request.body,
        request.jwtPayload!,
      );
      return reply.status(201).send(result);
    },
  });

  api.delete("/:id/students/:studentId", {
    schema: {
      params: z.object({
        id: z.string(),
        studentId: z.string(),
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
      request: FastifyRequest<{
        Params: { id: string; studentId: string };
      }>,
      reply,
    ) => {
      const result = await classesController.removeStudent(
        request.params.id,
        request.params.studentId,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.get("/available-students", {
    schema: {
      querystring: z.object({
        search: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(
            z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string().nullable(),
            }),
          ),
        }),
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (request, reply) => {
      const result = await classesController.getAvailableStudents(
        request.jwtPayload!,
        (request.query as any).search,
      );
      return reply.send(result);
    },
  });
}
