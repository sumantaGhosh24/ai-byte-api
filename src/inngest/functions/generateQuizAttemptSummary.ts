import { prisma } from "../../config/db";
import { generateQuizSummaryAIService } from "../../services/quizAttempt.service";
import { deleteCache } from "../../utils/cache";
import { redisKeys } from "../../utils/redisKeys";
import { inngest } from "../client";

const generateQuizAttemptSummary = inngest.createFunction(
  {
    id: "generate-quiz-attempt-summary",
    triggers: { event: "quiz-attempt/summary.requested" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { attemptId } = event.data;

    try {
      const attempt = await step.run("fetch-attempt", async () => {
        return prisma.quizAttempt.findUnique({
          where: { id: attemptId },
          include: {
            quiz: true,
            answers: {
              include: { question: true },
            },
          },
        });
      });

      if (!attempt) {
        throw new Error("NOT_FOUND");
      }

      const summary = await step.run("generate-summary", async () => {
        return generateQuizSummaryAIService({
          quizTitle: attempt.quiz.title,
          score: attempt.score,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers: attempt.wrongAnswers,
          answers: attempt.answers.map(answer => ({
            question: answer.question.question,
            correct: answer.isCorrect,
          })),
        });
      });

      await step.run("save-summary", async () => {
        await prisma.quizAttemptSummary.create({
          data: {
            quizAttemptId: attempt.id,
            strength: summary.strength,
            weaknesses: summary.weaknesses,
          },
        });

        await prisma.quizAttempt.update({
          where: { id: attempt.id },
          data: { status: "completed" },
        });
      });

      await deleteCache(redisKeys.attempt(attempt.id));

      return { success: true };
    } catch (error) {
      await step.run("mark-course-failed", async () => {
        await prisma.course.update({
          where: { id: attemptId },
          data: { status: "failed" },
        });
      });

      throw error;
    }
  }
);

export default generateQuizAttemptSummary;
