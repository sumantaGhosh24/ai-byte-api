import { z } from "zod";

export const bookmarkSchema = z.object({
  userId: z.string().min(1),
  lessonId: z.string().min(1),
});
