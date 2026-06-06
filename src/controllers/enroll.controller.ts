import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  createEnrollSchema,
  getEnrollsQuerySchema,
  deleteEnrollSchema,
} from "../validations/enroll.validation";
import {
  getAllEnrollsService,
  getEnrollService,
  createEnrollService,
  deleteEnrollService,
} from "../services/enroll.service";
import { formatValidationError } from "../utils/format";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllEnrollsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all enrolls");

    const validationResult = getEnrollsQuerySchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all enrolls", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, userId, courseId, completed } = validationResult.data;

    const result = await getAllEnrollsService({
      page,
      limit,
      userId,
      courseId,
      completed,
    });

    logger.info("Successfully fetched all enrolls");

    await setCache(
      redisKeys
        .enrolls(JSON.stringify(courseId), JSON.stringify(req.query))
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

export const getEnrollController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching enroll");

    const validationResult = createEnrollSchema.safeParse({
      userId: req.user.id,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get enroll", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, courseId } = validationResult.data;

    const enroll = await getEnrollService({
      userId,
      courseId,
    });

    logger.info("Successfully get enroll");

    await setCache(redisKeys.enroll(userId, courseId), {
      success: true,
      enroll,
    });

    res.status(201).json({ success: true, enroll });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Enroll not found",
      });
      return;
    }

    next(error);
  }
};

export const createEnrollController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating enroll");

    const validationResult = createEnrollSchema.safeParse({
      courseId: req.params.id,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to create enroll", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { courseId, userId } = validationResult.data;

    const enroll = await createEnrollService({
      userId,
      courseId,
    });

    logger.info("Successfully created enroll");

    const keys = await getKeys(`enrolls:${courseId}:*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`course:my:${req.user.id}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res
      .status(201)
      .json({ success: true, enroll, message: "Enroll created successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Enroll not found",
      });
      return;
    }

    if (message === "ALREADY_ENROLLED") {
      res.status(500).json({
        success: false,
        message: "You are already enrolled in this courase",
      });
      return;
    }

    next(error);
  }
};

export const deleteEnrollController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started deleting enroll");

    const validationResult = deleteEnrollSchema.safeParse({
      enrollId: req.params.id,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to delete enroll", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { enrollId, userId } = validationResult.data;

    const enroll = await deleteEnrollService({
      enrollId,
      userId,
    });

    logger.info("Successfully delete enroll");

    const keys = await getKeys(`enrolls:${enroll.courseId}:`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`course:my:${req.user.id}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    await deleteCache(redisKeys.enroll(req.user.id, enroll.courseId));
    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res
      .status(201)
      .json({ success: true, enroll, message: "Enroll updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Enroll not found",
      });
      return;
    }

    next(error);
  }
};
