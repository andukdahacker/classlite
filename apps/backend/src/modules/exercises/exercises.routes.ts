import {
  CreateExerciseSchema,
  UpdateExerciseSchema,
  AutosaveExerciseSchema,
  ExerciseResponseSchema,
  ExerciseListResponseSchema,
  ErrorResponseSchema,
  CreateExerciseInput,
  UpdateExerciseInput,
  AutosaveExerciseInput,
  ExerciseSkillSchema,
  ExerciseStatusSchema,
} from "@workspace/types";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { ExercisesController } from "./exercises.controller.js";
import { ExercisesService } from "./exercises.service.js";
import z from "zod";

export async function exercisesRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const exercisesService = new ExercisesService(fastify.prisma);
  const exercisesController = new ExercisesController(exercisesService);

  // All exercises routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  // GET / - List exercises
  api.get("/", {
    schema: {
      querystring: z.object({
        skill: ExerciseSkillSchema.optional(),
        status: ExerciseStatusSchema.optional(),
      }),
      response: {
        200: ExerciseListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      try {
        const { skill, status } = request.query as {
          skill?: string;
          status?: string;
        };
        const result = await exercisesController.listExercises(
          request.jwtPayload!,
          { skill, status },
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 500)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 500)
            .send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Failed to list exercises" });
      }
    },
  });

  // GET /:id - Get exercise with sections/questions
  api.get("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: ExerciseResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.getExercise(
          request.params.id,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 404)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 404)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to get exercise" });
      }
    },
  });

  // POST / - Create exercise
  api.post("/", {
    schema: {
      body: CreateExerciseSchema,
      response: {
        201: ExerciseResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateExerciseInput }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.createExercise(
          request.body,
          request.jwtPayload!,
        );
        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 400)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to create exercise" });
      }
    },
  });

  // PATCH /:id - Update exercise
  api.patch("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: UpdateExerciseSchema,
      response: {
        200: ExerciseResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateExerciseInput;
      }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.updateExercise(
          request.params.id,
          request.body,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 400)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to update exercise" });
      }
    },
  });

  // PATCH /:id/autosave - Auto-save exercise
  api.patch("/:id/autosave", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: AutosaveExerciseSchema,
      response: {
        200: ExerciseResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: AutosaveExerciseInput;
      }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.autosaveExercise(
          request.params.id,
          request.body,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 400)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to auto-save exercise" });
      }
    },
  });

  // DELETE /:id - Delete exercise
  api.delete("/:id", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.deleteExercise(
          request.params.id,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 404)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 404)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to delete exercise" });
      }
    },
  });

  // POST /:id/publish - Publish exercise
  api.post("/:id/publish", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: ExerciseResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.publishExercise(
          request.params.id,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 400)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to publish exercise" });
      }
    },
  });

  // POST /:id/archive - Archive exercise
  api.post("/:id/archive", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: ExerciseResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply,
    ) => {
      try {
        const result = await exercisesController.archiveExercise(
          request.params.id,
          request.jwtPayload!,
        );
        return reply.send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 400)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply
          .status(500)
          .send({ message: "Failed to archive exercise" });
      }
    },
  });
}
