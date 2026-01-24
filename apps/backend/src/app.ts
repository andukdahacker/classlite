import fastifyCookie from "@fastify/cookie";
import fastifyEnv from "@fastify/env";
import { FastifyInstance } from "fastify";
import {
    ZodTypeProvider,
    validatorCompiler,
    serializerCompiler,
    jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { Server, IncomingMessage, ServerResponse } from "http";
import Env from "./env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tenantRoutes } from "./modules/tenants/tenant.routes.js";
import { invitationRoutes } from "./modules/tenants/invitation.routes.js";
import firebasePlugin from "./plugins/firebase.plugin.js";
import prismaPlugin from "./plugins/prisma.plugin.js";
import resendPlugin from "./plugins/resend.plugin.js";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";

export const buildApp = async () => {
    console.log("Starting server...", process.env.NODE_ENV);

    const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify(
        {
            logger: true,
        },
    ).withTypeProvider<ZodTypeProvider>();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifyEnv, {
        dotenv: true,
        schema: {
            type: "object",
            required: [
                "PORT",
                "FIREBASE_PROJECT_ID",
                "FIREBASE_CLIENT_EMAIL",
                "FIREBASE_PRIVATE_KEY",
                "PLATFORM_ADMIN_API_KEY",
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
                },
                RESEND_API_KEY: {
                    type: "string",
                },
                PLATFORM_ADMIN_API_KEY: {
                    type: "string",
                },
                EMAIL_FROM: {
                    type: "string",
                },
            },
        },
    });

    const env = app.getEnvs<Env>();

    app.register(cors, {
        origin:
            env.NODE_ENV == "production"
                ? ["https://classlite.app"]
                : [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:4321",
                    "http://127.0.0.1:4321",
                ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Platform-Admin-Api-Key",
        ],
    });

    app.register(helmet, {
        crossOriginResourcePolicy: { policy: "cross-origin" },
    });

    app.register(swagger, {
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "ClassLite API",
                description: "ClassLite API",
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
        transform: jsonSchemaTransform,
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

    app.register(firebasePlugin, {
        credential: {
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY
                ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
                : undefined,
        },
    });

    app.register(prismaPlugin);

    app.register(resendPlugin, {
        apiKey: env.RESEND_API_KEY,
    });

    await app.register(fastifyCookie);

    // Register routes
    await app.register(tenantRoutes, { prefix: "/api/v1/tenants" });
    await app.register(authRoutes, { prefix: "/api/v1/auth" });
    await app.register(invitationRoutes, { prefix: "/api/v1/invitations" });

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
