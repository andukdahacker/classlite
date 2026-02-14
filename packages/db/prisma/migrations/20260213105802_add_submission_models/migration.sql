-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "time_spent_sec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_answer" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "answer" JSONB,
    "photo_url" TEXT,
    "is_correct" BOOLEAN,
    "score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_center_id_idx" ON "submission"("center_id");

-- CreateIndex
CREATE INDEX "submission_center_id_student_id_idx" ON "submission"("center_id", "student_id");

-- CreateIndex
CREATE INDEX "submission_center_id_assignment_id_idx" ON "submission"("center_id", "assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_id_center_id_key" ON "submission"("id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_assignment_id_student_id_key" ON "submission"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "student_answer_center_id_idx" ON "student_answer"("center_id");

-- CreateIndex
CREATE INDEX "student_answer_center_id_submission_id_idx" ON "student_answer"("center_id", "submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answer_id_center_id_key" ON "student_answer"("id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answer_submission_id_question_id_key" ON "student_answer"("submission_id", "question_id");

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answer" ADD CONSTRAINT "student_answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answer" ADD CONSTRAINT "student_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
