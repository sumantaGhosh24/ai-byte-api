import { eq, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import {
  users,
  streaks,
  categories,
  courses,
  lessons,
  bookmarks,
  progress,
  quizzes,
  questions,
  quizAttempts,
  achievements,
  userAchievements,
  notifications,
} from "../db/schema";

export const getAdminDashboardService = async () => {
  try {
    const [
      usersCountArr,
      newUsersThisMonthArr,
      lessonCountArr,
      courseCountArr,
      quizCountArr,
      questionCountArr,
      achievementCountArr,
      bookmarkCountArr,
      streakCountArr,
      activeStreaksArr,
      completedLessonCountArr,
      notificationCountArr,
      latestUsers,
      latestCourses,
      latestLessons,
      latestQuizzes,
      latestAchievements,
      categoryCountArr,
      latestCategories,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          sql`date_trunc('month', ${users.createdAt}) = date_trunc('month', now())`
        ),
      db.select({ count: sql<number>`count(*)` }).from(lessons),
      db.select({ count: sql<number>`count(*)` }).from(courses),
      db.select({ count: sql<number>`count(*)` }).from(quizzes),
      db.select({ count: sql<number>`count(*)` }).from(questions),
      db.select({ count: sql<number>`count(*)` }).from(achievements),
      db.select({ count: sql<number>`count(*)` }).from(bookmarks),
      db.select({ count: sql<number>`count(*)` }).from(streaks),
      db
        .select({ count: sql<number>`count(*)` })
        .from(streaks)
        .where(sql`${streaks.currentStreak} > 0`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(progress)
        .where(eq(progress.completed, true)),
      db.select({ count: sql<number>`count(*)` }).from(notifications),
      db
        .select()
        .from(users)
        .orderBy(sql`${users.createdAt} desc`)
        .limit(5),
      db
        .select()
        .from(courses)
        .orderBy(sql`${courses.createdAt} desc`)
        .limit(5),
      db
        .select()
        .from(lessons)
        .orderBy(sql`${lessons.createdAt} desc`)
        .limit(5),
      db
        .select()
        .from(quizzes)
        .orderBy(sql`${quizzes.createdAt} desc`)
        .limit(5),
      db
        .select()
        .from(achievements)
        .orderBy(sql`${achievements.createdAt} desc`)
        .limit(5),
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db
        .select()
        .from(categories)
        .orderBy(sql`${categories.createdAt} desc`)
        .limit(5),
    ]);

    const getCount = (arr: { count: number }[] | undefined) =>
      arr && arr.length > 0 && typeof arr[0]?.count === "number"
        ? arr[0].count
        : 0;

    return {
      userCount: Number(getCount(usersCountArr)),
      newUsersThisMonth: Number(getCount(newUsersThisMonthArr)),
      lessonCount: Number(getCount(lessonCountArr)),
      courseCount: Number(getCount(courseCountArr)),
      quizCount: Number(getCount(quizCountArr)),
      questionCount: Number(getCount(questionCountArr)),
      achievementCount: Number(getCount(achievementCountArr)),
      bookmarkCount: Number(getCount(bookmarkCountArr)),
      streakCount: Number(getCount(streakCountArr)),
      activeStreaks: Number(getCount(activeStreaksArr)),
      completedLessonCount: Number(getCount(completedLessonCountArr)),
      notificationCount: Number(getCount(notificationCountArr)),
      categoryCount: Number(getCount(categoryCountArr)),
      latestUsers,
      latestCourses,
      latestLessons,
      latestQuizzes,
      latestAchievements,
      latestCategories,
    };
  } catch (error) {
    logger.error("Error fetching admin dashboard data", { error });
    throw error;
  }
};

export async function getUsersPerMonthTrendService(months: number = 6) {
  try {
    const rows = await db
      .select({
        year: sql<number>`extract(year from ${users.createdAt})::int`,
        month: sql<number>`extract(month from ${users.createdAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(
        sql`${users.createdAt} >= date_trunc('month', now()) - interval '${months - 1} month'`
      )
      .groupBy(
        sql`extract(year from ${users.createdAt})`,
        sql`extract(month from ${users.createdAt})`
      )
      .orderBy(
        sql`extract(year from ${users.createdAt}) ASC`,
        sql`extract(month from ${users.createdAt}) ASC`
      );

    return rows;
  } catch (error) {
    logger.error("Error fetching users per month trend", { error });

    throw error;
  }
}

export async function getCompletedLessonsTrendService(days: number = 14) {
  try {
    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${progress.updatedAt})::date`,
        count: sql<number>`count(*)`,
      })
      .from(progress)
      .where(
        sql`${progress.completed} = true and ${progress.updatedAt} >= now() - interval '${days} day'`
      )
      .groupBy(sql`date_trunc('day', ${progress.updatedAt})`)
      .orderBy(sql`date_trunc('day', ${progress.updatedAt}) ASC`);

    return rows;
  } catch (error) {
    logger.error("Error fetching completed lessons trend", { error });

    throw error;
  }
}

export async function getQuizAttemptsPerWeekTrendService(weeks: number = 8) {
  try {
    const rows = await db
      .select({
        year: sql<number>`extract(year from ${quizAttempts.submittedAt})::int`,
        week: sql<number>`extract(week from ${quizAttempts.submittedAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(quizAttempts)
      .where(
        sql`${quizAttempts.submittedAt} >= date_trunc('week', now()) - interval '${weeks - 1} week'`
      )
      .groupBy(
        sql`extract(year from ${quizAttempts.submittedAt})`,
        sql`extract(week from ${quizAttempts.submittedAt})`
      )
      .orderBy(
        sql`extract(year from ${quizAttempts.submittedAt}) ASC`,
        sql`extract(week from ${quizAttempts.submittedAt}) ASC`
      );

    return rows;
  } catch (error) {
    logger.error("Error fetching quiz attempts per week trend", { error });

    throw error;
  }
}

export async function getAchievementsPerMonthTrendService(months: number = 6) {
  try {
    const rows = await db
      .select({
        year: sql<number>`extract(year from ${userAchievements.unlockedAt})::int`,
        month: sql<number>`extract(month from ${userAchievements.unlockedAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(userAchievements)
      .where(
        sql`${userAchievements.unlockedAt} >= date_trunc('month', now()) - interval '${months - 1} month'`
      )
      .groupBy(
        sql`extract(year from ${userAchievements.unlockedAt})`,
        sql`extract(month from ${userAchievements.unlockedAt})`
      )
      .orderBy(
        sql`extract(year from ${userAchievements.unlockedAt}) ASC`,
        sql`extract(month from ${userAchievements.unlockedAt}) ASC`
      );

    return rows;
  } catch (error) {
    logger.error("Error fetching achievements per month trend", { error });

    throw error;
  }
}

export async function getActiveStreaksPerDayTrendService(days: number = 14) {
  try {
    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${streaks.updatedAt})::date`,
        activeCount: sql<number>`count(*)`,
      })
      .from(streaks)
      .where(
        sql`${streaks.currentStreak} > 0 and ${streaks.updatedAt} >= now() - interval '${days} day'`
      )
      .groupBy(sql`date_trunc('day', ${streaks.updatedAt})`)
      .orderBy(sql`date_trunc('day', ${streaks.updatedAt}) ASC`);

    return rows;
  } catch (error) {
    logger.error("Error fetching active streaks per day trend", { error });

    throw error;
  }
}

export async function getCoursesPerCategoryBreakdownService(
  limit: number = 10
) {
  try {
    const rows = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        count: sql<number>`count(${courses.id})`,
      })
      .from(courses)
      .innerJoin(categories, eq(courses.categoryId, categories.id))
      .groupBy(categories.id, categories.name)
      .orderBy(sql`count(${courses.id}) DESC`)
      .limit(limit);

    return rows;
  } catch (error) {
    logger.error("Error fetching courses per category breakdown", { error });

    throw error;
  }
}

export async function getNotificationsPerWeekTrendService(weeks: number = 8) {
  try {
    const rows = await db
      .select({
        year: sql<number>`extract(year from ${notifications.createdAt})::int`,
        week: sql<number>`extract(week from ${notifications.createdAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(notifications)
      .where(
        sql`${notifications.createdAt} >= date_trunc('week', now()) - interval '${weeks - 1} week'`
      )
      .groupBy(
        sql`extract(year from ${notifications.createdAt})`,
        sql`extract(week from ${notifications.createdAt})`
      )
      .orderBy(
        sql`extract(year from ${notifications.createdAt}) ASC`,
        sql`extract(week from ${notifications.createdAt}) ASC`
      );

    return rows;
  } catch (error) {
    logger.error("Error fetching notifications per week trend", { error });

    throw error;
  }
}
