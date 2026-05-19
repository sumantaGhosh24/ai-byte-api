import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import { userIdSchema } from "../validations/user.validation";
import { formatValidationError } from "../utils/format";
import {
  getStreakService,
  checkInStreakService,
} from "../services/streak.service";

export const getUserStreakController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(`Started fetching streak for user ${rawUserId}`);

    const validationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!validationResult.success) {
      logger.error("Validation failed to get user streak", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId } = validationResult.data;

    const streak = await getStreakService(userId);

    logger.info(`Successfully fetched streak for user ${userId}`);

    return res.json({ success: true, streak });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const checkInStreakController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(`Started check-in for streak for user ${rawUserId}`);

    const validationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!validationResult.success) {
      logger.error("Validation failed to check in streak", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId } = validationResult.data;

    const result = await checkInStreakService(userId);

    logger.info(`Successfully checked in streak for user ${userId}`);

    return res.json({ success: true, ...result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
