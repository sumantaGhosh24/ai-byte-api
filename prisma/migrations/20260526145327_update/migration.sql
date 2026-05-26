/*
  Warnings:

  - You are about to drop the column `percentage` on the `QuizAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `QuizAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `QuizAttemptSummary` table. All the data in the column will be lost.
  - Added the required column `status` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wrongAnswers` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "QuizAttempt_percentage_idx";

-- AlterTable
ALTER TABLE "QuizAttempt" DROP COLUMN "percentage",
DROP COLUMN "totalQuestions",
ADD COLUMN     "status" "Status" NOT NULL,
ADD COLUMN     "wrongAnswers" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "QuizAttemptSummary" DROP COLUMN "status";

-- DropEnum
DROP TYPE "QuizAttemptStatus";
