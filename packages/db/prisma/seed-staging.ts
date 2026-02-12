/**
 * Staging Environment Seed Script
 *
 * Creates demo data for the staging environment:
 * - 1 demo center
 * - 4 test users (owner, admin, teacher, student) with auth accounts
 * - 1 course with 1 class
 * - Sample exercises: 1 Reading, 1 Listening, 1 Writing, 1 Speaking
 * - Sample tags and assignments
 *
 * Idempotent — safe to run multiple times.
 *
 * Prerequisites:
 *   - DATABASE_URL pointing to staging database
 *   - Firebase users must be created manually in the staging Firebase project
 *     with matching emails. Set STAGING_FIREBASE_OWNER_UID etc. env vars to link them.
 *
 * Usage:
 *   DATABASE_URL=<staging-db-url> pnpm --filter=@workspace/db db:seed:staging
 */

import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Safety: prevent accidental seeding of production
if (
  DATABASE_URL.includes("production") ||
  DATABASE_URL.includes("prod.") ||
  process.env.NODE_ENV === "production"
) {
  console.error(
    "Refusing to seed: DATABASE_URL appears to point to production. Set STAGING_SEED_CONFIRM=yes to override.",
  );
  if (process.env.STAGING_SEED_CONFIRM !== "yes") {
    process.exit(1);
  }
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Configuration ──────────────────────────────────────────────────

const DEMO_CENTER = {
  id: "staging-demo-center",
  name: "ClassLite Demo Center",
  slug: "classlite-demo",
  brandColor: "#2563EB",
  timezone: "Asia/Ho_Chi_Minh",
};

const DEMO_USERS = [
  {
    id: "staging-owner",
    email: "owner@staging.classlite.com",
    name: "Demo Owner",
    role: "OWNER" as const,
    firebaseUidEnv: "STAGING_FIREBASE_OWNER_UID",
    firebaseUidDefault: "staging-owner-firebase",
  },
  {
    id: "staging-admin",
    email: "admin@staging.classlite.com",
    name: "Demo Admin",
    role: "ADMIN" as const,
    firebaseUidEnv: "STAGING_FIREBASE_ADMIN_UID",
    firebaseUidDefault: "staging-admin-firebase",
  },
  {
    id: "staging-teacher",
    email: "teacher@staging.classlite.com",
    name: "Demo Teacher",
    role: "TEACHER" as const,
    firebaseUidEnv: "STAGING_FIREBASE_TEACHER_UID",
    firebaseUidDefault: "staging-teacher-firebase",
  },
  {
    id: "staging-student",
    email: "student@staging.classlite.com",
    name: "Demo Student",
    role: "STUDENT" as const,
    firebaseUidEnv: "STAGING_FIREBASE_STUDENT_UID",
    firebaseUidDefault: "staging-student-firebase",
  },
];

// ─── Seed Functions ─────────────────────────────────────────────────

async function seedCenter() {
  console.log("Creating demo center...");
  await prisma.center.upsert({
    where: { id: DEMO_CENTER.id },
    update: { name: DEMO_CENTER.name, slug: DEMO_CENTER.slug },
    create: DEMO_CENTER,
  });
  console.log(`  + Center: ${DEMO_CENTER.name}`);
}

async function seedUsers() {
  console.log("Creating demo users...");
  for (const user of DEMO_USERS) {
    const firebaseUid =
      process.env[user.firebaseUidEnv] || user.firebaseUidDefault;

    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email, name: user.name },
      create: { id: user.id, email: user.email, name: user.name },
    });

    // Remove existing auth accounts for this user to handle UID changes
    await prisma.authAccount.deleteMany({
      where: { userId: user.id, provider: "FIREBASE" },
    });
    await prisma.authAccount.create({
      data: {
        userId: user.id,
        provider: "FIREBASE",
        providerUserId: firebaseUid,
        email: user.email,
      },
    });

    await prisma.centerMembership.upsert({
      where: {
        centerId_userId: {
          centerId: DEMO_CENTER.id,
          userId: user.id,
        },
      },
      update: { role: user.role, status: "ACTIVE" },
      create: {
        centerId: DEMO_CENTER.id,
        userId: user.id,
        role: user.role,
        status: "ACTIVE",
      },
    });

    console.log(`  + User: ${user.email} (${user.role})`);
  }
}

async function seedCourseAndClass() {
  console.log("Creating course and class...");

  const course = await prisma.course.upsert({
    where: {
      id_centerId: { id: "staging-course-ielts", centerId: DEMO_CENTER.id },
    },
    update: {},
    create: {
      id: "staging-course-ielts",
      name: "IELTS Preparation",
      description: "Comprehensive IELTS preparation course",
      color: "#3B82F6",
      centerId: DEMO_CENTER.id,
    },
  });
  console.log(`  + Course: ${course.name}`);

  const teacher = DEMO_USERS.find((u) => u.role === "TEACHER")!;
  const cls = await prisma.class.upsert({
    where: {
      id_centerId: { id: "staging-class-ielts-a", centerId: DEMO_CENTER.id },
    },
    update: {},
    create: {
      id: "staging-class-ielts-a",
      name: "IELTS Band 6.5 - Class A",
      courseId: course.id,
      teacherId: teacher.id,
      centerId: DEMO_CENTER.id,
    },
  });
  console.log(`  + Class: ${cls.name}`);

  // Assign student to class
  const student = DEMO_USERS.find((u) => u.role === "STUDENT")!;
  await prisma.classStudent.upsert({
    where: {
      classId_studentId: { classId: cls.id, studentId: student.id },
    },
    update: {},
    create: {
      classId: cls.id,
      studentId: student.id,
      centerId: DEMO_CENTER.id,
    },
  });
  console.log(`  + Student enrolled: ${student.name} -> ${cls.name}`);

  return { courseId: course.id, classId: cls.id };
}

async function seedExercises() {
  console.log("Creating sample exercises...");

  const teacher = DEMO_USERS.find((u) => u.role === "TEACHER")!;
  const centerId = DEMO_CENTER.id;

  // ── Reading Exercise ────────────────────────────────────────────
  const reading = await prisma.exercise.upsert({
    where: { id_centerId: { id: "staging-ex-reading", centerId } },
    update: {},
    create: {
      id: "staging-ex-reading",
      centerId,
      title: "Cambridge 18 - Test 1 Reading Passage 1",
      instructions: "Read the passage and answer questions 1-13.",
      skill: "READING",
      status: "PUBLISHED",
      passageContent:
        "Urban farming is the practice of cultivating, processing, and distributing food in or around urban areas...",
      passageFormat: "text",
      timeLimit: 1200,
      createdById: teacher.id,
    },
  });

  // Add a question section to reading exercise
  const readingSection = await prisma.questionSection.upsert({
    where: {
      id_centerId: { id: "staging-qs-reading-tfng", centerId },
    },
    update: {},
    create: {
      id: "staging-qs-reading-tfng",
      exerciseId: reading.id,
      centerId,
      sectionType: "R3_TFNG",
      instructions:
        "Do the following statements agree with the information given in the passage? Write TRUE, FALSE, or NOT GIVEN.",
      orderIndex: 0,
    },
  });

  await prisma.question.upsert({
    where: { id_centerId: { id: "staging-q-reading-1", centerId } },
    update: {},
    create: {
      id: "staging-q-reading-1",
      sectionId: readingSection.id,
      centerId,
      questionText: "Urban farming has been practiced for centuries.",
      questionType: "R3_TFNG",
      correctAnswer: { value: "TRUE" },
      orderIndex: 0,
    },
  });

  console.log(`  + Reading: ${reading.title}`);

  // ── Listening Exercise ──────────────────────────────────────────
  const listening = await prisma.exercise.upsert({
    where: { id_centerId: { id: "staging-ex-listening", centerId } },
    update: {},
    create: {
      id: "staging-ex-listening",
      centerId,
      title: "IELTS Listening - Section 1 Practice",
      instructions: "Listen to the recording and complete the form below.",
      skill: "LISTENING",
      status: "PUBLISHED",
      audioUrl: "https://example.com/staging-audio-placeholder.mp3",
      audioDuration: 300,
      playbackMode: "single",
      timeLimit: 600,
      createdById: teacher.id,
    },
  });

  const listeningSection = await prisma.questionSection.upsert({
    where: {
      id_centerId: { id: "staging-qs-listening-form", centerId },
    },
    update: {},
    create: {
      id: "staging-qs-listening-form",
      exerciseId: listening.id,
      centerId,
      sectionType: "L1_FORM_NOTE_TABLE",
      instructions: "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.",
      orderIndex: 0,
      audioSectionIndex: 0,
    },
  });

  await prisma.question.upsert({
    where: { id_centerId: { id: "staging-q-listening-1", centerId } },
    update: {},
    create: {
      id: "staging-q-listening-1",
      sectionId: listeningSection.id,
      centerId,
      questionText: "Name: John ___",
      questionType: "L1_FORM_NOTE_TABLE",
      correctAnswer: { value: "Smith" },
      orderIndex: 0,
      wordLimit: 2,
    },
  });

  console.log(`  + Listening: ${listening.title}`);

  // ── Writing Exercise ────────────────────────────────────────────
  const writing = await prisma.exercise.upsert({
    where: { id_centerId: { id: "staging-ex-writing", centerId } },
    update: {},
    create: {
      id: "staging-ex-writing",
      centerId,
      title: "IELTS Writing Task 2 - Technology Essay",
      instructions: "Write an essay of at least 250 words.",
      skill: "WRITING",
      status: "PUBLISHED",
      writingPrompt:
        "Some people believe that technology has made our lives more complex. To what extent do you agree or disagree?",
      wordCountMin: 250,
      wordCountMax: 350,
      wordCountMode: "hard",
      timeLimit: 2400,
      createdById: teacher.id,
    },
  });

  const writingSection = await prisma.questionSection.upsert({
    where: {
      id_centerId: { id: "staging-qs-writing-essay", centerId },
    },
    update: {},
    create: {
      id: "staging-qs-writing-essay",
      exerciseId: writing.id,
      centerId,
      sectionType: "W3_TASK2_ESSAY",
      instructions: "Write at least 250 words.",
      orderIndex: 0,
    },
  });

  await prisma.question.upsert({
    where: { id_centerId: { id: "staging-q-writing-1", centerId } },
    update: {},
    create: {
      id: "staging-q-writing-1",
      sectionId: writingSection.id,
      centerId,
      questionText:
        "Some people believe that technology has made our lives more complex. To what extent do you agree or disagree?",
      questionType: "W3_TASK2_ESSAY",
      orderIndex: 0,
    },
  });

  console.log(`  + Writing: ${writing.title}`);

  // ── Speaking Exercise ───────────────────────────────────────────
  const speaking = await prisma.exercise.upsert({
    where: { id_centerId: { id: "staging-ex-speaking", centerId } },
    update: {},
    create: {
      id: "staging-ex-speaking",
      centerId,
      title: "IELTS Speaking Part 2 - Describe a Place",
      instructions: "You will have 1 minute to prepare and 2 minutes to speak.",
      skill: "SPEAKING",
      status: "PUBLISHED",
      speakingPrepTime: 60,
      speakingTime: 120,
      maxRecordingDuration: 150,
      createdById: teacher.id,
    },
  });

  const speakingSection = await prisma.questionSection.upsert({
    where: {
      id_centerId: { id: "staging-qs-speaking-cue", centerId },
    },
    update: {},
    create: {
      id: "staging-qs-speaking-cue",
      exerciseId: speaking.id,
      centerId,
      sectionType: "S2_PART2_CUE_CARD",
      instructions: "Describe a place you have visited that you found interesting.",
      orderIndex: 0,
    },
  });

  await prisma.question.upsert({
    where: { id_centerId: { id: "staging-q-speaking-1", centerId } },
    update: {},
    create: {
      id: "staging-q-speaking-1",
      sectionId: speakingSection.id,
      centerId,
      questionText:
        "Describe a place you have visited that you found interesting. You should say: where it is, when you visited, what you did there, and explain why you found it interesting.",
      questionType: "S2_PART2_CUE_CARD",
      orderIndex: 0,
    },
  });

  console.log(`  + Speaking: ${speaking.title}`);

  return [reading, listening, writing, speaking];
}

async function seedTags(exerciseIds: { id: string }[]) {
  console.log("Creating tags and assignments...");

  const centerId = DEMO_CENTER.id;
  const tagNames = ["IELTS", "Band 6.5", "Academic", "Practice"];

  for (const name of tagNames) {
    const tag = await prisma.exerciseTag.upsert({
      where: { centerId_name: { centerId, name } },
      update: {},
      create: { centerId, name },
    });

    // Assign tag to all exercises
    for (const exercise of exerciseIds) {
      const existing = await prisma.exerciseTagAssignment.findFirst({
        where: { exerciseId: exercise.id, tagId: tag.id },
      });
      if (!existing) {
        await prisma.exerciseTagAssignment.create({
          data: { exerciseId: exercise.id, tagId: tag.id, centerId },
        });
      }
    }

    console.log(`  + Tag: ${name} (assigned to ${exerciseIds.length} exercises)`);
  }
}

async function seedAssignment(classId: string) {
  console.log("Creating sample assignment...");

  const teacher = DEMO_USERS.find((u) => u.role === "TEACHER")!;
  const student = DEMO_USERS.find((u) => u.role === "STUDENT")!;
  const centerId = DEMO_CENTER.id;

  const assignment = await prisma.assignment.upsert({
    where: { id_centerId: { id: "staging-assignment-1", centerId } },
    update: {},
    create: {
      id: "staging-assignment-1",
      centerId,
      exerciseId: "staging-ex-reading",
      classId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      timeLimit: 1200,
      instructions: "Complete this reading exercise before the deadline.",
      status: "OPEN",
      createdById: teacher.id,
    },
  });
  console.log(`  + Assignment: Reading exercise -> class`);

  // Assign to student
  const existing = await prisma.assignmentStudent.findFirst({
    where: { assignmentId: assignment.id, studentId: student.id },
  });
  if (!existing) {
    await prisma.assignmentStudent.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        centerId,
      },
    });
  }
  console.log(`  + Student assigned: ${student.name}`);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("\nStaging Environment Seed\n");

  try {
    await seedCenter();
    await seedUsers();
    const { classId } = await seedCourseAndClass();
    const exercises = await seedExercises();
    await seedTags(exercises);
    await seedAssignment(classId);

    console.log("\nStaging seed complete.");
  } catch (error) {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
