import { FastifyReply, FastifyRequest } from "fastify";
import { CreateTenantInput } from "@workspace/types";
import { TenantService } from "./tenant.service.js";

export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  provision = async (
    request: FastifyRequest<{ Body: CreateTenantInput }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.tenantService.createTenant(request.body);
      return reply.status(201).send({
        data: result,
        message: "Tenant provisioned successfully",
      });
    } catch (error: any) {
      if (error.code === "P2002" || error.message?.includes("CONFLICT")) {
        return reply.status(409).send({
          message:
            error.message.replace("CONFLICT: ", "") || "A conflict occurred",
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        message: error.message || "Failed to provision tenant",
      });
    }
  };
}
