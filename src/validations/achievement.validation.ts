import { z } from "zod";

export const achievementIdSchema = z.object({
  id: z.string().min(1, "Achievement ID is required"),
});

export const userIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const getAchievementsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  achievementType: z
    .enum([
      "course_completion",
      "streak",
      "quiz_master",
      "first_login",
      "milestone",
    ])
    .optional(),
  achievementRarity: z.enum(["common", "rare", "epic", "legendary"]).optional(),
});

export type GetAchievementsParams = z.infer<typeof getAchievementsQuerySchema>;

export const createAchievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  badgeImage: z.string().min(1, "Badge image URL is required"),
  badgeImagePublicId: z.string().min(1, "Badge image public ID is required"),
  achievementType: z.enum([
    "course_completion",
    "streak",
    "quiz_master",
    "first_login",
    "milestone",
  ]),
  achievementRarity: z.enum(["common", "rare", "epic", "legendary"]),
});

export type CreateAchievementParams = z.infer<typeof createAchievementSchema>;

export const updateAchievementSchema = z.object({
  achievementId: z.string().min(1, "Achievement ID is required"),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  badgeImage: z.string().min(1).optional(),
  badgeImagePublicId: z.string().min(1).optional(),
  achievementType: z
    .enum([
      "course_completion",
      "streak",
      "quiz_master",
      "first_login",
      "milestone",
    ])
    .optional(),
  achievementRarity: z.enum(["common", "rare", "epic", "legendary"]).optional(),
});

export type UpdateAchievementParams = z.infer<typeof updateAchievementSchema>;

export const createUserAchievementSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  achievementId: z.string().min(1, "Achievement ID is required"),
});

export type CreateUserAchievementParams = z.infer<
  typeof createUserAchievementSchema
>;

export const userAchievementSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  achievementId: z.string().min(1, "Achievement ID is required"),
});

export type UserAchievementParams = z.infer<typeof userAchievementSchema>;
