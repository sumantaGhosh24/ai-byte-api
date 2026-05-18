import { z } from "zod";

export const lessonIdSchema = z.object({ id: z.string().min(1) });

export const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  videoUrl: z.string().optional(),
  videoPublicId: z.string().optional(),
  duration: z.string().min(1),
  visibility: z.enum(["public", "private"]),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  xpReward: z.number().int().min(0),
  orderIndex: z.number().int().min(0),
});

export const updateLessonSchema = z.object({
  courseId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  videoUrl: z.string().optional(),
  videoPublicId: z.string().optional(),
  duration: z.string().min(1).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  xpReward: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
});
