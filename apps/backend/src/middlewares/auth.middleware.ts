import { FastifyReply, FastifyRequest } from "fastify";
import { UserRole } from "@workspace/types";

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

    request.jwtPayload = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: (decodedToken.role as UserRole) || "STUDENT",
      centerId: decodedToken.center_id || null,
    };
  } catch (error: any) {
    request.server.log.error(error);
    return reply.status(401).send({
      data: null,
      message: "UNAUTHORIZED: Invalid or expired token",
    });
  }
};
