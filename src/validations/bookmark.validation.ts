import { z } from "zod";

export const bookmarkIdSchema = z.object({
  id: z.string().min(1, { message: "Bookmark id is required" }),
});

export const getBookmarksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  courseId: z.string().optional(),
  userId: z.string().optional(),
});

export type GetBookmarksParams = z.infer<typeof getBookmarksQuerySchema>;

export const createBookmarkSchema = z.object({
  userId: z.string().min(1, { message: "User id is required" }),
  courseId: z.string().min(1, { message: "Course id is required" }),
});

export type CreateBookmarkParams = z.infer<typeof createBookmarkSchema>;

export const deleteBookmarkSchema = z.object({
  userId: z.string().min(1, { message: "User id is required" }),
  bookmarkId: z.string().min(1, { message: "Bookmark id is required" }),
});

export type DeleteBookmarkParams = z.infer<typeof deleteBookmarkSchema>;
