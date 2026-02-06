import {
  CreateQuestionSectionSchema,
  UpdateQuestionSectionSchema,
  QuestionSectionResponseSchema,
  QuestionSectionListResponseSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  QuestionResponseSchema,
  ErrorResponseSchema,
  CreateQuestionSectionInput,
  UpdateQuestionSectionInput,
  CreateQuestionInput,
  UpdateQuestionInput,
} from "@workspace/types";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { AppError } from "../../errors/app-error.js";
import { mapPrismaError } from "../../errors/prisma-errors.js";
import { SectionsController } from "./sections.controller.js";
import { SectionsService } from "./sections.service.js";
import z from "zod";

export async function sectionsRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const sectionsService = new SectionsService(fastify.prisma);
  const sectionsController = new SectionsController(sectionsService);

  // All section routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  // GET /:exerciseId/sections - List sections
  api.get("/:exerciseId/sections", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
      }),
      response: {
        200: QuestionSectionListResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: { exerciseId: string } }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.listSections(
          request.params.exerciseId,
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
          .send({ message: "Failed to list sections" });
      }
    },
  });

  // POST /:exerciseId/sections - Create section
  api.post("/:exerciseId/sections", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
      }),
      body: CreateQuestionSectionSchema,
      response: {
        201: QuestionSectionResponseSchema,
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
        Params: { exerciseId: string };
        Body: CreateQuestionSectionInput;
      }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.createSection(
          request.params.exerciseId,
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
          .send({ message: "Failed to create section" });
      }
    },
  });

  // PATCH /:exerciseId/sections/:sectionId - Update section
  api.patch("/:exerciseId/sections/:sectionId", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
        sectionId: z.string(),
      }),
      body: UpdateQuestionSectionSchema,
      response: {
        200: QuestionSectionResponseSchema,
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
        Params: { exerciseId: string; sectionId: string };
        Body: UpdateQuestionSectionInput;
      }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.updateSection(
          request.params.exerciseId,
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

  // DELETE /:exerciseId/sections/:sectionId - Delete section
  api.delete("/:exerciseId/sections/:sectionId", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
        sectionId: z.string(),
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
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { exerciseId: string; sectionId: string };
      }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.deleteSection(
          request.params.exerciseId,
          request.params.sectionId,
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
          .send({ message: "Failed to delete section" });
      }
    },
  });

  // POST /:exerciseId/sections/:sectionId/questions - Create question
  api.post("/:exerciseId/sections/:sectionId/questions", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
        sectionId: z.string(),
      }),
      body: CreateQuestionSchema,
      response: {
        201: QuestionResponseSchema,
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
        Params: { exerciseId: string; sectionId: string };
        Body: CreateQuestionInput;
      }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.createQuestion(
          request.params.exerciseId,
          request.params.sectionId,
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
          .send({ message: "Failed to create question" });
      }
    },
  });

  // PATCH /:exerciseId/sections/:sectionId/questions/:questionId - Update question
  api.patch("/:exerciseId/sections/:sectionId/questions/:questionId", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
        sectionId: z.string(),
        questionId: z.string(),
      }),
      body: UpdateQuestionSchema,
      response: {
        200: QuestionResponseSchema,
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
        Params: {
          exerciseId: string;
          sectionId: string;
          questionId: string;
        };
        Body: UpdateQuestionInput;
      }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.updateQuestion(
          request.params.exerciseId,
          request.params.sectionId,
          request.params.questionId,
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
          .send({ message: "Failed to update question" });
      }
    },
  });

  // DELETE /:exerciseId/sections/:sectionId/questions/:questionId - Delete question
  api.delete("/:exerciseId/sections/:sectionId/questions/:questionId", {
    schema: {
      params: z.object({
        exerciseId: z.string(),
        sectionId: z.string(),
        questionId: z.string(),
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
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{
        Params: {
          exerciseId: string;
          sectionId: string;
          questionId: string;
        };
      }>,
      reply,
    ) => {
      try {
        const result = await sectionsController.deleteQuestion(
          request.params.exerciseId,
          request.params.sectionId,
          request.params.questionId,
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
          .send({ message: "Failed to delete question" });
      }
    },
  });
}
