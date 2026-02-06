import { FastifyReply, FastifyRequest } from "fastify";
import { UserRole, UserRoleSchema } from "@workspace/types";

declare module "fastify" {
  interface FastifyRequest {
    jwtPayload?: {
      uid: string;
      email: string;
      role: UserRole;
      centerId: string | null;
    };
  }
}

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({
      data: null,
      message: "UNAUTHORIZED: Missing or invalid authorization header",
    });
  }

  const idToken = authHeader.split(" ")[1];

  if (!idToken) {
    return reply.status(401).send({
      data: null,
      message: "UNAUTHORIZED: Token not found in header",
    });
  }

  try {
    if (!request.server.firebaseAuth) {
      throw new Error("INTERNAL_ERROR: Firebase Auth not initialized");
    }

    const decodedToken =
      await request.server.firebaseAuth.verifyIdToken(idToken);

    const roleParsed = UserRoleSchema.safeParse(decodedToken.role);
    if (!roleParsed.success) {
      return reply.status(401).send({
        message: "UNAUTHORIZED: Invalid role in token claims",
      });
    }

    request.jwtPayload = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: roleParsed.data,
      centerId: decodedToken.center_id || null,
    };
  } catch (error: unknown) {
    request.server.log.error(error);
    return reply.status(401).send({
      data: null,
      message: "UNAUTHORIZED: Invalid or expired token",
    });
  }
};
