import { z } from "zod";

export const updateProgressSchema = z.object({
  userId: z.string().min(1),
  lessonId: z.string().min(1),
  watchPercentage: z.number().int().min(0).max(100).optional(),
  completed: z.boolean().optional(),
  lastTimestamp: z.string().optional(),
});
