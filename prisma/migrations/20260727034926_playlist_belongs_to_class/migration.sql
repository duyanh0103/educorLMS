/*
  Warnings:

  - You are about to drop the column `course_id` on the `playlists` table. All the data in the column will be lost.
  - Added the required column `class_id` to the `playlists` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "playlists" DROP CONSTRAINT "playlists_course_id_fkey";

-- AlterTable
ALTER TABLE "playlists" DROP COLUMN "course_id",
ADD COLUMN     "class_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
