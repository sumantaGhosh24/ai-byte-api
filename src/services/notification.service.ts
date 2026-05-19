import { and, eq, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { notificationTokens, notifications } from "../db/schema";

interface RegisterNotificationParams {
  userId: string;
  token: string;
  platform: "android" | "ios";
}

export const registerNotificationTokenService = async ({
  userId,
  token,
  platform,
}: RegisterNotificationParams) => {
  try {
    const [existing] = await db
      .select()
      .from(notificationTokens)
      .where(
        and(
          eq(notificationTokens.userId, userId),
          eq(notificationTokens.token, token),
          eq(notificationTokens.platform, platform)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(notificationTokens)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(notificationTokens.id, existing.id))
        .returning();
      return updated;
    } else {
      const [row] = await db
        .insert(notificationTokens)
        .values({
          userId,
          token,
          platform,
          isActive: true,
        })
        .returning();
      return row;
    }
  } catch (error) {
    logger.error("Error registering notification token", { error });

    throw error;
  }
};

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type:
    | "info"
    | "reminder"
    | "system"
    | "achievement"
    | "streak"
    | "course"
    | "lesson"
    | "quiz"
    | "custom";
  read?: boolean;
  relatedCourseId?: string;
  relatedLessonId?: string;
  relatedQuizId?: string;
}

export const createNotificationService = async ({
  userId,
  title,
  message,
  type,
  read,
  relatedCourseId,
  relatedLessonId,
  relatedQuizId,
}: CreateNotificationParams) => {
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId,
        title: title.toLowerCase(),
        message: message.toLowerCase(),
        type,
        read: read ?? false,
        relatedCourseId: relatedCourseId ?? null,
        relatedLessonId: relatedLessonId ?? null,
        relatedQuizId: relatedQuizId ?? null,
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating notification", { error });

    throw error;
  }
};

export const markNotificationReadService = async (id: string) => {
  try {
    const [row] = await db
      .update(notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    if (!row) {
      logger.error("Notification not found");

      throw new Error("Notification not found");
    }

    return row;
  } catch (error) {
    logger.error("Error marking notification as read", { error });

    throw error;
  }
};

export const markAllNotificationsReadService = async (userId: string) => {
  try {
    const updated = await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      )
      .returning();

    return updated;
  } catch (error) {
    logger.error("Error marking all notifications as read", { error });

    throw error;
  }
};

interface GetUserNotificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}

export const getUserNotificationsService = async ({
  userId,
  page = 1,
  limit = 20,
  type,
  read,
}: GetUserNotificationsParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [eq(notifications.userId, userId)];

    if (type) {
      filters.push(eq(notifications.type, type));
    }
    if (read !== undefined) {
      filters.push(eq(notifications.read, read));
    }

    const whereClause = and(...filters);

    const notifData = await db.query.notifications.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(whereClause);

    return {
      items: notifData,
      paginations: {
        page,
        limit,
        total: Number(total[0]?.count || 0),
        hasMore: offset + notifData.length < Number(total[0]?.count || 0),
      },
    };
  } catch (error) {
    logger.error("Error fetching user notifications", { error });

    throw error;
  }
};
