import { FastifyInstance } from "fastify";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`;

      return reply.status(200).send({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    } catch {
      return reply.status(503).send({
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
