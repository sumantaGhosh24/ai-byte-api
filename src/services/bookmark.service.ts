import { logger } from "@sentry/node";

import { prisma } from "../config/db";
import {
  CreateBookmarkParams,
  DeleteBookmarkParams,
  GetBookmarksParams,
} from "../validations/bookmark.validation";
import { Prisma } from "../generated/prisma/client";

export const getAllBookmarksService = async ({
  page,
  limit,
  userId,
  courseId,
}: GetBookmarksParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.BookmarkWhereInput = {
      courseId,
      ...(userId ? { userId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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

      prisma.bookmark.count({ where }),
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
      },
    };
  } catch (error) {
    logger.error("Error getting all bookmarks", { error });

    throw error;
  }
};

export const getBookmarkService = async ({
  bookmarkId,
  userId,
}: DeleteBookmarkParams) => {
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId, userId },
    });

    if (!bookmark) {
      logger.error("Bookmark not found");

      throw new Error("NOT_FOUND");
    }

    return bookmark;
  } catch (error) {
    logger.error("Error getting bookmark", { error });

    throw error;
  }
};

export const createBookmarkService = async ({
  userId,
  courseId,
}: CreateBookmarkParams) => {
  try {
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        visibility: "public",
        status: "completed",
      },
    });

    if (!existingCourse) {
      logger.error("Course not found");

      throw new Error("NOT_FOUND");
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingBookmark) {
      logger.error("Bookmark already exists");

      throw new Error("BOOKMARK_ALREADY_EXISTS");
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        courseId,
      },
      include: {
        course: {
          include: { category: true },
        },
      },
    });

    return bookmark;
  } catch (error) {
    logger.error("Error creating bookmark", { error });

    throw error;
  }
};

export const deleteBookmarkService = async ({
  bookmarkId,
  userId,
}: DeleteBookmarkParams) => {
  try {
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!existingBookmark) {
      logger.error("Bookmark not found");

      throw new Error("NOT_FOUND");
    }

    const bookmark = await prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    return bookmark;
  } catch (error) {
    logger.error("Error deleting bookmark", { error });

    throw error;
  }
};
