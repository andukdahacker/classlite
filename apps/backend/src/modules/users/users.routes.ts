import {
  UserListQuerySchema,
  UserListResponseSchema,
  UserProfileResponseSchema,
  ChangeRoleRequestSchema,
  ChangeRoleResponseSchema,
  UserStatusResponseSchema,
  BulkUserActionRequestSchema,
  BulkActionResponseSchema,
  InvitationListQuerySchema,
  InvitationListResponseSchema,
  ErrorResponseSchema,
  type UserListQuery,
  type ChangeRoleRequest,
  type BulkUserActionRequest,
} from "@workspace/types";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

export async function usersRoutes(fastify: FastifyInstance) {
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const usersService = new UsersService(fastify.prisma);
  const usersController = new UsersController(usersService);

  // All user routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  // GET /api/v1/users - List users with filters, pagination
  api.get("/", {
    schema: {
      querystring: UserListQuerySchema,
      response: {
        200: UserListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Querystring: UserListQuery }>,
      reply
    ) => {
      const result = await usersController.listUsers(
        request.query,
        request.jwtPayload!
      );
      return reply.send(result);
    },
  });

  // GET /api/v1/users/invitations - List invitations
  api.get("/invitations", {
    schema: {
      querystring: InvitationListQuerySchema,
      response: {
        200: InvitationListResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Querystring: { status?: string } }>,
      reply
    ) => {
      const result = await usersController.listInvitations(
        request.query.status,
        request.jwtPayload!
      );
      return reply.send(result);
    },
  });

  // POST /api/v1/users/invitations/:id/resend - Resend invitation
  api.post("/invitations/:id/resend", {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          data: z.object({
            id: z.string(),
            status: z.string(),
          }),
          message: z.string(),
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply
    ) => {
      try {
        const result = await usersController.resendInvitation(
          request.params.id,
          request.jwtPayload!
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        if (
          err.message === "Invitation not found" ||
          err.message === "User has already accepted the invitation"
        ) {
          return reply.status(400).send({ message: err.message });
        }
        throw error;
      }
    },
  });

  // DELETE /api/v1/users/invitations/:id - Revoke invitation
  api.delete("/invitations/:id", {
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
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply
    ) => {
      try {
        const result = await usersController.revokeInvitation(
          request.params.id,
          request.jwtPayload!
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        if (
          err.message === "Invitation not found" ||
          err.message.includes("Cannot revoke")
        ) {
          return reply.status(400).send({ message: err.message });
        }
        throw error;
      }
    },
  });

  // GET /api/v1/users/:userId - Get single user profile
  api.get("/:userId", {
    schema: {
      params: z.object({
        userId: z.string(),
      }),
      response: {
        200: UserProfileResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN", "TEACHER", "STUDENT"])],
    handler: async (
      request: FastifyRequest<{ Params: { userId: string } }>,
      reply
    ) => {
      try {
        const result = await usersController.getUser(
          request.params.userId,
          request.jwtPayload!
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === "User not found in this center") {
          return reply.status(404).send({ message: err.message });
        }
        throw error;
      }
    },
  });

  // PATCH /api/v1/users/:userId/role - Change role (Owner only)
  api.patch("/:userId/role", {
    schema: {
      params: z.object({
        userId: z.string(),
      }),
      body: ChangeRoleRequestSchema,
      response: {
        200: ChangeRoleResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER"])],
    handler: async (
      request: FastifyRequest<{
        Params: { userId: string };
        Body: ChangeRoleRequest;
      }>,
      reply
    ) => {
      try {
        const result = await usersController.changeRole(
          request.params.userId,
          request.body,
          request.jwtPayload!
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        if (
          err.message === "User not found in this center" ||
          err.message === "Cannot change role of an owner"
        ) {
          return reply.status(400).send({ message: err.message });
        }
        throw error;
      }
    },
  });

  // PATCH /api/v1/users/:userId/deactivate - Deactivate user
  api.patch("/:userId/deactivate", {
    schema: {
      params: z.object({
        userId: z.string(),
      }),
      response: {
        200: UserStatusResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Params: { userId: string } }>,
      reply
    ) => {
      try {
        const result = await usersController.deactivateUser(
          request.params.userId,
          request.jwtPayload!
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        if (
          err.message === "Cannot deactivate yourself" ||
          err.message === "Cannot deactivate an owner" ||
          err.message === "User not found in this center"
        ) {
          return reply.status(400).send({ message: err.message });
        }
        throw error;
      }
    },
  });

  // PATCH /api/v1/users/:userId/reactivate - Reactivate user
  api.patch("/:userId/reactivate", {
    schema: {
      params: z.object({
        userId: z.string(),
      }),
      response: {
        200: UserStatusResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Params: { userId: string } }>,
      reply
    ) => {
      try {
        const result = await usersController.reactivateUser(
          request.params.userId,
          request.jwtPayload!
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === "User not found in this center") {
          return reply.status(400).send({ message: err.message });
        }
        throw error;
      }
    },
  });

  // POST /api/v1/users/bulk-deactivate - Bulk deactivate
  api.post("/bulk-deactivate", {
    schema: {
      body: BulkUserActionRequestSchema,
      response: {
        200: BulkActionResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: BulkUserActionRequest }>,
      reply
    ) => {
      const result = await usersController.bulkDeactivate(
        request.body,
        request.jwtPayload!
      );
      return reply.send(result);
    },
  });

  // POST /api/v1/users/bulk-remind - Bulk reminder
  api.post("/bulk-remind", {
    schema: {
      body: BulkUserActionRequestSchema,
      response: {
        200: BulkActionResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: [requireRole(["OWNER", "ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: BulkUserActionRequest }>,
      reply
    ) => {
      const result = await usersController.bulkRemind(
        request.body,
        request.jwtPayload!
      );
      return reply.send(result);
    },
  });
}
