/**
 * Production Environment Seed Script
 *
 * Creates ONLY the platform admin account for production bootstrap.
 * No test data, no demo centers — minimal production seed.
 *
 * Idempotent — safe to run multiple times.
 *
 * Prerequisites:
 *   - DATABASE_URL pointing to production database
 *   - PRODUCTION_SEED_CONFIRM=yes (explicit confirmation required)
 *   - PRODUCTION_ADMIN_FIREBASE_UID set to the Firebase UID of the admin user
 *   - PRODUCTION_ADMIN_EMAIL set to the admin's email address
 *
 * Usage:
 *   DATABASE_URL=<prod-db-url> PRODUCTION_SEED_CONFIRM=yes \
 *     PRODUCTION_ADMIN_FIREBASE_UID=<uid> PRODUCTION_ADMIN_EMAIL=<email> \
 *     pnpm --filter=@workspace/db db:seed:production
 */

import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Safety: require explicit confirmation for production seed
if (process.env.PRODUCTION_SEED_CONFIRM !== "yes") {
  console.error(
    "Production seed requires explicit confirmation.\n" +
      "Set PRODUCTION_SEED_CONFIRM=yes to proceed.",
  );
  process.exit(1);
}

const ADMIN_FIREBASE_UID = process.env.PRODUCTION_ADMIN_FIREBASE_UID;
const ADMIN_EMAIL = process.env.PRODUCTION_ADMIN_EMAIL;

if (!ADMIN_FIREBASE_UID || !ADMIN_EMAIL) {
  console.error(
    "Required environment variables:\n" +
      "  PRODUCTION_ADMIN_FIREBASE_UID - Firebase UID of the platform admin\n" +
      "  PRODUCTION_ADMIN_EMAIL - Email address of the platform admin",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedPlatformAdmin() {
  console.log("Creating platform admin account...");

  const admin = await prisma.user.upsert({
    where: { id: "platform-admin" },
    update: { email: ADMIN_EMAIL! },
    create: {
      id: "platform-admin",
      email: ADMIN_EMAIL!,
      name: "Platform Admin",
    },
  });

  // Link Firebase auth
  await prisma.authAccount.deleteMany({
    where: { userId: admin.id, provider: "FIREBASE" },
  });
  await prisma.authAccount.create({
    data: {
      userId: admin.id,
      provider: "FIREBASE",
      providerUserId: ADMIN_FIREBASE_UID!,
      email: ADMIN_EMAIL!,
    },
  });

  console.log(`  + Platform admin: ${ADMIN_EMAIL}`);
}

async function main() {
  console.log("\nProduction Environment Seed\n");

  try {
    await seedPlatformAdmin();
    console.log("\nProduction seed complete.");
  } catch (error) {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
