import { z } from "zod";

export const quizAttemptIdSchema = z.object({
  id: z.string().min(1, { message: "Quiz attempt id is required" }),
});

export const quizIdSchema = z.object({
  quizId: z.string().min(1, { message: "Quiz id is required" }),
});

export const getQuizAttemptsQuerySchema = z.object({
  page: z.coerce
    .number()
    .min(1, { message: "Page must be at least 1" })
    .default(1),
  limit: z.coerce
    .number()
    .min(1, { message: "Limit must be at least 1" })
    .max(100, { message: "Limit must not exceed 100" })
    .default(10),
  userId: z.string().optional(),
  quizId: z.string().optional(),
  search: z.string().trim().optional(),
});

export type GetQuizAttemptsParams = z.infer<typeof getQuizAttemptsQuerySchema>;

export const createQuizAttemptSchema = z.object({
  quizId: z.string().min(1, { message: "Quiz id is required" }),
  userId: z.string().min(1, { message: "User id is required" }),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1, { message: "Question id is required" }),
        selectedOptionId: z
          .string()
          .min(1, { message: "Selected option id is required" }),
      })
    )
    .min(1, { message: "At least one answer is required" }),
});

export type CreateQuizAttemptParams = z.infer<typeof createQuizAttemptSchema>;

export const quizAttemptSummaryGenerationSchema = z.object({
  strength: z.string(),
  weaknesses: z.string(),
});

export type QuizAttemptSummaryGeneration = z.infer<
  typeof quizAttemptSummaryGenerationSchema
>;

export interface GenerateAISummaryParams {
  quizTitle: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answers: {
    question: string;
    correct: boolean;
  }[];
}
