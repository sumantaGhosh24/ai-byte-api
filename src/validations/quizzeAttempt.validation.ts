import { z } from "zod";

export const quizAttemptIdSchema = z.object({ id: z.string().min(1) });

export const createQuizAttemptSchema = z.object({
  userId: z.string().min(1),
  quizId: z.string().min(1),
  score: z.number().int(),
});

export const updateQuizAttemptSchema = z.object({
  userId: z.string().min(1).optional(),
  quizId: z.string().min(1).optional(),
  score: z.number().int().optional(),
});
