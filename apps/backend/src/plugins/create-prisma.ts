import { PrismaClient } from "@workspace/db";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Create a PrismaClient with the PrismaPg adapter.
 *
 * Use this in contexts where the Fastify plugin is unavailable
 * (e.g. Inngest job steps). Callers must call `prisma.$disconnect()`
 * when done.
 */
export function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
