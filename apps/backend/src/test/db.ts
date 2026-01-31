/**
 * Test database utilities for integration tests.
 *
 * This module provides a properly configured PrismaClient for tests
 * that matches the production configuration (using PrismaPg adapter).
 *
 * Usage in tests:
 *   import { getTestPrisma, closeTestPrisma } from "../../test/db.js";
 *
 *   let prisma: PrismaClient;
 *   beforeAll(async () => { prisma = await getTestPrisma(); });
 *   afterAll(async () => { await closeTestPrisma(); });
 */

import { PrismaClient } from "@workspace/db";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | null = null;

/**
 * Get the test database URL from environment variables.
 * Falls back to a default local development URL if not set.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required for integration tests.\n" +
        "Set it in apps/backend/.env or as an environment variable.\n" +
        "Example: DATABASE_URL=postgresql://user:password@localhost:5432/classlite_test"
    );
  }
  return url;
}

/**
 * Get or create a singleton PrismaClient instance for tests.
 * Uses the same PrismaPg adapter as production to ensure consistent behavior.
 */
export async function getTestPrisma(): Promise<PrismaClient> {
  if (prisma) {
    return prisma;
  }

  const connectionString = getDatabaseUrl();

  const adapter = new PrismaPg({ connectionString });

  prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  return prisma;
}

/**
 * Close the test database connection.
 * Call this in afterAll() to clean up.
 */
export async function closeTestPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Check if the database is available for integration tests.
 * Returns true if connection succeeds, false otherwise.
 */
export async function isTestDatabaseAvailable(): Promise<boolean> {
  try {
    const client = await getTestPrisma();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
