import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  getAllProgressesService,
  getProgressService,
  updateProgressService,
} from "../services/progress.service";
import {
  getProgressesQuerySchema,
  getProgressSchema,
  updateProgressSchema,
} from "../validations/progress.validation";
import { formatValidationError } from "../utils/format";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllProgressesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all progresses");

    const validationResult = getProgressesQuerySchema.safeParse({
      ...req.query,
      lessonId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all progresses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, userId, completed, lessonId } = validationResult.data;

    const result = await getAllProgressesService({
      page,
      limit,
      userId,
      completed,
      lessonId,
    });

    logger.info("Successfully fetched all progresses");

    await setCache(
      redisKeys
        .progresses(JSON.stringify(lessonId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

export const getProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching progress");

    const validationResult = getProgressSchema.safeParse({
      lessonId: req.params.id,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get progress", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { lessonId, userId } = validationResult.data;

    const progress = await getProgressService({
      lessonId,
      userId,
    });

    logger.info("Successfully get progress");

    await setCache(redisKeys.progress(progress.id), {
      success: true,
      progress,
    });

    res.status(201).json({ success: true, progress });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Progress not found",
      });
      return;
    }

    next(error);
  }
};

export const updateProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started updating lesson progress");

    const validationResult = updateProgressSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update lesson progress", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, lessonId, completed, finishedAt, startedAt } =
      validationResult.data;

    const result = await updateProgressService({
      userId,
      lessonId,
      completed: completed ?? false,
      startedAt,
      finishedAt,
    });

    logger.info("Successfully updated lesson progress");

    const keys = await getKeys(`progresses:${lessonId}:*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.progress(result.id));
    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res.json({
      success: true,
      result,
      message: "Progress updated successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "LESSON_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
      return;
    }

    next(error);
  }
};
