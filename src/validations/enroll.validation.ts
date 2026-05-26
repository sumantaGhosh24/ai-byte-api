import { z } from "zod";

export const enrollIdSchema = z.object({
  id: z.string().min(1, { message: "Enroll id is required" }),
});

export const getEnrollsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  courseId: z.string().optional(),
  userId: z.string().optional(),
  completed: z.boolean().optional(),
});

export type GetEnrollsParams = z.infer<typeof getEnrollsQuerySchema>;

export const createEnrollSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  userId: z.string().min(1, { message: "User id is required" }),
});

export type CreateEnrollParams = z.infer<typeof createEnrollSchema>;

export const deleteEnrollSchema = z.object({
  enrollId: z.string().min(1, { message: "Enrol id is required" }),
  userId: z.string().min(1, { message: "User id is required" }),
});

export type DeleteEnrollParams = z.infer<typeof deleteEnrollSchema>;
