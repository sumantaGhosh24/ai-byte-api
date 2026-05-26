import { Request, Response, NextFunction } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  registerNotificationTokenService,
  getUserNotificationTokensService,
  getUserNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
} from "../services/notification.service";
import {
  registerNotificationTokenSchema,
  notificationIdSchema,
  getNotificationsQuerySchema,
} from "../validations/notification.validation";
import { redisKeys } from "../utils/redisKeys";
import { setCache, deleteCache } from "../utils/cache";

export const registerNotificationTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started registering notification token");

    const validationResult = registerNotificationTokenSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, token, platform } = validationResult.data;

    const tokenInfo = await registerNotificationTokenService({
      userId,
      token,
      platform,
    });

    await deleteCache(redisKeys.notificationTokens(userId));

    return res.json({
      success: true,
      token: tokenInfo,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserNotificationTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    const tokens = await getUserNotificationTokensService(userId);

    await setCache(redisKeys.notificationTokens(userId), {
      success: true,
      tokens,
    });

    return res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryWithUser = {
      ...req.query,
      userId: req.user.id,
    };
    const validationResult =
      getNotificationsQuerySchema.safeParse(queryWithUser);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const params = validationResult.data;

    const notifications = await getUserNotificationsService(params);

    await setCache(redisKeys.notifications(params.userId), {
      success: true,
      notifications,
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = notificationIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const notification = await markNotificationReadService(id);

    await deleteCache(redisKeys.notifications(req.user.id));

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    next(error);
  }
};

export const markAllNotificationsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    const updated = await markAllNotificationsReadService(userId);

    await deleteCache(redisKeys.notifications(userId));

    return res.json({
      success: true,
      updated,
    });
  } catch (error) {
    next(error);
  }
};
