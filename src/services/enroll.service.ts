import { logger } from "@sentry/node";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/db";
import {
  CreateEnrollParams,
  DeleteEnrollParams,
  GetEnrollsParams,
} from "../validations/enroll.validation";

export const getAllEnrollsService = async ({
  page,
  limit,
  userId,
  courseId,
  completed,
}: GetEnrollsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollWhereInput = {
      courseId,
      ...(userId ? { userId } : {}),
      ...(completed !== undefined ? { completed } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.enroll.findMany({
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
          course: {
            include: { category: true },
          },
        },
      }),

      prisma.enroll.count({ where }),
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
    logger.error("Error getting all enrolls", { error });

    throw error;
  }
};

export const createEnrollService = async ({
  userId,
  courseId,
}: CreateEnrollParams) => {
  try {
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        visibility: "public",
        status: "completed",
      },
    });

    if (!existingCourse) {
      logger.error("Enroll not found");

      throw new Error("NOT_FOUND");
    }

    const existingEnroll = await prisma.enroll.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnroll) {
      logger.error("Already enrolled");

      throw new Error("ALREADY_ENROLLED");
    }

    const enroll = await prisma.enroll.create({
      data: {
        userId,
        courseId,
        startedAt: new Date(),
      },
      include: {
        course: {
          include: { category: true },
        },
      },
    });

    return enroll;
  } catch (error) {
    logger.error("Error creating enroll", { error });

    throw error;
  }
};

export const deleteEnrollService = async ({
  enrollId,
  userId,
}: DeleteEnrollParams) => {
  try {
    const existingEnroll = await prisma.enroll.findFirst({
      where: {
        id: enrollId,
        userId,
      },
    });

    if (!existingEnroll) {
      logger.error("Enroll not found");

      throw new Error("NOT_FOUND");
    }

    const enroll = await prisma.enroll.delete({
      where: { id: enrollId },
    });

    return enroll;
  } catch (error) {
    logger.error("Error deleting enroll", { error });

    throw error;
  }
};
