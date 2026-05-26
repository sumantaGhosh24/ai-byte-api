import { z } from "zod";

export const getReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  courseId: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
});

export type GetReviewsParams = z.infer<typeof getReviewsQuerySchema>;

export const createReviewSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  userId: z.string().min(1, { message: "User id is required" }),
  rating: z.coerce.number().min(1).max(5).optional(),
  message: z.string().min(1, { message: "Message is required" }),
});

export type CreateReviewParams = z.infer<typeof createReviewSchema>;

export const deleteReviewSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  reviewId: z.string().min(1, { message: "Review id is required" }),
  userId: z.string().min(1, { message: "User id is required" }),
});

export type DeleteReviewParams = z.infer<typeof deleteReviewSchema>;
