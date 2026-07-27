-- DropIndex
DROP INDEX "submissions_exam_id_student_id_key";

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "attempt_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "auto_score" DOUBLE PRECISION,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "manual_score" DOUBLE PRECISION,
ADD COLUMN     "shuffle_config" JSONB,
ADD COLUMN     "started_at" TIMESTAMP(3),
ALTER COLUMN "answers" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS',
ALTER COLUMN "submitted_at" DROP NOT NULL,
ALTER COLUMN "submitted_at" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "submissions_exam_id_student_id_attempt_number_key" ON "submissions"("exam_id", "student_id", "attempt_number");
