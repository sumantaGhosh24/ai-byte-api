import { z } from "zod";

export const questionIdSchema = z.object({ id: z.string().min(1) });

export const createQuestionSchema = z.object({
  quizId: z.string().min(1),
  question: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().optional(),
});

export const updateQuestionSchema = z.object({
  quizId: z.string().min(1).optional(),
  question: z.string().min(1).optional(),
  optionA: z.string().min(1).optional(),
  optionB: z.string().min(1).optional(),
  optionC: z.string().min(1).optional(),
  optionD: z.string().min(1).optional(),
  correctAnswer: z.enum(["A", "B", "C", "D"]).optional(),
  explanation: z.string().optional(),
});
