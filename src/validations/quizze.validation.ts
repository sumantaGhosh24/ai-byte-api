import { z } from "zod";

export const quizIdSchema = z.object({ id: z.string().min(1) });

export const createQuizSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export const updateQuizSchema = z.object({
  courseId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});
