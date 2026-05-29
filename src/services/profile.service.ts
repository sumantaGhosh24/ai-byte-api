import { logger } from "@sentry/node";

import {
  ACHIEVEMENT_TYPE_MULTIPLIER,
  ACHIEVEMENT_XP,
  XP_BASE,
  XP_DIFFICULTY_MULTIPLIER,
} from "../constans";
import {
  UpdateProfileParams,
  UpdateProfilePreferencesParams,
} from "../validations/profile.validation";
import { prisma } from "../config/db";

export const getPublicProfileService = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      logger.error("User not found");

      throw new Error("NOT_FOUND");
    }

    const [
      enrollsCount,
      progressCount,
      finishedCoursesCount,
      finishedLessonsCount,
      totalBookmarks,
      achievementsCount,
      totalNotifications,
      quizStats,
      answerSubmissionStats,
    ] = await Promise.all([
      prisma.enroll.count({ where: { userId } }),

      prisma.progress.count({ where: { userId } }),

      prisma.enroll.count({
        where: { userId, completed: true },
      }),

      prisma.progress.count({
        where: { userId, completed: true },
      }),

      prisma.bookmark.count({ where: { userId } }),

      prisma.userAchievement.count({ where: { userId } }),

      prisma.notification.count({ where: { userId } }),

      prisma.quizAttempt.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { score: true },
        _max: { score: true },
        _min: { score: true },
      }),

      prisma.answerSubmission.count({
        where: {
          quizAttempt: { userId },
        },
      }),
    ]);

    const lastEnroll = await prisma.enroll.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { course: true },
    });

    const lastProgress = await prisma.progress.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { lesson: true },
    });

    const completedLessons = await prisma.progress.findMany({
      where: {
        userId,
        completed: true,
      },
      include: { lesson: true },
    });

    let lessonXP = 0;

    for (const item of completedLessons) {
      const difficulty =
        item.lesson.difficulty.toUpperCase() as keyof typeof XP_DIFFICULTY_MULTIPLIER;

      lessonXP +=
        XP_BASE.LESSON_COMPLETION * XP_DIFFICULTY_MULTIPLIER[difficulty];
    }

    const courseXP = finishedCoursesCount * XP_BASE.COURSE_COMPLETION;

    const userQuizAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
    });

    let quizXP = 0;

    // eslint-disable-next-line no-empty-pattern
    for (const {} of userQuizAttempts) {
      quizXP += XP_BASE.QUIZ_ATTEMPT;
    }

    const bookmarkXP = totalBookmarks * XP_BASE.BOOKMARK;

    const onboardingXP = user.profile?.onboardingCompleted
      ? XP_BASE.ONBOARDING_COMPLETE
      : 0;

    const firstLoginXP = XP_BASE.FIRST_LOGIN;

    const achievementData = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
    });

    let achievementXP = 0;

    for (const item of achievementData) {
      const rarity =
        item.achievement.achievementRarity.toUpperCase() as keyof typeof ACHIEVEMENT_XP;

      const type =
        item.achievement.achievementType.toUpperCase() as keyof typeof ACHIEVEMENT_TYPE_MULTIPLIER;

      achievementXP +=
        ACHIEVEMENT_XP[rarity] * ACHIEVEMENT_TYPE_MULTIPLIER[type];
    }

    const completedProgresses = await prisma.progress.findMany({
      where: {
        userId,
        completed: true,
      },
      select: { finishedAt: true },
      orderBy: { finishedAt: "desc" },
    });

    const uniqueDays = [
      ...new Set(
        completedProgresses
          .filter(p => p.finishedAt)
          .map(p => new Date(p.finishedAt!).toISOString().split("T")[0])
      ),
    ];

    let currentStreak = 0;

    if (uniqueDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const latest = new Date(uniqueDays[0] as string);
      latest.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 0 || diff === 1) {
        currentStreak = 1;

        for (let i = 0; i < uniqueDays.length - 1; i++) {
          const curr = new Date(uniqueDays[i] as string);
          const next = new Date(uniqueDays[i + 1] as string);

          curr.setHours(0, 0, 0, 0);
          next.setHours(0, 0, 0, 0);

          const d = Math.floor(
            (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (d === 1) currentStreak++;
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

    const streakXP = currentStreak * XP_BASE.STREAK_DAILY;

    const totalXP =
      lessonXP +
      courseXP +
      quizXP +
      bookmarkXP +
      onboardingXP +
      firstLoginXP +
      achievementXP +
      streakXP;

    return {
      user,
      stats: {
        enrollsCount,
        progressCount,
        finishedCoursesCount,
        finishedLessonsCount,
        totalQuizAttempts: quizStats._count.id,
        totalAnswerSubmissions: answerSubmissionStats,
        averageScore: quizStats._avg.score ?? 0,
        highestScore: quizStats._max.score ?? 0,
        lowestScore: quizStats._min.score ?? 0,
        totalBookmarks,
        achievementsCount,
        totalNotifications,
        currentStreak,
        longestStreak,
      },
      lastEnroll,
      lastProgress,
      xp: {
        lessonXP,
        courseXP,
        quizXP,
        bookmarkXP,
        onboardingXP,
        firstLoginXP,
        achievementXP,
        streakXP,
        totalXP,
      },
    };
  } catch (error) {
    logger.error("Error to get public profile", { error });

    throw error;
  }
};

export const getProfileService = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      logger.error("User not found");

      throw new Error("NOT_FOUND");
    }

    return user;
  } catch (error) {
    logger.error("Error to get profile", { error });

    throw error;
  }
};

export const updateProfileService = async ({
  userId,
  name,
  username,
  bio,
  avatarUrl,
  avatarPublicId,
}: UpdateProfileParams) => {
  try {
    const existing = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existing) {
      logger.error("Profile not found");

      throw new Error("NOT_FOUND");
    }

    return prisma.profile.update({
      where: { userId },
      data: {
        name: name?.toLowerCase(),
        username: username?.toLowerCase(),
        bio: bio?.toLowerCase(),
        avatarUrl,
        avatarPublicId,
      },
    });
  } catch (error) {
    logger.error("Error to update profile", { error });

    throw error;
  }
};

export const updateProfilePreferencesService = async ({
  userId,
  interests,
  goals,
  dailyReminderTime,
  dailyReminderEnabled,
  streakReminderEnabled,
  lessonReminderEnabled,
  pushNotificationsEnabled,
  emailNotificationsEnabled,
}: UpdateProfilePreferencesParams) => {
  try {
    const existing = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existing) {
      logger.error("Profile not found");

      throw new Error("NOT_FOUND");
    }

    return prisma.profile.update({
      where: { userId },
      data: {
        interests,
        goals,
        dailyReminderTime,
        dailyReminderEnabled,
        streakReminderEnabled,
        lessonReminderEnabled,
        pushNotificationsEnabled,
        emailNotificationsEnabled,
        onboardingCompleted: true,
      },
    });
  } catch (error) {
    logger.error("Error to update profile preferences", { error });

    throw error;
  }
};
