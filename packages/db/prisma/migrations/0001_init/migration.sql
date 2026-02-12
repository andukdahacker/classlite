Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('FIREBASE');

-- CreateEnum
CREATE TYPE "CenterRole" AS ENUM ('OWNER', 'ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "CsvImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "CsvImportRowStatus" AS ENUM ('VALID', 'DUPLICATE_IN_CSV', 'DUPLICATE_IN_CENTER', 'ERROR', 'IMPORTED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExerciseSkill" AS ENUM ('READING', 'LISTENING', 'WRITING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IeltsQuestionType" AS ENUM ('R1_MCQ_SINGLE', 'R2_MCQ_MULTI', 'R3_TFNG', 'R4_YNNG', 'R5_SENTENCE_COMPLETION', 'R6_SHORT_ANSWER', 'R7_SUMMARY_WORD_BANK', 'R8_SUMMARY_PASSAGE', 'R9_MATCHING_HEADINGS', 'R10_MATCHING_INFORMATION', 'R11_MATCHING_FEATURES', 'R12_MATCHING_SENTENCE_ENDINGS', 'R13_NOTE_TABLE_FLOWCHART', 'R14_DIAGRAM_LABELLING', 'L1_FORM_NOTE_TABLE', 'L2_MCQ', 'L3_MATCHING', 'L4_MAP_PLAN_LABELLING', 'L5_SENTENCE_COMPLETION', 'L6_SHORT_ANSWER', 'W1_TASK1_ACADEMIC', 'W2_TASK1_GENERAL', 'W3_TASK2_ESSAY', 'S1_PART1_QA', 'S2_PART2_CUE_CARD', 'S3_PART3_DISCUSSION');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "phone_number" TEXT,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "deletion_requested_at" TIMESTAMP(3),
    "email_schedule_notifications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "brand_color" TEXT NOT NULL DEFAULT '#2563EB',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_membership" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CenterRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "center_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role" "CenterRole" NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role","permission_id")
);

-- CreateTable
CREATE TABLE "membership_permission" (
    "id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,

    CONSTRAINT "membership_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "default_room_name" TEXT,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_student" (
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,

    CONSTRAINT "class_student_pkey" PRIMARY KEY ("class_id","student_id")
);

-- CreateTable
CREATE TABLE "class_schedule" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room_name" TEXT,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_session" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "room_name" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "marked_by" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_attempt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csv_import_logs" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "imported_by_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "valid_rows" INTEGER NOT NULL,
    "duplicate_rows" INTEGER NOT NULL,
    "error_rows" INTEGER NOT NULL,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "status" "CsvImportStatus" NOT NULL DEFAULT 'PENDING',
    "job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "csv_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csv_import_row_logs" (
    "id" TEXT NOT NULL,
    "import_log_id" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "CsvImportRowStatus" NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "csv_import_row_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "skill" "ExerciseSkill" NOT NULL,
    "status" "ExerciseStatus" NOT NULL DEFAULT 'DRAFT',
    "passage_content" TEXT,
    "passage_format" TEXT,
    "passage_source_type" TEXT,
    "passage_source_url" TEXT,
    "case_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "partial_credit" BOOLEAN NOT NULL DEFAULT false,
    "audio_url" TEXT,
    "audio_duration" INTEGER,
    "playback_mode" TEXT,
    "audio_sections" JSONB,
    "show_transcript_after_submit" BOOLEAN NOT NULL DEFAULT false,
    "stimulus_image_url" TEXT,
    "writing_prompt" TEXT,
    "letter_tone" TEXT,
    "word_count_min" INTEGER,
    "word_count_max" INTEGER,
    "word_count_mode" TEXT,
    "sample_response" TEXT,
    "show_sample_after_grading" BOOLEAN NOT NULL DEFAULT false,
    "speaking_prep_time" INTEGER,
    "speaking_time" INTEGER,
    "max_recording_duration" INTEGER,
    "enable_transcription" BOOLEAN NOT NULL DEFAULT false,
    "time_limit" INTEGER,
    "timer_position" TEXT,
    "warning_alerts" JSONB,
    "auto_submit_on_expiry" BOOLEAN NOT NULL DEFAULT true,
    "grace_period_seconds" INTEGER,
    "enable_pause" BOOLEAN NOT NULL DEFAULT false,
    "band_level" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_tag" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_tag_assignment" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_tag_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_section" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "section_type" "IeltsQuestionType" NOT NULL,
    "instructions" TEXT,
    "order_index" INTEGER NOT NULL,
    "audio_section_index" INTEGER,
    "section_time_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB,
    "order_index" INTEGER NOT NULL,
    "word_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_job" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "question_types" JSONB NOT NULL,
    "difficulty" TEXT,
    "error" TEXT,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_generation_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "test_type" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_section" (
    "id" TEXT NOT NULL,
    "mock_test_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "time_limit" INTEGER,

    CONSTRAINT "mock_test_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_section_exercise" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "mock_test_section_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "class_id" TEXT,
    "due_date" TIMESTAMP(3),
    "time_limit" INTEGER,
    "instructions" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'OPEN',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_student" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_provider_provider_user_id_key" ON "auth_account"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_provider_email_key" ON "auth_account"("provider", "email");

-- CreateIndex
CREATE UNIQUE INDEX "center_slug_key" ON "center"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "center_membership_center_id_user_id_key" ON "center_membership"("center_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "center_membership_id_center_id_key" ON "center_membership"("id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "membership_permission_membership_id_permission_id_key" ON "membership_permission"("membership_id", "permission_id");

-- CreateIndex
CREATE INDEX "course_center_id_idx" ON "course"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_id_center_id_key" ON "course"("id", "center_id");

-- CreateIndex
CREATE INDEX "class_center_id_idx" ON "class"("center_id");

-- CreateIndex
CREATE INDEX "class_course_id_idx" ON "class"("course_id");

-- CreateIndex
CREATE INDEX "class_teacher_id_idx" ON "class"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_id_center_id_key" ON "class"("id", "center_id");

-- CreateIndex
CREATE INDEX "class_student_center_id_idx" ON "class_student"("center_id");

-- CreateIndex
CREATE INDEX "class_schedule_center_id_idx" ON "class_schedule"("center_id");

-- CreateIndex
CREATE INDEX "class_schedule_class_id_idx" ON "class_schedule"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_schedule_id_center_id_key" ON "class_schedule"("id", "center_id");

-- CreateIndex
CREATE INDEX "class_session_center_id_idx" ON "class_session"("center_id");

-- CreateIndex
CREATE INDEX "class_session_class_id_idx" ON "class_session"("class_id");

-- CreateIndex
CREATE INDEX "class_session_schedule_id_idx" ON "class_session"("schedule_id");

-- CreateIndex
CREATE INDEX "class_session_start_time_end_time_idx" ON "class_session"("start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "class_session_id_center_id_key" ON "class_session"("id", "center_id");

-- CreateIndex
CREATE INDEX "attendance_student_id_center_id_idx" ON "attendance"("student_id", "center_id");

-- CreateIndex
CREATE INDEX "attendance_session_id_idx" ON "attendance"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_session_id_student_id_key" ON "attendance"("session_id", "student_id");

-- CreateIndex
CREATE INDEX "room_center_id_idx" ON "room"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_name_center_id_key" ON "room"("name", "center_id");

-- CreateIndex
CREATE INDEX "notification_center_id_idx" ON "notification"("center_id");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- CreateIndex
CREATE INDEX "notification_user_id_read_idx" ON "notification"("user_id", "read");

-- CreateIndex
CREATE UNIQUE INDEX "login_attempt_email_key" ON "login_attempt"("email");

-- CreateIndex
CREATE INDEX "csv_import_logs_center_id_idx" ON "csv_import_logs"("center_id");

-- CreateIndex
CREATE INDEX "csv_import_logs_status_idx" ON "csv_import_logs"("status");

-- CreateIndex
CREATE INDEX "csv_import_row_logs_import_log_id_idx" ON "csv_import_row_logs"("import_log_id");

-- CreateIndex
CREATE INDEX "exercise_center_id_idx" ON "exercise"("center_id");

-- CreateIndex
CREATE INDEX "exercise_center_id_skill_idx" ON "exercise"("center_id", "skill");

-- CreateIndex
CREATE INDEX "exercise_center_id_status_idx" ON "exercise"("center_id", "status");

-- CreateIndex
CREATE INDEX "exercise_center_id_band_level_idx" ON "exercise"("center_id", "band_level");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_id_center_id_key" ON "exercise"("id", "center_id");

-- CreateIndex
CREATE INDEX "exercise_tag_center_id_idx" ON "exercise_tag"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_tag_center_id_name_key" ON "exercise_tag"("center_id", "name");

-- CreateIndex
CREATE INDEX "exercise_tag_assignment_exercise_id_idx" ON "exercise_tag_assignment"("exercise_id");

-- CreateIndex
CREATE INDEX "exercise_tag_assignment_tag_id_idx" ON "exercise_tag_assignment"("tag_id");

-- CreateIndex
CREATE INDEX "exercise_tag_assignment_center_id_idx" ON "exercise_tag_assignment"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_tag_assignment_exercise_id_tag_id_key" ON "exercise_tag_assignment"("exercise_id", "tag_id");

-- CreateIndex
CREATE INDEX "question_section_center_id_idx" ON "question_section"("center_id");

-- CreateIndex
CREATE INDEX "question_section_exercise_id_idx" ON "question_section"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_section_id_center_id_key" ON "question_section"("id", "center_id");

-- CreateIndex
CREATE INDEX "question_center_id_idx" ON "question"("center_id");

-- CreateIndex
CREATE INDEX "question_section_id_idx" ON "question"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_id_center_id_key" ON "question"("id", "center_id");

-- CreateIndex
CREATE INDEX "ai_generation_job_center_id_idx" ON "ai_generation_job"("center_id");

-- CreateIndex
CREATE INDEX "ai_generation_job_exercise_id_idx" ON "ai_generation_job"("exercise_id");

-- CreateIndex
CREATE INDEX "mock_test_center_id_idx" ON "mock_test"("center_id");

-- CreateIndex
CREATE INDEX "mock_test_center_id_status_idx" ON "mock_test"("center_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_id_center_id_key" ON "mock_test"("id", "center_id");

-- CreateIndex
CREATE INDEX "mock_test_section_center_id_idx" ON "mock_test_section"("center_id");

-- CreateIndex
CREATE INDEX "mock_test_section_mock_test_id_idx" ON "mock_test_section"("mock_test_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_section_id_center_id_key" ON "mock_test_section"("id", "center_id");

-- CreateIndex
CREATE INDEX "mock_test_section_exercise_center_id_idx" ON "mock_test_section_exercise"("center_id");

-- CreateIndex
CREATE INDEX "mock_test_section_exercise_section_id_idx" ON "mock_test_section_exercise"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_section_exercise_id_center_id_key" ON "mock_test_section_exercise"("id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_section_exercise_section_id_exercise_id_key" ON "mock_test_section_exercise"("section_id", "exercise_id");

-- CreateIndex
CREATE INDEX "assignment_center_id_idx" ON "assignment"("center_id");

-- CreateIndex
CREATE INDEX "assignment_center_id_exercise_id_idx" ON "assignment"("center_id", "exercise_id");

-- CreateIndex
CREATE INDEX "assignment_center_id_class_id_idx" ON "assignment"("center_id", "class_id");

-- CreateIndex
CREATE INDEX "assignment_center_id_status_idx" ON "assignment"("center_id", "status");

-- CreateIndex
CREATE INDEX "assignment_center_id_due_date_idx" ON "assignment"("center_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_id_center_id_key" ON "assignment"("id", "center_id");

-- CreateIndex
CREATE INDEX "assignment_student_center_id_idx" ON "assignment_student"("center_id");

-- CreateIndex
CREATE INDEX "assignment_student_student_id_center_id_idx" ON "assignment_student"("student_id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_student_assignment_id_student_id_key" ON "assignment_student"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "email_log_center_id_idx" ON "email_log"("center_id");

-- CreateIndex
CREATE INDEX "email_log_recipient_id_idx" ON "email_log"("recipient_id");

-- CreateIndex
CREATE INDEX "email_log_type_sent_at_idx" ON "email_log"("type", "sent_at");

-- AddForeignKey
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_membership" ADD CONSTRAINT "center_membership_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_membership" ADD CONSTRAINT "center_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_permission" ADD CONSTRAINT "membership_permission_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "center_membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_permission" ADD CONSTRAINT "membership_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_student" ADD CONSTRAINT "class_student_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_student" ADD CONSTRAINT "class_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "class_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "class_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csv_import_logs" ADD CONSTRAINT "csv_import_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csv_import_logs" ADD CONSTRAINT "csv_import_logs_imported_by_id_fkey" FOREIGN KEY ("imported_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csv_import_row_logs" ADD CONSTRAINT "csv_import_row_logs_import_log_id_fkey" FOREIGN KEY ("import_log_id") REFERENCES "csv_import_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_tag_assignment" ADD CONSTRAINT "exercise_tag_assignment_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_tag_assignment" ADD CONSTRAINT "exercise_tag_assignment_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "exercise_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_section" ADD CONSTRAINT "question_section_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "question_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_job" ADD CONSTRAINT "ai_generation_job_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test" ADD CONSTRAINT "mock_test_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_section" ADD CONSTRAINT "mock_test_section_mock_test_id_fkey" FOREIGN KEY ("mock_test_id") REFERENCES "mock_test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_section_exercise" ADD CONSTRAINT "mock_test_section_exercise_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "mock_test_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_section_exercise" ADD CONSTRAINT "mock_test_section_exercise_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_student" ADD CONSTRAINT "assignment_student_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_student" ADD CONSTRAINT "assignment_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

