import { z } from "zod";

export const progressIdSchema = z.object({
  id: z.string().min(1, { message: "Progress id is required" }),
});

export const getProgressesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  lessonId: z.string().optional(),
  userId: z.string().optional(),
  completed: z.boolean().optional(),
});

export type GetProgressesParams = z.infer<typeof getProgressesQuerySchema>;

export const getProgressSchema = z.object({
  userId: z.string().min(1),
  lessonId: z.string().min(1),
});

export type GetProgressParams = z.infer<typeof getProgressSchema>;

export const updateProgressSchema = z.object({
  userId: z.string().min(1),
  lessonId: z.string().min(1),
  completed: z.boolean().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});

export type UpdateProgressParams = z.infer<typeof updateProgressSchema>;
