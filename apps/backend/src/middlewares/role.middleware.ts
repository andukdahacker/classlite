import { FastifyReply, FastifyRequest } from "fastify";
import { UserRole } from "@workspace/types";

/**
 * Middleware factory to enforce role-based access control.
 * Must be used after authMiddleware in the preHandler hook.
 *
 * @param allowedRoles - A single role or an array of roles that are permitted to access the route.
 * @returns Fastify preHandler function
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.jwtPayload;


    if (!user) {
      request.server.log.error(
        `ROLE_GUARD_ERROR: jwtPayload missing for path ${request.url}. Ensure authMiddleware is in the chain.`,
      );
      return reply.status(401).send({
        data: null,
        message: "UNAUTHORIZED: Authentication context missing",
      });
    }

    if (!roles.includes(user.role)) {
      request.server.log.warn({
        msg: "FORBIDDEN_ATTEMPT",
        userId: user.uid,
        path: request.url,
        method: request.method,
        userRole: user.role,
        requiredRoles: roles,
      });

      return reply.status(403).send({
        data: null,
        error: {
          code: "FORBIDDEN",
          message: `FORBIDDEN: You do not have permission to perform this action. Required: [${roles.join(", ")}]`,
        },
      });
    }
  };
};
