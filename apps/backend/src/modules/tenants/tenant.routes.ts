import {
  CreateTenantInput,
  CreateTenantSchema,
  TenantResponseSchema,
} from "@workspace/types";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Env from "../../env.js";
import { TenantController } from "./tenant.controller.js";
import { TenantService } from "./tenant.service.js";

export async function tenantRoutes(fastify: FastifyInstance) {
  const env = fastify.getEnvs<Env>();
  const api = fastify.withTypeProvider<ZodTypeProvider>();

  const tenantService = new TenantService(
    fastify.prisma,
    fastify.firebaseAuth,
    fastify.resend,
    {
      emailFrom: env.EMAIL_FROM || "ClassLite <no-reply@classlite.app>",
    },
  );
  const tenantController = new TenantController(tenantService);

  api.post<{ Body: CreateTenantInput }>("/", {
    schema: {
      body: CreateTenantSchema,
      response: {
        201: TenantResponseSchema,
      },
      headers: {
        type: "object",
        properties: {
          "x-platform-admin-key": { type: "string" },
        },
        required: ["x-platform-admin-key"],
      },
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      const adminKey = request.headers["x-platform-admin-key"];
      if (adminKey !== env.PLATFORM_ADMIN_API_KEY) {
        return reply
          .status(401)
          .send({ message: "Unauthorized: Invalid platform admin key" });
      }
    },
    handler: tenantController.provision,
  });
}
