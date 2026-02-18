-- CreateEnum
CREATE TYPE "StudentFlagStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "student_flag" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" "StudentFlagStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_by_id" TEXT,
    "resolved_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "student_flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_flag_center_id_idx" ON "student_flag"("center_id");

-- CreateIndex
CREATE INDEX "student_flag_student_id_idx" ON "student_flag"("student_id");

-- CreateIndex
CREATE INDEX "student_flag_student_id_status_idx" ON "student_flag"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_flag_id_center_id_key" ON "student_flag"("id", "center_id");

-- AddForeignKey
ALTER TABLE "student_flag" ADD CONSTRAINT "student_flag_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_flag" ADD CONSTRAINT "student_flag_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_flag" ADD CONSTRAINT "student_flag_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
