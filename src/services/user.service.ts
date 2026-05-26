/* eslint-disable indent */
import { logger } from "@sentry/node";

import { prisma } from "../config/db";
import { UsersParams } from "../validations/user.validation";

export const getUsersService = async ({
  page = 1,
  limit = 10,
  search,
}: UsersParams) => {
  try {
    const skip = (page - 1) * limit;

    const usersData = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { profile: { name: { contains: search, mode: "insensitive" } } },
              {
                profile: {
                  username: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : undefined,
      include: { profile: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const userIds = usersData.map(u => u.id);

    const [
      enrollsCount,
      progressCount,
      bookmarksCount,
      achievementsCount,
      notificationsCount,
      quizAttemptsCount,
    ] = await Promise.all([
      prisma.enroll.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),

      prisma.progress.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),

      prisma.bookmark.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),

      prisma.userAchievement.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),

      prisma.notification.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),

      prisma.quizAttempt.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),
    ]);

    const mapCount = (arr: { userId: string; _count: number }[]) =>
      Object.fromEntries(arr.map(x => [x.userId, x._count]));

    const enrollMap = mapCount(enrollsCount);
    const progressMap = mapCount(progressCount);
    const bookmarkMap = mapCount(bookmarksCount);
    const achievementMap = mapCount(achievementsCount);
    const notificationMap = mapCount(notificationsCount);
    const quizMap = mapCount(quizAttemptsCount);

    const completedProgresses = await prisma.progress.findMany({
      where: {
        userId: { in: userIds },
        completed: true,
      },
      select: {
        userId: true,
        finishedAt: true,
      },
      orderBy: { finishedAt: "desc" },
    });

    const streakMap = new Map<
      string,
      { currentStreak: number; longestStreak: number }
    >();

    for (const userId of userIds) {
      const userProgresses = completedProgresses.filter(
        p => p.userId === userId
      );

      const uniqueDays = [
        ...new Set(
          userProgresses
            .filter(p => p.finishedAt)
            .map(p => new Date(p.finishedAt!).toISOString().split("T")[0])
        ),
      ];

      let currentStreak = 0;

      if (uniqueDays.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const latestDate = new Date(uniqueDays[0] as string);
        latestDate.setHours(0, 0, 0, 0);

        const diffFromToday = Math.floor(
          (today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffFromToday === 0 || diffFromToday === 1) {
          currentStreak = 1;

          for (let i = 0; i < uniqueDays.length - 1; i++) {
            const current = new Date(uniqueDays[i] as string);
            const next = new Date(uniqueDays[i + 1] as string);

            current.setHours(0, 0, 0, 0);
            next.setHours(0, 0, 0, 0);

            const diff = Math.floor(
              (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diff === 1) currentStreak++;
            else break;
          }
        }
      }

      let longestStreak = 0;
      let temp = 0;

      for (let i = 0; i < uniqueDays.length; i++) {
        if (i === 0) {
          temp = 1;
          longestStreak = 1;
          continue;
        }

        const prev = new Date(uniqueDays[i - 1] as string);
        const curr = new Date(uniqueDays[i] as string);

        prev.setHours(0, 0, 0, 0);
        curr.setHours(0, 0, 0, 0);

        const diff = Math.floor(
          (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diff === 1) {
          temp++;
          longestStreak = Math.max(longestStreak, temp);
        } else {
          temp = 1;
        }
      }

      streakMap.set(userId, { currentStreak, longestStreak });
    }

    const items = usersData.map(user => ({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      profile: user.profile,

      enrollsCount: enrollMap[user.id] ?? 0,
      progressCount: progressMap[user.id] ?? 0,
      bookmarksCount: bookmarkMap[user.id] ?? 0,
      achievementsCount: achievementMap[user.id] ?? 0,
      notificationsCount: notificationMap[user.id] ?? 0,
      quizAttemptsCount: quizMap[user.id] ?? 0,

      streak: streakMap.get(user.id) ?? {
        currentStreak: 0,
        longestStreak: 0,
      },
    }));

    const total = await prisma.user.count({
      where: search
        ? { OR: [{ email: { contains: search, mode: "insensitive" } }] }
        : undefined,
    });

    const [totalUsers, totalAdmins, totalNormalUsers] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: { role: "admin" },
      }),

      prisma.user.count({
        where: { role: "user" },
      }),
    ]);

    return {
      items,
      stats: {
        totalUsers,
        totalAdmins,
        totalNormalUsers,
      },
      paginations: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + usersData.length < total,
        nextPage: skip + usersData.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    logger.error("Error while getting users", { error });

    throw error;
  }
};
