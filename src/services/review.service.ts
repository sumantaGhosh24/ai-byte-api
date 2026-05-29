import { logger } from "@sentry/node";

import { prisma } from "../config/db";
import {
  CreateReviewParams,
  DeleteReviewParams,
  GetReviewsParams,
} from "../validations/review.validation";
import { Prisma } from "../generated/prisma/client";

export const getAllReviewsService = async ({
  page,
  limit,
  courseId,
  userId,
}: GetReviewsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      courseId,
      ...(userId ? { userId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          course: {
            include: {
              category: true,
            },
          },
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

      prisma.review.count({ where }),
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
    logger.error("Error getting admin all reviews", { error });

    throw error;
  }
};

export const getUserReviewsService = async ({
  userId,
  page,
  limit,
  courseId,
  search,
}: GetReviewsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      userId,
      ...(courseId ? { courseId } : {}),
      ...(search ? { message: { contains: search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          course: {
            include: {
              category: true,
            },
          },
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

      prisma.review.count({ where }),
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
    logger.error("Error getting user reviews", { error });

    throw error;
  }
};

export const createReviewService = async ({
  userId,
  courseId,
  message,
  rating = 1,
}: CreateReviewParams) => {
  try {
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        visibility: "public",
        status: "completed",
      },
    });

    if (!existingCourse) {
      logger.error("Course not found for review creation");

      throw new Error("COURSE_NOT_FOUND");
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingReview) {
      logger.error("Review already exists for this user and course");

      throw new Error("REVIEW_ALREADY_EXISTS");
    }

    const review = await prisma.review.create({
      data: {
        userId,
        courseId,
        message,
        rating,
      },
      include: {
        course: {
          include: { category: true },
        },
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
    });

    return review;
  } catch (error) {
    logger.error("Error creating review", { error });

    throw error;
  }
};

export const deleteReviewService = async ({
  reviewId,
  userId,
}: DeleteReviewParams) => {
  try {
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!existingReview) {
      logger.error("Review not found for deletion");

      throw new Error("REVIEW_NOT_FOUND");
    }

    const review = await prisma.review.delete({
      where: { id: reviewId },
    });

    return review;
  } catch (error) {
    logger.error("Error deleting review", { error });

    throw error;
  }
};
