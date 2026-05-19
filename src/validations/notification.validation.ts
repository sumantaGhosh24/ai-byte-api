import { z } from "zod";

export const addNotificationTokenSchema = z.object({
  userId: z.string(),
  token: z.string().min(1),
  platform: z.enum(["android", "ios"]),
});

export const notificationIdSchema = z.object({
  id: z.string(),
});

export const createNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum([
    "info",
    "reminder",
    "system",
    "achievement",
    "streak",
    "course",
    "lesson",
    "quiz",
    "custom",
  ]),
  read: z.boolean().optional(),
  relatedCourseId: z.string().optional(),
  relatedLessonId: z.string().optional(),
  relatedQuizId: z.string().optional(),
});

export const markNotificationReadSchema = z.object({
  id: z.string(),
  read: z.literal(true),
});

export const markAllNotificationsReadSchema = z.object({
  userId: z.string(),
});
