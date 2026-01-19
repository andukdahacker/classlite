import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import { LoginRequest } from "@workspace/types";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply,
  ) {
    const { idToken } = request.body;

    try {
      const result = await this.authService.login(idToken);
      return reply.status(200).send({
        data: result,
        message: "Login successful",
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(401).send({
        data: null,
        message: error.message || "Authentication failed",
      });
    }
  }
}
