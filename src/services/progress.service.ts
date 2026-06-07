import { logger } from "@sentry/node";

import {
  GetProgressesParams,
  UpdateProgressParams,
} from "../validations/progress.validation";
import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/client";

export const getAllProgressesService = async ({
  page,
  limit,
  userId,
  lessonId,
  completed,
}: GetProgressesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.ProgressWhereInput = {
      lessonId,
      ...(userId ? { userId } : {}),
      ...(completed !== undefined ? { completed } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.progress.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),

      prisma.progress.count({ where }),
    ]);

    return {
      items,
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
    logger.error("Error getting all progresses", { error });

    throw error;
  }
};

export const updateProgressService = async ({
  userId,
  lessonId,
  completed,
  startedAt,
  finishedAt,
}: UpdateProgressParams) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!lesson) {
      logger.error("Lesson not found");

      throw new Error("LESSON_NOT_FOUND");
    }

    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completed,
        startedAt: startedAt ? new Date(startedAt) : undefined,
        finishedAt: completed
          ? finishedAt
            ? new Date(finishedAt)
            : new Date()
          : null,
      },
      create: {
        userId,
        lessonId,
        completed: completed ?? false,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        finishedAt: completed
          ? finishedAt
            ? new Date(finishedAt)
            : new Date()
          : null,
      },
    });

    const completedLessons = await prisma.progress.count({
      where: {
        userId,
        completed: true,
        lesson: { courseId: lesson.courseId },
      },
    });

    const totalLessons = await prisma.lesson.count({
      where: { courseId: lesson.courseId },
    });

    const enroll = await prisma.enroll.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
      update: {
        finishedLessons: completedLessons,
        completed: completedLessons >= totalLessons,
        finishedAt: completedLessons >= totalLessons ? new Date() : null,
      },
      create: {
        userId,
        courseId: lesson.courseId,
        finishedLessons: completedLessons,
        completed: completedLessons >= totalLessons,
        finishedAt: completedLessons >= totalLessons ? new Date() : null,
      },
    });

    return { ...progress, enrollId: enroll.id, courseId: enroll.courseId };
  } catch (error) {
    logger.error("Error update lesson progress", { error });

    throw error;
  }
};
