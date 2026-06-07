import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  getAllProgressesService,
  updateProgressService,
} from "../services/progress.service";
import {
  getProgressesQuerySchema,
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

    const keys2 = await getKeys(`courses:*:${req.user.id}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`lessons:${result.courseId}:${req.user.id}:*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    await deleteCache(redisKeys.publicLesson(lessonId, req.user.id));
    await deleteCache(redisKeys.publicLesson(lessonId, req.user.id));
    await deleteCache(redisKeys.myCourse(result.courseId, userId));
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
