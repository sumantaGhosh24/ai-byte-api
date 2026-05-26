import { z } from "zod";

export const updateProfileSchema = z.object({
  userId: z.uuid().min(1, { message: "User id is required" }),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be at most 50 characters" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be at most 30 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers and underscores",
    }),
  bio: z
    .string()
    .max(300, { message: "Bio must be at most 300 characters" })
    .optional(),
  avatarUrl: z.string().optional(),
  avatarPublicId: z.string().optional(),
});

export type UpdateProfileParams = z.infer<typeof updateProfileSchema>;

export const updateProfilePreferencesSchema = z.object({
  userId: z.uuid().min(1, { message: "User id is required" }),
  interests: z
    .array(z.enum(["ai", "python", "javascript", "typescript"]))
    .max(10, {
      message: "You can select at most 10 interests",
    }),
  goals: z
    .array(
      z.enum([
        "complete_course",
        "practice_daily",
        "achieve_streak",
        "finish_lesson",
      ])
    )
    .max(10, {
      message: "You can select at most 10 goals",
    }),
  dailyReminderTime: z.enum(["morning", "afternoon", "evening", "night"]),
  dailyReminderEnabled: z.boolean(),
  streakReminderEnabled: z.boolean(),
  lessonReminderEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
});

export type UpdateProfilePreferencesParams = z.infer<
  typeof updateProfilePreferencesSchema
>;
