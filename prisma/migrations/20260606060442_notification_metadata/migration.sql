/*
  Warnings:

  - You are about to drop the column `relatedCourseId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedLessonId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedQuizId` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "relatedCourseId",
DROP COLUMN "relatedLessonId",
DROP COLUMN "relatedQuizId",
ADD COLUMN     "metadata" JSONB;
