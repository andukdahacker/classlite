import { FastifyInstance } from "fastify";
import { FastifyReply } from "fastify/types/reply.js";
import { FastifyRequest } from "fastify/types/request.js";
import {
  BaseResponseErrorSchema,
  CreateUserInput,
  CreateUserInputSchema,
  CreateUserResponseSchema,
  DeleteUserInput,
  DeleteUserInputSchema,
  GetUserInput,
  GetUserInputSchema,
  GetUserListInputSchema,
  GetUserListResponseSchema,
  GetUserResponseSchema,
  NoDataResponseSchema,
  SignInUserInput,
  SignInUserInputSchema,
  SignInUserResponseSchema,
  UpdateUserInput,
  UpdateUserInputSchema,
  UpdateUserResponseSchema,
  UserRoleSchema,
  UserSchema,
} from "@workspace/types";
import Env from "../../env.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import JwtService from "../../services/jwt.service.js";
import UserController from "./user.controller.js";
import UserService from "./user.service.js";

async function userRoutes(fastify: FastifyInstance, opts: any) {
  fastify.addSchema(UserRoleSchema);
  fastify.addSchema(UserSchema);
  fastify.addSchema(CreateUserInputSchema);
  fastify.addSchema(GetUserListInputSchema);
  fastify.addSchema(SignInUserInputSchema);
  fastify.addSchema(UpdateUserInputSchema);

  const env = fastify.getEnvs<Env>();
  const userService = new UserService(fastify.db);
  const jwtService = new JwtService(env.JWT_SECRET);
  const userController = new UserController(userService, jwtService);

  fastify.post("/", {
    schema: {
      description: "Create a user",
      tags: ["users"],
      body: CreateUserInputSchema,
      response: {
        200: CreateUserResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateUserInput }>,
      _reply: FastifyReply,
    ) => await userController.createUser(request.body, request.jwtPayload),
  });

  fastify.get("/:id", {
    schema: {
      description: "Get a user",
      tags: ["users"],
      params: GetUserInputSchema,
      response: {
        200: GetUserResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Params: GetUserInput }>,
      _reply: FastifyReply,
    ) => userController.getUserById(request.params),
  });

  fastify.put("/", {
    schema: {
      description: "Update a user",
      tags: ["users"],
      body: UpdateUserInputSchema,
      response: {
        200: UpdateUserResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Body: UpdateUserInput }>,
      _reply: FastifyReply,
    ) => userController.updateUser(request.body),
  });

  fastify.delete("/:userId", {
    schema: {
      description: "Delete a user",
      tags: ["users"],
      params: DeleteUserInputSchema,
      response: {
        200: NoDataResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN"])],
    handler: async (
      request: FastifyRequest<{ Params: DeleteUserInput }>,
      _reply: FastifyReply,
    ) => userController.deleteUser(request.params),
  });

  fastify.get("/list", {
    schema: {
      description: "Get list of users",
      tags: ["users"],
      response: {
        200: GetUserListResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN"])],
    handler: async (request: FastifyRequest, _reply: FastifyReply) =>
      await userController.getUserList(request.jwtPayload),
  });

  fastify.post("/signIn", {
    schema: {
      description: "Sign in a user",
      tags: ["users"],
      body: SignInUserInputSchema,
      response: {
        200: SignInUserResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: SignInUserInput }>,
      _reply: FastifyReply,
    ) => userController.signIn(request.body),
  });
}

export default userRoutes;
