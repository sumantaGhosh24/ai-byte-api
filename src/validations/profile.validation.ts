import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  avatarPublicId: z.string().optional(),
  interests: z.string().optional(),
  goals: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const updatePreferencesSchema = z.object({
  learningPreference: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional(),
  videoPreference: z.enum(["short", "medium", "long"]).optional(),
  dailyReminderEnabled: z.boolean().optional(),
  dailyReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)")
    .optional(),
  streakReminderEnabled: z.boolean().optional(),
  lessonReminderEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});
