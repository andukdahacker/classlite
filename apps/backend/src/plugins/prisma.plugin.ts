import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@workspace/db";
import Env from "../env.js";
import { PrismaPg } from "@prisma/adapter-pg"

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const env = fastify.getEnvs<Env>();

  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter
  });

  await prisma.$connect();

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (server) => {
    await server.prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
