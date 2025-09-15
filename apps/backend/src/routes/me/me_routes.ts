import { BaseResponseErrorSchema, GetMeResponseSchema } from "@workspace/types";
import { FastifyInstance, FastifyReply } from "fastify";
import { FastifyRequest } from "fastify/types/request.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import CenterService from "../center/center.service.js";
import UserService from "../user/user.service.js";
import MeController from "./me_controller.js";

async function meRoutes(fastify: FastifyInstance, opts: any) {
  const userService = new UserService(fastify.db);
  const centerService = new CenterService(fastify.db);
  const meController = new MeController(centerService, userService);

  fastify.get("/", {
    schema: {
      description: "Get me",
      tags: ["me"],
      response: {
        200: GetMeResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware],
    handler: async (request: FastifyRequest, _reply: FastifyReply) =>
      await meController.getMe(request.jwtPayload),
    errorHandler: (error, req, rep) => {
      rep.log.error(error);

      return rep.status(401).send({
        error: error,
        message: "Unauthorized",
      });
    },
  });
}

export default meRoutes;
