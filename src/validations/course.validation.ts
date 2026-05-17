import { z } from "zod";

export const courseIdSchema = z.object({ id: z.string().min(1) });

export const createCourseSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.string().min(1),
  visibility: z.enum(["public", "private"]),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  xpReward: z.number().int().min(0),
});

export const updateCourseSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.string().min(1).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  xpReward: z.number().int().min(0).optional(),
});
