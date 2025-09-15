import { UserRole } from "@workspace/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { JwtPayload } from "jsonwebtoken";
import JwtService from "../services/jwt.service.js";

export type AppJwtPayload = JwtPayload & {
  id: string;
  email: string;
  isCenter: boolean;
  role: UserRole;
  centerId: string;
};

declare module "fastify" {
  interface FastifyRequest {
    jwtPayload: AppJwtPayload;
  }
}
declare module "fastify" {
  interface FastifyRequest {
    jwtService: JwtService;
  }
}
async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  let token: string | undefined;

  if (request.cookies.token) {
    token = request.cookies.token;
  }

  if (!token) {
    //clear cookies
    return reply
      .setCookie("token", "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
        path: "/",
      })
      .send({
        error: "Unauthorized",
        message: "Unauthorized",
      });
  }

  try {
    const decoded = await request.jwtService.verify<AppJwtPayload>(token);
    if (!decoded) {
      return reply
        .setCookie("token", "", {
          httpOnly: true,
          maxAge: 0,
          sameSite: "lax",
          path: "/",
        })
        .send({
          error: "Unauthorized",
          message: "Unauthorized",
        });
    }

    request.jwtPayload = decoded;
  } catch (error) {
    reply.log.error(error);
    return reply
      .setCookie("token", "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
        path: "/",
      })
      .send({
        error: "Unauthorized",
        message: "Unauthorized",
      });
  }
}

export default authMiddleware;
