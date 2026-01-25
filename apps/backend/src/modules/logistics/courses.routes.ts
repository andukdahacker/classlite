import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CourseResponseSchema,
  CourseListResponseSchema,
  ErrorResponseSchema,
  UpdateCourseInput,
  CreateCourseInput,
} from "@workspace/types";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { CoursesController } from "./courses.controller.js";
import { CoursesService } from "./courses.service.js";
import z from "zod";

export async function coursesRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const coursesService = new CoursesService(fastify.prisma);
  const coursesController = new CoursesController(coursesService);

  // All courses routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  api.get("/", {
    schema: {
      response: {
        200: CourseListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await coursesController.listCourses(request.jwtPayload!);
      return reply.send(result);
    },
  });

  api.get("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: CourseResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      const result = await coursesController.getCourse(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });

  api.post("/", {
    schema: {
      body: CreateCourseSchema,
      response: {
        201: CourseResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateCourseInput }>,
      reply,
    ) => {
      const result = await coursesController.createCourse(
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
      body: UpdateCourseSchema,
      response: {
        200: CourseResponseSchema,
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
        Body: UpdateCourseInput;
      }>,
      reply,
    ) => {
      const result = await coursesController.updateCourse(
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
      const result = await coursesController.deleteCourse(
        request.params.id,
        request.jwtPayload!,
      );
      return reply.send(result);
    },
  });
}
