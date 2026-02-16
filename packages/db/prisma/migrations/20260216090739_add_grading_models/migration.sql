-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'AI_PROCESSING';

-- CreateTable
CREATE TABLE "grading_job" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "error_category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_feedback" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION,
    "criteria_scores" JSONB,
    "general_feedback" TEXT,
    "teacher_final_score" DOUBLE PRECISION,
    "teacher_criteria_scores" JSONB,
    "teacher_general_feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedback_item" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "submission_feedback_id" TEXT NOT NULL,
    "question_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "original_context_snippet" TEXT,
    "suggested_fix" TEXT,
    "severity" TEXT,
    "confidence" DOUBLE PRECISION,
    "is_approved" BOOLEAN,
    "approved_at" TIMESTAMP(3),
    "teacher_override_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grading_job_submission_id_key" ON "grading_job"("submission_id");

-- CreateIndex
CREATE INDEX "grading_job_center_id_idx" ON "grading_job"("center_id");

-- CreateIndex
CREATE INDEX "grading_job_submission_id_idx" ON "grading_job"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_feedback_submission_id_key" ON "submission_feedback"("submission_id");

-- CreateIndex
CREATE INDEX "submission_feedback_center_id_idx" ON "submission_feedback"("center_id");

-- CreateIndex
CREATE INDEX "ai_feedback_item_center_id_idx" ON "ai_feedback_item"("center_id");

-- CreateIndex
CREATE INDEX "ai_feedback_item_submission_feedback_id_idx" ON "ai_feedback_item"("submission_feedback_id");

-- AddForeignKey
ALTER TABLE "grading_job" ADD CONSTRAINT "grading_job_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_feedback" ADD CONSTRAINT "submission_feedback_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback_item" ADD CONSTRAINT "ai_feedback_item_submission_feedback_id_fkey" FOREIGN KEY ("submission_feedback_id") REFERENCES "submission_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
