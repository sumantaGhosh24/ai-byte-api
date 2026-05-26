import { z } from "zod";

export const userIdSchema = z.object({
  userId: z.string().min(1, { message: "User id is required" }),
});

export const usersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
});

export type UsersParams = z.infer<typeof usersSchema>;
