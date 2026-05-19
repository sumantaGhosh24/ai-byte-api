import { z } from "zod";

export const achievementIdSchema = z.object({ id: z.string().min(1) });

export const createAchievementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  badgeImage: z.string().min(1),
  badgeImagePublicId: z.string().min(1),
  xpReward: z.number().int().min(0),
  achievementType: z.enum([
    "general",
    "learning",
    "quiz",
    "course",
    "streak",
    "custom",
  ]),
});

export const updateAchievementSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  badgeImage: z.string().min(1).optional(),
  badgeImagePublicId: z.string().min(1).optional(),
  xpReward: z.number().int().min(0).optional(),
  achievementType: z
    .enum(["general", "learning", "quiz", "course", "streak", "custom"])
    .optional(),
});

export const createUserAchievementSchema = z.object({
  userId: z.string().min(1),
  achievementId: z.string().min(1),
});
