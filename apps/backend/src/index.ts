import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { FastifyInstance } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { IncomingMessage, Server, ServerResponse } from "http";
import Env from "./env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tenantRoutes } from "./modules/tenants/tenant.routes.js";
import firebasePlugin from "./plugins/firebase.plugin.js";
import prismaPlugin from "./plugins/prisma.plugin.js";
import resendPlugin from "./plugins/resend.plugin.js";
import { buildApp } from "./app.js";

const start = async (app: FastifyInstance) => {
  const env = app.getEnvs<Env>();
  const isProd = env.NODE_ENV == "production";
  await app.listen({
    port: env.PORT,
    host: isProd ? "0.0.0.0" : "localhost",
  });
};

buildApp()
  .then((server) => start(server))
  .catch((err) => {
    console.log("Error starting server: ", err);
  });
