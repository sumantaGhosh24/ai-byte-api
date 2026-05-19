import { eq, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { streaks, users } from "../db/schema";

const isSameDay = (date1: Date, date2: Date) => {
  return date1.toDateString() === date2.toDateString();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const getStreakService = async (userId: string) => {
  try {
    let streak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });

    if (!streak) {
      const inserted = await db
        .insert(streaks)
        .values({
          userId,
          currentStreak: 0,
          longestStreak: 0,
        })
        .returning();

      streak = inserted[0];
    }

    return streak;
  } catch (error) {
    logger.error("Error fetching user streak", { error });

    throw error;
  }
};

export const checkInStreakService = async (userId: string) => {
  try {
    let streak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });

    if (!streak) {
      const inserted = await db
        .insert(streaks)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastCheckInAt: new Date(),
        })
        .returning();

      streak = inserted[0];
    }

    const now = new Date();

    if (
      streak?.lastCheckInAt &&
      isSameDay(new Date(streak.lastCheckInAt), now)
    ) {
      return {
        alreadyCheckedIn: true,
        currentStreak: streak.currentStreak,
      };
    }

    let nextStreak = 1;

    if (streak?.lastCheckInAt && isYesterday(new Date(streak.lastCheckInAt))) {
      nextStreak = streak.currentStreak + 1;
    }

    const longestStreak = Math.max(nextStreak, streak?.longestStreak ?? 0);

    let xpBonus = 0;

    if ([3, 7, 14, 30].includes(nextStreak)) {
      xpBonus = nextStreak * 10;

      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${xpBonus}`,
        })
        .where(eq(users.id, userId));
    }

    await db
      .update(streaks)
      .set({
        currentStreak: nextStreak,
        longestStreak,
        lastCheckInAt: now,
        updatedAt: now,
      })
      .where(eq(streaks.userId, userId));

    return {
      currentStreak: nextStreak,
      longestStreak,
      xpBonus,
      milestoneReached: xpBonus > 0,
    };
  } catch (error) {
    logger.error("Error to check in streak", { error });

    throw error;
  }
};
