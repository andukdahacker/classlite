-- CreateTable
CREATE TABLE "teacher_comment" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "original_context_snippet" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'student_facing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_comment_center_id_idx" ON "teacher_comment"("center_id");

-- CreateIndex
CREATE INDEX "teacher_comment_submission_id_idx" ON "teacher_comment"("submission_id");

-- AddForeignKey
ALTER TABLE "teacher_comment" ADD CONSTRAINT "teacher_comment_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_comment" ADD CONSTRAINT "teacher_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
