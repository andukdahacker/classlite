import {
  BaseResponseErrorSchema,
  CreateUserInput,
  CreateUserInputSchema,
  CreateUserResponseSchema,
  DeleteUserInput,
  DeleteUserInputSchema,
  GetUserDetailsResponseSchema,
  GetUserInput,
  GetUserInputSchema,
  GetUserListInputSchema,
  GetUserListResponseSchema,
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
import { FastifyInstance } from "fastify";
import { FastifyReply } from "fastify/types/reply.js";
import { FastifyRequest } from "fastify/types/request.js";
import Env from "../../env.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import EmailService from "../../services/email.service.js";
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
  const emailService = new EmailService({
    apiKey: env.RESEND_API_KEY,
    templatesDir: "/templates",
    logger: fastify.log,
    nodeEnv: env.NODE_ENV,
  });
  const userController = new UserController(
    userService,
    jwtService,
    emailService,
  );

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
        200: GetUserDetailsResponseSchema,
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
      reply: FastifyReply,
    ) => {
      const result = await userController.signIn(request.body);

      return reply
        .setCookie("token", result.data.token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        })
        .send(result);
    },
  });
}

export default userRoutes;
