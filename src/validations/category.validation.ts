import { z } from "zod";

export const categoryIdSchema = z.object({ id: z.string().min(1) });

export const createCategorySchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string(),
  imagePublicId: z.string(),
  visibility: z.enum(["private", "public"]),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  visibility: z.enum(["private", "public"]).optional(),
});
