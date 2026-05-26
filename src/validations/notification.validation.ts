import { z } from "zod";

export const registerNotificationTokenSchema = z.object({
  userId: z.string().min(1, "User id is required"),
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["android", "ios"]),
});

export type RegisterNotificationTokenParams = z.infer<
  typeof registerNotificationTokenSchema
>;

export const notificationIdSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
});

export const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum([
    "general",
    "reminder",
    "achievement",
    "system",
    "course",
    "lesson",
    "quiz",
  ]),
  read: z.boolean().optional(),
  relatedCourseId: z.string().optional(),
  relatedLessonId: z.string().optional(),
  relatedQuizId: z.string().optional(),
});

export type CreateNotificationParams = z.infer<typeof createNotificationSchema>;

export const markNotificationReadSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
});

export const getNotificationsQuerySchema = z.object({
  userId: z.string().min(1, { message: "User id is required" }),
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
  type: z
    .enum([
      "general",
      "reminder",
      "achievement",
      "system",
      "course",
      "lesson",
      "quiz",
    ])
    .optional(),
});

export type GetNotificationsParams = z.infer<
  typeof getNotificationsQuerySchema
>;
