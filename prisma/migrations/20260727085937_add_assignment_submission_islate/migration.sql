-- AlterTable
ALTER TABLE "assignment_submissions" ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "is_late" BOOLEAN NOT NULL DEFAULT false;
