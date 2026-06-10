import { logger } from "@sentry/node";

import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/client";
import {
  GetNotificationsParams,
  RegisterNotificationTokenParams,
} from "../validations/notification.validation";

export const registerNotificationTokenService = async ({
  userId,
  token,
  platform,
}: RegisterNotificationTokenParams) => {
  try {
    await prisma.notificationToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      update: {
        token,
        isActive: true,
        platform,
      },
      create: {
        userId,
        token,
        platform,
      },
    });
  } catch (error) {
    logger.error("Error register notification token", { error });

    throw error;
  }
};

export async function deactivateNotificationToken(token: string) {
  try {
    return prisma.notificationToken.updateMany({
      where: {
        token,
      },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    logger.error("Error deactivate notification token", { error });

    throw error;
  }
}

export const getUserNotificationsService = async ({
  userId,
  page = 1,
  limit = 20,
  type,
}: GetNotificationsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(type && { type }),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where,
      }),

      prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),
    ]);

    return {
      items,
      unreadCount,
      paginations: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
        nextPage: skip + items.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error get user notifications", { error });

    throw error;
  }
};

export const markNotificationReadService = async (
  id: string,
  userId: string
) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error("NOT_FOUND");
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  } catch (error) {
    logger.error("Error marking notification read", { error });

    throw error;
  }
};

export const markAllNotificationsReadService = async (userId: string) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    return { updatedCount: result.count };
  } catch (error) {
    logger.error("Error marking all notifications as read", { error });

    throw error;
  }
};
