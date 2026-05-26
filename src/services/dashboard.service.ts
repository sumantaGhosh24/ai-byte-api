/* eslint-disable indent */
import { logger } from "@sentry/node";

import { prisma } from "../config/db";

export const getAdminDashboardService = async () => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalCourses,
      totalLessons,
      totalQuizzes,
      totalEnrollments,
      totalBookmarks,
      totalReviews,
      totalNotifications,
      totalNotificationTokens,
      totalAchievements,
      totalUnlockedAchievements,
      completedEnrollments,
      onboardingCompletedUsers,
      pushEnabledUsers,
      averageRating,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          role: "admin",
        },
      }),

      prisma.course.count(),

      prisma.lesson.count(),

      prisma.quiz.count(),

      prisma.enroll.count(),

      prisma.bookmark.count(),

      prisma.review.count(),

      prisma.notification.count(),

      prisma.notificationToken.count(),

      prisma.achievement.count(),

      prisma.userAchievement.count(),

      prisma.enroll.count({
        where: {
          completed: true,
        },
      }),

      prisma.profile.count({
        where: {
          onboardingCompleted: true,
        },
      }),

      prisma.profile.count({
        where: {
          pushNotificationsEnabled: true,
        },
      }),

      prisma.review.aggregate({
        _avg: {
          rating: true,
        },
      }),
    ]);

    const [
      courseStatus,
      lessonStatus,
      quizStatus,
      notificationTypes,
      courseDifficulty,
      lessonDifficulty,
      quizDifficulty,
      achievementRarity,
    ] = await Promise.all([
      prisma.course.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.lesson.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.quiz.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.notification.groupBy({
        by: ["type"],
        _count: true,
      }),

      prisma.course.groupBy({
        by: ["difficulty"],
        _count: true,
      }),

      prisma.lesson.groupBy({
        by: ["difficulty"],
        _count: true,
      }),

      prisma.quiz.groupBy({
        by: ["difficulty"],
        _count: true,
      }),

      prisma.achievement.groupBy({
        by: ["achievementRarity"],
        _count: true,
      }),
    ]);

    const [
      averageQuizScore,
      highestQuizScore,
      unreadNotifications,
      activeTokens,
    ] = await Promise.all([
      prisma.quizAttempt.aggregate({
        _avg: {
          score: true,
        },
      }),

      prisma.quizAttempt.aggregate({
        _max: {
          score: true,
        },
      }),

      prisma.notification.count({
        where: {
          read: false,
        },
      }),

      prisma.notificationToken.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    const [topCourses, topAchievements, latestUsers] = await Promise.all([
      prisma.course.findMany({
        take: 10,
        orderBy: {
          enrolls: { _count: "desc" },
        },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),

      prisma.achievement.findMany({
        take: 10,
        select: {
          id: true,
          title: true,
          _count: {
            select: { userAchievements: true },
          },
        },
        orderBy: {
          userAchievements: { _count: "desc" },
        },
      }),

      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalAdmins,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalEnrollments,
        totalBookmarks,
        totalReviews,
        totalNotifications,
        totalNotificationTokens,
        totalAchievements,
        totalUnlockedAchievements,
      },
      users: {
        onboardingCompletedUsers,
        onboardingPendingUsers: totalUsers - onboardingCompletedUsers,
        pushEnabledUsers,
        latestUsers,
      },
      engagement: {
        completedEnrollments,
        completionRate:
          totalEnrollments === 0
            ? 0
            : Number(
                ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
              ),
      },
      courses: {
        totalCourses,
        status: courseStatus,
        difficulty: courseDifficulty,
        averageRating: averageRating._avg.rating || 0,
        topCourses: topCourses.map(course => ({
          id: course.id,
          title: course.title,
          enrollments: course._count.enrolls,
          bookmarks: course._count.bookmarks,
          reviews: course._count.reviews,
          averageRating:
            course.reviews.length > 0
              ? Number(
                  (
                    course.reviews.reduce(
                      (acc, review) => acc + review.rating,
                      0
                    ) / course.reviews.length
                  ).toFixed(2)
                )
              : 0,
        })),
      },
      lessons: {
        totalLessons,
        status: lessonStatus,
        difficulty: lessonDifficulty,
      },
      quizzes: {
        totalQuizzes,
        status: quizStatus,
        difficulty: quizDifficulty,
        averageScore: averageQuizScore._avg.score || 0,
        highestScore: highestQuizScore._max.score || 0,
      },
      achievements: {
        totalAchievements,
        rarity: achievementRarity,
        unlocked: totalUnlockedAchievements,
        topAchievements: topAchievements.map(achievement => ({
          id: achievement.id,
          title: achievement.title,
          unlocks: achievement._count.userAchievements,
        })),
      },
      notifications: {
        totalNotifications,
        unreadNotifications,
        activeTokens,
        distribution: notificationTypes,
      },
    };
  } catch (error) {
    logger.error("Error fetching dashboard data", { error });

    throw error;
  }
};
