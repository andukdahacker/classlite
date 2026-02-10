import z from "zod";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  CreateMockTestSchema,
  UpdateMockTestSchema,
  UpdateMockTestSectionSchema,
  AddExerciseToSectionSchema,
  ReorderSectionExercisesSchema,
  MockTestStatusSchema,
  MockTestTypeSchema,
  ErrorResponseSchema,
} from "@workspace/types";
import type { CreateMockTest, UpdateMockTest } from "@workspace/types";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { MockTestsController } from "./mock-tests.controller.js";
import { MockTestsService } from "./mock-tests.service.js";

// Generic response schema — Prisma models use String fields for testType/status
// (not Prisma enums), so we use z.unknown() for data to avoid TS enum mismatch.
// Typed response schemas (MockTestResponseSchema, etc.) are exported from
// @workspace/types for frontend/documentation use.
const DataResponseSchema = z.object({
  data: z.unknown(),
  message: z.string(),
});

export async function mockTestRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const service = new MockTestsService(fastify.prisma);
  const controller = new MockTestsController(service);

  fastify.addHook("preHandler", authMiddleware);

  // GET / - List mock tests
  api.get("/", {
    schema: {
      querystring: z.object({
        status: MockTestStatusSchema.optional(),
        testType: MockTestTypeSchema.optional(),
      }),
      response: {
        200: DataResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      try {
        const { status, testType } = request.query as {
          status?: string;
          testType?: string;
        };
        const result = await controller.list(
          { status, testType },
          request.jwtPayload!,
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
        return reply
          .status(500)
          .send({ message: "Failed to list mock tests" });
      }
    },
  });

  // GET /:id - Get mock test with full details
  api.get("/:id", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: DataResponseSchema,
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
        const result = await controller.get(
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
          .send({ message: "Failed to get mock test" });
      }
    },
  });

  // POST / - Create mock test
  api.post("/", {
    schema: {
      body: CreateMockTestSchema,
      response: {
        201: DataResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateMockTest }>,
      reply,
    ) => {
      try {
        const result = await controller.create(
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
          .send({ message: "Failed to create mock test" });
      }
    },
  });

  // PATCH /:id - Update mock test metadata
  api.patch("/:id", {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateMockTestSchema,
      response: {
        200: DataResponseSchema,
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
        Body: UpdateMockTest;
      }>,
      reply,
    ) => {
      try {
        const result = await controller.update(
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
          .send({ message: "Failed to update mock test" });
      }
    },
  });

  // DELETE /:id - Delete mock test (DRAFT only)
  api.delete("/:id", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({ data: z.null(), message: z.string() }),
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
        const result = await controller.delete(
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
          .send({ message: "Failed to delete mock test" });
      }
    },
  });

  // POST /:id/publish - Publish mock test
  api.post("/:id/publish", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: DataResponseSchema,
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
        const result = await controller.publish(
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
          .send({ message: "Failed to publish mock test" });
      }
    },
  });

  // POST /:id/archive - Archive mock test
  api.post("/:id/archive", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: DataResponseSchema,
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
        const result = await controller.archive(
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
          .send({ message: "Failed to archive mock test" });
      }
    },
  });

  // PATCH /:id/sections/:sectionId - Update section (timeLimit)
  api.patch("/:id/sections/:sectionId", {
    schema: {
      params: z.object({ id: z.string(), sectionId: z.string() }),
      body: UpdateMockTestSectionSchema,
      response: {
        200: DataResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string; sectionId: string };
        Body: { timeLimit?: number | null };
      }>,
      reply,
    ) => {
      try {
        const result = await controller.updateSection(
          request.params.id,
          request.params.sectionId,
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
          .send({ message: "Failed to update section" });
      }
    },
  });

  // POST /:id/sections/:sectionId/exercises - Add exercise to section
  api.post("/:id/sections/:sectionId/exercises", {
    schema: {
      params: z.object({ id: z.string(), sectionId: z.string() }),
      body: AddExerciseToSectionSchema,
      response: {
        201: DataResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string; sectionId: string };
        Body: { exerciseId: string };
      }>,
      reply,
    ) => {
      try {
        const result = await controller.addExercise(
          request.params.id,
          request.params.sectionId,
          request.body.exerciseId,
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
          .send({ message: "Failed to add exercise to section" });
      }
    },
  });

  // DELETE /:id/sections/:sectionId/exercises/:exerciseId - Remove exercise
  api.delete("/:id/sections/:sectionId/exercises/:exerciseId", {
    schema: {
      params: z.object({
        id: z.string(),
        sectionId: z.string(),
        exerciseId: z.string(),
      }),
      response: {
        200: z.object({ data: z.null(), message: z.string() }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string; sectionId: string; exerciseId: string };
      }>,
      reply,
    ) => {
      try {
        const result = await controller.removeExercise(
          request.params.id,
          request.params.sectionId,
          request.params.exerciseId,
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
          .send({ message: "Failed to remove exercise from section" });
      }
    },
  });

  // PATCH /:id/sections/:sectionId/exercises/reorder - Reorder exercises
  api.patch("/:id/sections/:sectionId/exercises/reorder", {
    schema: {
      params: z.object({ id: z.string(), sectionId: z.string() }),
      body: ReorderSectionExercisesSchema,
      response: {
        200: z.object({ data: z.null(), message: z.string() }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { id: string; sectionId: string };
        Body: { exerciseIds: string[] };
      }>,
      reply,
    ) => {
      try {
        const result = await controller.reorderExercises(
          request.params.id,
          request.params.sectionId,
          request.body.exerciseIds,
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
          .send({ message: "Failed to reorder exercises" });
      }
    },
  });

  // GET /:id/score-preview - Band score preview
  api.get("/:id/score-preview", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: DataResponseSchema,
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
        const result = await controller.scorePreview(
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
          .send({ message: "Failed to get score preview" });
      }
    },
  });
}
