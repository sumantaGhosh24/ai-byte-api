import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import {
  createBookmark,
  deleteBookmark,
  getBookmarks,
} from "../services/bookmark.service";
import { formatValidationError } from "../utils/format";
import { userIdSchema } from "../validations/user.validation";
import { bookmarkSchema } from "../validations/bookmark.validation";

export const createBookmarkController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(
      `Started creating bookmark for user ${rawUserId} and lesson ${req.body.lessonId}`
    );

    const validationResult = bookmarkSchema.safeParse({
      userId: rawUserId,
      lessonId: req.body.lessonId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to create bookmark", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, lessonId } = validationResult.data;

    const bookmark = await createBookmark({ userId, lessonId });

    logger.info(
      `Successfully created bookmark for user ${userId} and lesson ${lessonId}`
    );

    return res.json({ success: true, bookmark });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteBookmarkController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(
      `Started deleting bookmark for user ${rawUserId} and lesson ${req.body.lessonId}`
    );

    const validationResult = bookmarkSchema.safeParse({
      userId: rawUserId,
      lessonId: req.body.lessonId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to delete bookmark", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, lessonId } = validationResult.data;

    const deleted = await deleteBookmark({ userId, lessonId });

    logger.info(
      `Successfully deleted bookmark for user ${userId} and lesson ${lessonId}`
    );

    return res.json({ success: true, deleted });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getBookmarksController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(`Started fetching bookmarks for user ${rawUserId}`);

    const validationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!validationResult.success) {
      logger.error("Validation failed to get bookmarks", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId } = validationResult.data;

    const bookmarks = await getBookmarks(userId);

    logger.info(`Successfully fetched bookmarks for user ${userId}`);

    return res.json({ success: true, bookmarks });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
