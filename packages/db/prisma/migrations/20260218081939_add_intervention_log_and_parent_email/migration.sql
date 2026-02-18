-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "parent_email" TEXT;

-- CreateTable
CREATE TABLE "intervention_log" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "template_used" TEXT NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intervention_log_center_id_idx" ON "intervention_log"("center_id");

-- CreateIndex
CREATE INDEX "intervention_log_student_id_idx" ON "intervention_log"("student_id");

-- CreateIndex
CREATE INDEX "intervention_log_student_id_sent_at_idx" ON "intervention_log"("student_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "intervention_log_id_center_id_key" ON "intervention_log"("id", "center_id");

-- AddForeignKey
ALTER TABLE "intervention_log" ADD CONSTRAINT "intervention_log_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_log" ADD CONSTRAINT "intervention_log_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
