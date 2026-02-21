/**
 * E2E Test Data Seeding Script
 *
 * This script seeds the database and Firebase Auth emulator with test users
 * for E2E testing. Run this after starting the Firebase emulator.
 *
 * Usage:
 *   pnpm --filter @workspace/e2e seed
 */

import { PrismaClient } from "@workspace/db";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

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

  const projectId = process.env.FIREBASE_PROJECT_ID || "claite-87848";

  // Clear all existing accounts to reset any lockout state
  try {
    const clearResponse = await fetch(
      `http://${emulatorHost}/emulator/v1/projects/${projectId}/accounts`,
      { method: "DELETE" }
    );
    if (clearResponse.ok) {
      console.log("   ✓ Cleared existing Firebase accounts");
    }
  } catch {
    // Ignore errors - emulator might not have any accounts yet
  }

  for (const user of TEST_USERS) {
    try {
      // Create user via emulator's signUp endpoint
      // The emulator accepts requests to the identitytoolkit endpoint
      const signUpResponse = await fetch(
        `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            password: TEST_PASSWORD,
            displayName: user.name,
            returnSecureToken: true,
          }),
        }
      );

      if (signUpResponse.ok) {
        const data = await signUpResponse.json();
        console.log(`   ✓ Created Firebase user: ${user.email} (uid: ${data.localId})`);
        // Store the actual Firebase UID for database seeding
        user.firebaseUid = data.localId;
      } else {
        const error = await signUpResponse.text();
        if (error.includes("EMAIL_EXISTS")) {
          // User exists, try to sign in to get the UID
          const signInResponse = await fetch(
            `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                password: TEST_PASSWORD,
                returnSecureToken: true,
              }),
            }
          );
          if (signInResponse.ok) {
            const data = await signInResponse.json();
            user.firebaseUid = data.localId;
            console.log(`   ✓ Firebase user exists: ${user.email} (uid: ${data.localId})`);
          } else {
            console.log(`   ✗ Failed to get existing user ${user.email}`);
          }
        } else {
          console.log(`   ✗ Failed to create ${user.email}: ${error}`);
        }
      }

      // Set custom claims (role, center_id) on the Firebase user so that
      // tokens include these claims from the first sign-in. This prevents
      // the race condition where the client's cached token lacks claims.
      if (user.firebaseUid) {
        const claimsResponse = await fetch(
          `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer owner",
            },
            body: JSON.stringify({
              localId: user.firebaseUid,
              customAttributes: JSON.stringify({
                role: user.role,
                center_id: TEST_CENTER.id,
              }),
            }),
          }
        );
        if (claimsResponse.ok) {
          console.log(`   ✓ Set custom claims for ${user.email} (role: ${user.role})`);
        } else {
          const errBody = await claimsResponse.text();
          console.log(`   ✗ Failed to set claims for ${user.email} (${claimsResponse.status}): ${errBody.substring(0, 200)}`);
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
    // Clear login attempts for test users (reset any lockout state)
    const testEmails = TEST_USERS.map((u) => u.email.toLowerCase());
    await prisma.loginAttempt.deleteMany({
      where: { email: { in: testEmails } },
    });
    console.log("   ✓ Cleared login attempts for test users");

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
      // First, delete any existing auth account for this email to handle UID changes
      await prisma.authAccount.deleteMany({
        where: {
          provider: "FIREBASE",
          email: user.email,
        },
      });

      // Then create the new auth account
      await prisma.authAccount.create({
        data: {
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

    // Create a test room for room management tests
    const existingRoom = await prisma.room.findFirst({
      where: { name: "E2E Room 101", centerId: TEST_CENTER.id },
    });
    if (!existingRoom) {
      await prisma.room.create({
        data: {
          id: "e2e-test-room",
          name: "E2E Room 101",
          centerId: TEST_CENTER.id,
        },
      });
    }
    console.log("   ✓ Created room: E2E Room 101");

    // Assign student to class for roster tests
    const student = TEST_USERS.find((u) => u.role === "STUDENT");
    if (student) {
      await prisma.classStudent.upsert({
        where: {
          classId_studentId: {
            classId: testClass.id,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          classId: testClass.id,
          studentId: student.id,
          centerId: TEST_CENTER.id,
        },
      });
      console.log(`   ✓ Assigned student to class: ${student.name} → ${testClass.name}`);
    }

    console.log("\n✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

async function verifyFirebaseLogin() {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!emulatorHost) return;

  // Verify each user can sign in (confirms user + password are correct)
  console.log("🔍 Verifying Firebase users can sign in...");
  for (const user of TEST_USERS) {
    try {
      const response = await fetch(
        `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            password: TEST_PASSWORD,
            returnSecureToken: true,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✓ Verified ${user.email} (uid: ${data.localId})`);
      } else {
        const error = await response.text();
        console.log(`   ✗ Sign-in failed for ${user.email}: ${error}`);
      }
    } catch (error) {
      console.log(`   ✗ Error verifying ${user.email}:`, error);
    }
  }
}

async function main() {
  console.log("\n🌱 E2E Test Data Seeding\n");

  try {
    await seedFirebaseUsers();
    console.log("");
    await seedDatabase();
    console.log("");
    await verifyFirebaseLogin();
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
