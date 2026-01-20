import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import {
  CenterSignupRequest,
  CenterSignupWithGoogleRequest,
  LoginRequest,
} from "@workspace/types";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async centerSignup(
    request: FastifyRequest<{ Body: CenterSignupRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.authService.centerSignup(request.body);
      return reply.status(201).send({
        data: result,
        message: "Center registered successfully",
      });
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.startsWith("CONFLICT") ? 409 : 400;
      return reply.status(statusCode).send({
        data: null,
        message: error.message || "Registration failed",
      });
    }
  }

  async centerSignupWithGoogle(
    request: FastifyRequest<{ Body: CenterSignupWithGoogleRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.authService.centerSignupWithGoogle(
        request.body,
      );
      return reply.status(201).send({
        data: result,
        message: "Center registered successfully with Google",
      });
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.startsWith("CONFLICT") ? 409 : 400;
      return reply.status(statusCode).send({
        data: null,
        message: error.message || "Registration failed",
      });
    }
  }

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
