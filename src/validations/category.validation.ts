import { z } from "zod";

export const categoryIdSchema = z.object({
  id: z.string().min(1, { message: "Category id is required" }),
});

export const categorieSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
});

export type CategoriesParams = z.infer<typeof categorieSchema>;

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters" })
    .max(100, { message: "Category name must be at most 100 characters" }),
  imageUrl: z.string().min(1, { message: "Image url is required" }),
  imagePublicId: z.string().min(1, { message: "Image public id is required" }),
  visibility: z.enum(["public", "private"]).default("private"),
});

export type CreateCategoryParams = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  id: z.string().min(1, { message: "Category id is required" }),
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters" })
    .max(100, { message: "Category name must be at most 100 characters" })
    .optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export type UpdateCategoryParams = z.infer<typeof updateCategorySchema>;
