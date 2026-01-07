import {
  BaseResponseErrorSchema,
  CenterSchema,
  GetCenterResponseSchema,
  RegisterCenterInput,
  RegisterCenterInputSchema,
  RegisterCenterResponseSchema,
  SignInCenterInput,
  SignInCenterInputSchema,
  SignInCenterResponseSchema,
} from "@workspace/types";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Env from "../../env.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import JwtService from "../../services/jwt.service.js";
import CenterController from "./center.controller.js";
import CenterService from "./center.service.js";

async function centerRoutes(fastify: FastifyInstance, opts: any) {
  const env = fastify.getEnvs<Env>();
  const centerService = new CenterService(fastify.db);
  const jwtService = new JwtService(env.JWT_SECRET);
  const centerController = new CenterController(
    centerService,
    fastify.firebaseAuth,
    jwtService,
  );

  fastify.post("/register", {
    schema: {
      description: "Register a center",
      tags: ["center"],
      body: RegisterCenterInputSchema,
      response: {
        200: RegisterCenterResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: RegisterCenterInput }>,
      _reply: FastifyReply,
    ) => await centerController.register(request.body),
  });

  fastify.post("/signIn", {
    schema: {
      description: "Sign in a center",
      tags: ["center"],
      body: SignInCenterInputSchema,
      response: {
        200: SignInCenterResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: SignInCenterInput }>,
      reply: FastifyReply,
    ) => {
      const result = await centerController.signIn(request.body);

      return reply
        .setCookie("token", result.data.token, {
          domain: env.NODE_ENV == "production" ? "classlite.app" : undefined,
          httpOnly: true,
          sameSite: env.NODE_ENV == "production" ? "none" : "lax",
          secure: env.NODE_ENV == "production" ? true : false,
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        })
        .send(result);
    },
  });

  fastify.get("/", {
    schema: {
      description: "Get current center",
      tags: ["center"],
      response: {
        200: GetCenterResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware([])],
    handler: async (request: FastifyRequest, _reply: FastifyReply) =>
      await centerController.getCurrentCenter(request.jwtPayload.id),
  });

  fastify.post("/sign-out", {
    schema: {
      description: "Sign out a center",
      tags: ["center"],
      response: {
        200: { type: "object", properties: { message: { type: "string" } } },
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware],
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply
        .clearCookie("token", {
          domain: env.NODE_ENV == "production" ? "classlite.app" : undefined,
          httpOnly: true,
          sameSite: env.NODE_ENV == "production" ? "none" : "lax",
          secure: env.NODE_ENV == "production" ? true : false,
          path: "/",
        })
        .send({ message: "Sign out successfully" });
    },
  });
}

export default centerRoutes;
