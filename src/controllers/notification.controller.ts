import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  registerNotificationTokenService,
  createNotificationService,
  markNotificationReadService,
  markAllNotificationsReadService,
  getUserNotificationsService,
} from "../services/notification.service";
import {
  addNotificationTokenSchema,
  createNotificationSchema,
  notificationIdSchema,
} from "../validations/notification.validation";
import { userIdSchema } from "../validations/user.validation";

export const registerNotificationTokenController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started registering notification token");

    const validationResult = addNotificationTokenSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to register notification token", {
        error: formatValidationError(validationResult.error),
      });

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

    logger.info("Successfully registered notification token");

    return res.json({ success: true, token: tokenInfo });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createNotificationController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started creating notification");

    const validationResult = createNotificationSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create notification", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      userId,
      title,
      message,
      type,
      read,
      relatedCourseId,
      relatedLessonId,
      relatedQuizId,
    } = validationResult.data;

    const notification = await createNotificationService({
      userId,
      title,
      message,
      type,
      read,
      relatedCourseId,
      relatedLessonId,
      relatedQuizId,
    });

    logger.info("Successfully created notification");

    return res.json({ success: true, notification });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const markNotificationReadController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started marking notification ${req.params.id} as read`);

    const validationResult = notificationIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed for notification id", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const notification = await markNotificationReadService(id);

    logger.info(`Successfully marked notification ${id} as read`);

    return res.json({ success: true, notification });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const markAllNotificationsReadController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(
      `Started marking all notifications as read for user ${rawUserId}`
    );

    const validationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!validationResult.success) {
      logger.error("Validation failed to mark all notification read", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { userId } = validationResult.data;

    const updated = await markAllNotificationsReadService(userId);

    logger.info(
      `Successfully marked all notifications as read for user ${userId}`
    );

    return res.json({ success: true, updated });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getUserNotificationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const read = req.query.read as string;
    const type = req.query.type as string;

    const { userId: rawUserId } = getAuth(req);

    logger.info(`Started fetching notifications for user ${rawUserId}`);

    const validationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!validationResult.success) {
      logger.error("Validation failed to get user notifications", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { userId } = validationResult.data;

    const notifications = await getUserNotificationsService({
      userId,
      page,
      limit,
      type,
      read: Boolean(read),
    });

    logger.info(`Successfully fetched notifications for user ${userId}`);

    return res.json({ success: true, notifications });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
