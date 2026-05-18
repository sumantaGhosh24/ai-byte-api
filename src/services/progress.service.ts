import { and, eq, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { progress, lessons, courses, users, streaks } from "../db/schema";

interface UpdateProgressParams {
  userId: string;
  lessonId: string;
  watchPercentage: number;
  lastTimestamp: number;
  completed: boolean;
}

export const updateProgressService = async ({
  userId,
  lessonId,
  watchPercentage,
  lastTimestamp,
  completed,
}: UpdateProgressParams) => {
  try {
    const existing = await db.query.progress.findFirst({
      where: and(eq(progress.userId, userId), eq(progress.lessonId, lessonId)),
    });

    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      logger.error("Lesson not found");

      throw new Error("Lesson not found");
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, lesson.courseId),
    });

    if (!course) {
      logger.error("Course not found");

      throw new Error("Course not found");
    }

    let xpAwarded = 0;

    await db.transaction(async tx => {
      if (existing) {
        await tx
          .update(progress)
          .set({
            watchPercentage,
            lastTimestamp: `${lastTimestamp}`,
            completed,
            updatedAt: new Date(),
          })
          .where(eq(progress.id, existing.id));
      } else {
        await tx.insert(progress).values({
          userId,
          lessonId,
          watchPercentage,
          lastTimestamp: `${lastTimestamp}`,
          completed,
        });
      }

      const firstCompletion = completed && (!existing || !existing.completed);

      if (firstCompletion) {
        xpAwarded = course.xpReward;

        await tx
          .update(users)
          .set({
            xp: sql`${users.xp} + ${course.xpReward}`,
          })
          .where(eq(users.id, userId));

        const currentStreak = await tx.query.streaks.findFirst({
          where: eq(streaks.userId, userId),
        });

        if (currentStreak) {
          const nextStreak = currentStreak.currentStreak + 1;
          await tx
            .update(streaks)
            .set({
              currentStreak: nextStreak,
              longestStreak: Math.max(nextStreak, currentStreak.longestStreak),
              updatedAt: new Date(),
            })
            .where(eq(streaks.userId, userId));
        }
      }
    });

    return {
      lessonId,
      completed,
      xpAwarded,
      shouldUnlockNextLesson: completed,
    };
  } catch (error) {
    logger.error("Error update lesson progress", { error });

    throw error;
  }
};
