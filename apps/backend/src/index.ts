import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { FastifyInstance } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import Env from "./env.js";
import firebasePlugin from "./plugins/firebase.plugin.js";
import prismaPlugin from "./plugins/prisma.plugin.js";

const build = async () => {
  console.log("Starting server...", process.env.NODE_ENV);

  const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify(
    {
      logger: true,
    },
  );

  await app.register(fastifyEnv, {
    dotenv: true,
    schema: {
      type: "object",
      required: [
        "PORT",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY",
      ],
      properties: {
        NODE_ENV: {
          type: "string",
        },
        PORT: {
          type: "number",
        },
        DATABASE_URL: {
          type: "string",
        },
        JWT_SECRET: {
          type: "string",
        },
        FIREBASE_PROJECT_ID: {
          type: "string",
        },
        FIREBASE_CLIENT_EMAIL: {
          type: "string",
        },
        FIREBASE_PRIVATE_KEY: {
          type: "string",
        }
      },
    },
  });

  const env = app.getEnvs<Env>();

  app.register(cors, {
    origin:
      env.NODE_ENV == "production"
        ? ["https://classlite.app"]
        : ["http://localhost:5173", "https://classlite.app"],
    credentials: true,
  });

  app.register(helmet);

  app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "IELTS Nook API",
        description: "IELTS Nook API",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local server",
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "apiKey",
            in: "header",
          },
        },
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  app.register(prismaPlugin);

  app.register(firebasePlugin, {
    credential: {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY
        ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
    },
  });

  await app.register(fastifyCookie);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.log.error(error);
    return reply.status(500).send({
      error,
      message: "Internal server error",
    });
  });

  return app;
};

const start = async (app: FastifyInstance) => {
  const env = app.getEnvs<Env>();
  const isProd = env.NODE_ENV == "production";
  await app.listen({
    port: env.PORT,
    host: isProd ? "0.0.0.0" : "localhost",
  });
};

build()
  .then((server) => start(server))
  .catch((err) => {
    console.log("Error starting server: ", err);
  });