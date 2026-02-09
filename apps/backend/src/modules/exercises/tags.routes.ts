import {
  CreateExerciseTagSchema,
  UpdateExerciseTagSchema,
  MergeExerciseTagsSchema,
  ExerciseTagResponseSchema,
  ExerciseTagListResponseSchema,
  ErrorResponseSchema,
  CreateExerciseTagInput,
  UpdateExerciseTagInput,
  MergeExerciseTagsInput,
} from "@workspace/types";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { TagsController } from "./tags.controller.js";
import { TagsService } from "./tags.service.js";
import z from "zod";

export async function tagsRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();
  const tagsService = new TagsService(fastify.prisma);
  const tagsController = new TagsController(tagsService);

  fastify.addHook("preHandler", authMiddleware);

  // GET / - List all center tags
  api.get("/", {
    schema: {
      response: {
        200: ExerciseTagListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (request, reply) => {
      try {
        const result = await tagsController.listTags(request.jwtPayload!);
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
        return reply.status(500).send({ message: "Failed to list tags" });
      }
    },
  });

  // POST / - Create tag
  api.post("/", {
    schema: {
      body: CreateExerciseTagSchema,
      response: {
        201: ExerciseTagResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateExerciseTagInput }>,
      reply,
    ) => {
      try {
        const result = await tagsController.createTag(
          request.body,
          request.jwtPayload!,
        );
        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof AppError) {
          return reply
            .status(error.statusCode as 409)
            .send({ message: error.message });
        }
        const prismaErr = mapPrismaError(error);
        if (prismaErr) {
          return reply
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Failed to create tag" });
      }
    },
  });

  // PATCH /:tagId - Update tag (rename)
  api.patch("/:tagId", {
    schema: {
      params: z.object({ tagId: z.string() }),
      body: UpdateExerciseTagSchema,
      response: {
        200: ExerciseTagResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { tagId: string };
        Body: UpdateExerciseTagInput;
      }>,
      reply,
    ) => {
      try {
        const result = await tagsController.updateTag(
          request.params.tagId,
          request.body,
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
            .status(prismaErr.statusCode as 400)
            .send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Failed to update tag" });
      }
    },
  });

  // DELETE /:tagId - Delete tag
  api.delete("/:tagId", {
    schema: {
      params: z.object({ tagId: z.string() }),
      response: {
        200: z.object({ data: z.null(), message: z.string() }),
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: { tagId: string } }>,
      reply,
    ) => {
      try {
        const result = await tagsController.deleteTag(
          request.params.tagId,
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
            .status(prismaErr.statusCode as 500)
            .send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Failed to delete tag" });
      }
    },
  });

  // POST /merge - Merge tags
  api.post("/merge", {
    schema: {
      body: MergeExerciseTagsSchema,
      response: {
        200: ExerciseTagResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: MergeExerciseTagsInput }>,
      reply,
    ) => {
      try {
        const result = await tagsController.mergeTags(
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
            .status(prismaErr.statusCode as 500)
            .send({ message: prismaErr.message });
        }
        return reply.status(500).send({ message: "Failed to merge tags" });
      }
    },
  });
}
