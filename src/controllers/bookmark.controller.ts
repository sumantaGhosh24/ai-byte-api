import { Request, Response, NextFunction } from "express";
import { logger } from "@sentry/node";

import {
  createBookmarkSchema,
  deleteBookmarkSchema,
  getBookmarksQuerySchema,
} from "../validations/bookmark.validation";
import {
  createBookmarkService,
  deleteBookmarkService,
  getAllBookmarksService,
  getBookmarkService,
} from "../services/bookmark.service";
import { formatValidationError } from "../utils/format";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllBookmarksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all bookmarks");

    const validationResult = getBookmarksQuerySchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get bookmark", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, userId, courseId } = validationResult.data;

    const result = await getAllBookmarksService({
      page,
      limit,
      userId,
      courseId,
    });

    logger.info("Successfully get bookmarks");

    await setCache(
      redisKeys
        .bookmarks(JSON.stringify(courseId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error: unknown) {
    next(error);
  }
};

export const getBookmarkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching bookmark");

    const validationResult = deleteBookmarkSchema.safeParse({
      bookmarkId: req.params.id,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get bookmark", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { bookmarkId, userId } = validationResult.data;

    const bookmark = await getBookmarkService({
      bookmarkId,
      userId,
    });

    logger.info("Successfully get bookmark");

    await setCache(redisKeys.bookmark(bookmarkId), { success: true, bookmark });

    res.status(201).json({ success: true, bookmark });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Bookmark not found",
      });
      return;
    }

    next(error);
  }
};

export const createBookmarkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating bookmark");

    const validationResult = createBookmarkSchema.safeParse({
      userId: req.user.id,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while creating bookmark", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, courseId } = validationResult.data;

    const bookmark = await createBookmarkService({
      userId,
      courseId,
    });

    logger.info("Successfully created bookmark");

    const keys = await getKeys(`courses:bookmark:${req.user.id}`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`bookmarks:${courseId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    await deleteCache(redisKeys.bookmark(bookmark.id));
    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res.status(201).json({
      success: true,
      bookmark,
      message: "Bookmark created successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    if (message === "BOOKMARK_ALREADY_EXISTS") {
      res.status(500).json({
        success: false,
        message: "You are already bookmarked this courase",
      });
      return;
    }

    next(error);
  }
};

export const deleteBookmarkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started deleting bookmark");

    const validationResult = deleteBookmarkSchema.safeParse({
      userId: req.user.id,
      bookmarkId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while deleting bookmark", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, bookmarkId } = validationResult.data;

    const bookmark = await deleteBookmarkService({
      userId,
      bookmarkId,
    });

    logger.info("Successfully deleted bookmark");

    const keys = await getKeys(`courses:bookmark:${req.user.id}`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`bookmarks:${bookmark.courseId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    await deleteCache(redisKeys.bookmark(bookmarkId));
    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res.status(201).json({
      success: true,
      bookmark,
      message: "Bookmark removed successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Bookmark not found",
      });
      return;
    }

    next(error);
  }
};
