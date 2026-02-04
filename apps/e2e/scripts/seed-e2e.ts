/**
 * E2E Test Data Seeding Script
 *
 * This script seeds the database and Firebase Auth emulator with test users
 * for E2E testing. Run this after starting the Firebase emulator.
 *
 * Usage:
 *   pnpm --filter @workspace/e2e seed
 */

import { PrismaClient } from "@workspace/db/generated/client";

const prisma = new PrismaClient();

// Test users configuration - must match fixtures/auth.fixture.ts
const TEST_CENTER = {
  id: "e2e-test-center",
  name: "E2E Test Center",
  slug: "e2e-test-center",
};

const TEST_USERS = [
  {
    id: "e2e-owner",
    email: "owner@test.classlite.com",
    name: "Test Owner",
    role: "OWNER" as const,
    firebaseUid: "e2e-owner-firebase",
  },
  {
    id: "e2e-admin",
    email: "admin@test.classlite.com",
    name: "Test Admin",
    role: "ADMIN" as const,
    firebaseUid: "e2e-admin-firebase",
  },
  {
    id: "e2e-teacher",
    email: "teacher@test.classlite.com",
    name: "Test Teacher",
    role: "TEACHER" as const,
    firebaseUid: "e2e-teacher-firebase",
  },
  {
    id: "e2e-student",
    email: "student@test.classlite.com",
    name: "Test Student",
    role: "STUDENT" as const,
    firebaseUid: "e2e-student-firebase",
  },
];

const TEST_PASSWORD = "TestPassword123!";

async function seedFirebaseUsers() {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!emulatorHost) {
    console.log("⚠️  FIREBASE_AUTH_EMULATOR_HOST not set, skipping Firebase seeding");
    console.log("   Set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 to enable");
    return;
  }

  console.log(`🔥 Seeding Firebase Auth Emulator at ${emulatorHost}...`);

  const baseUrl = `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`;
  const projectId = process.env.FIREBASE_PROJECT_ID || "claite-87848";

  for (const user of TEST_USERS) {
    try {
      // Delete existing user if present (ignore errors)
      await fetch(
        `http://${emulatorHost}/emulator/v1/projects/${projectId}/accounts`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localId: user.firebaseUid }),
        }
      ).catch(() => {});

      // Create user in Firebase Auth emulator
      const response = await fetch(
        `${baseUrl}/projects/${projectId}/accounts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localId: user.firebaseUid,
            email: user.email,
            password: TEST_PASSWORD,
            displayName: user.name,
            emailVerified: true,
          }),
        }
      );

      if (response.ok) {
        console.log(`   ✓ Created Firebase user: ${user.email}`);
      } else {
        const error = await response.text();
        // User might already exist, which is fine
        if (error.includes("EMAIL_EXISTS") || error.includes("DUPLICATE_LOCAL_ID")) {
          console.log(`   ✓ Firebase user exists: ${user.email}`);
        } else {
          console.log(`   ✗ Failed to create ${user.email}: ${error}`);
        }
      }
    } catch (error) {
      console.log(`   ✗ Error creating ${user.email}:`, error);
    }
  }
}

async function seedDatabase() {
  console.log("🗄️  Seeding database...");

  try {
    // Create or update test center
    await prisma.center.upsert({
      where: { id: TEST_CENTER.id },
      update: { name: TEST_CENTER.name, slug: TEST_CENTER.slug },
      create: TEST_CENTER,
    });
    console.log(`   ✓ Created center: ${TEST_CENTER.name}`);

    // Create users and memberships
    for (const user of TEST_USERS) {
      // Create user
      await prisma.user.upsert({
        where: { id: user.id },
        update: { email: user.email, name: user.name },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      // Create auth account (Firebase link)
      await prisma.authAccount.upsert({
        where: {
          provider_providerUserId: {
            provider: "FIREBASE",
            providerUserId: user.firebaseUid,
          },
        },
        update: { email: user.email },
        create: {
          userId: user.id,
          provider: "FIREBASE",
          providerUserId: user.firebaseUid,
          email: user.email,
        },
      });

      // Create center membership
      await prisma.centerMembership.upsert({
        where: {
          centerId_userId: {
            centerId: TEST_CENTER.id,
            userId: user.id,
          },
        },
        update: { role: user.role, status: "ACTIVE" },
        create: {
          centerId: TEST_CENTER.id,
          userId: user.id,
          role: user.role,
          status: "ACTIVE",
        },
      });

      console.log(`   ✓ Created user: ${user.email} (${user.role})`);
    }

    // Create a test course for logistics tests
    const testCourse = await prisma.course.upsert({
      where: { id_centerId: { id: "e2e-test-course", centerId: TEST_CENTER.id } },
      update: {},
      create: {
        id: "e2e-test-course",
        name: "E2E Test Course",
        description: "Course for E2E testing",
        color: "#3B82F6",
        centerId: TEST_CENTER.id,
      },
    });
    console.log(`   ✓ Created course: ${testCourse.name}`);

    // Create a test class
    const teacher = TEST_USERS.find((u) => u.role === "TEACHER");
    const testClass = await prisma.class.upsert({
      where: { id_centerId: { id: "e2e-test-class", centerId: TEST_CENTER.id } },
      update: {},
      create: {
        id: "e2e-test-class",
        name: "E2E Test Class",
        courseId: testCourse.id,
        teacherId: teacher?.id,
        centerId: TEST_CENTER.id,
      },
    });
    console.log(`   ✓ Created class: ${testClass.name}`);

    console.log("\n✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

async function main() {
  console.log("\n🌱 E2E Test Data Seeding\n");

  try {
    await seedFirebaseUsers();
    console.log("");
    await seedDatabase();
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
