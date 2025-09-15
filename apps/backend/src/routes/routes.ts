import { FastifyInstance } from "fastify";
import assignmentRoutes from "./assignment/assignment.routes.js";
import centerRoutes from "./center/center.route.js";
import classRoutes from "./class/class.route.js";
import exerciseRoutes from "./exercise/exercise.route.js";
import meRoutes from "./me/me_routes.js";
import submissionRoutes from "./submission/submission.routes.js";
import userRoutes from "./user/user.route.js";

async function routes(fastify: FastifyInstance, opts: any) {
  fastify.register(meRoutes, { prefix: "/me" });
  fastify.register(centerRoutes, { prefix: "/center" });
  fastify.register(userRoutes, { prefix: "/user" });
  fastify.register(classRoutes, { prefix: "/class" });
  fastify.register(exerciseRoutes, { prefix: "/exercise" });
  fastify.register(assignmentRoutes, { prefix: "/assignment" });
  fastify.register(submissionRoutes, { prefix: "/submission" });
}

export default routes;
