import { z } from "zod";

export const answerSubmissionIdSchema = z.object({ id: z.string().min(1) });

export const createAnswerSubmissionSchema = z.object({
  quizAttemptId: z.string().min(1),
  userAnswer: z.string().min(1),
});
