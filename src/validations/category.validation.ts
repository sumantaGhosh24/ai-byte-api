import { z } from "zod";

export const categoryIdSchema = z.object({ id: z.string().min(1) });

export const createCategorySchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
});
