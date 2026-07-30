-- CreateEnum
CREATE TYPE "RetakeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "exam_retake_requests" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "RetakeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "review_note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_retake_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exam_retake_requests" ADD CONSTRAINT "exam_retake_requests_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_retake_requests" ADD CONSTRAINT "exam_retake_requests_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_retake_requests" ADD CONSTRAINT "exam_retake_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_retake_requests" ADD CONSTRAINT "exam_retake_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
