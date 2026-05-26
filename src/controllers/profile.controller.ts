import { Request, Response, NextFunction } from "express";
import { logger } from "@sentry/node";

import {
  getProfileService,
  updateProfileService,
  getPublicProfileService,
  updateProfilePreferencesService,
} from "../services/profile.service";
import { formatValidationError } from "../utils/format";
import { userIdSchema } from "../validations/user.validation";
import {
  updateProfileSchema,
  updateProfilePreferencesSchema,
} from "../validations/profile.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getPublicProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`User public profile ${req.params.id} started fetching`);

    const validationResult = userIdSchema.safeParse({ userId: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get public profile", {
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

    const user = await getPublicProfileService(userId);

    logger.info(`User public profile ${userId} retrieved successfully`);

    await setCache(redisKeys.publicProfile(userId), { success: true, user });

    res.json({ success: true, user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    next(error);
  }
};

export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`User profile ${req.user.id} started fetching`);

    const validationResult = userIdSchema.safeParse({ userId: req.user.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get profile", {
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

    const user = await getProfileService(userId);

    logger.info(`User profile ${userId} retrieved successfully`);

    await setCache(redisKeys.profile(userId), { success: true, user });

    res.json({ success: true, user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    next(error);
  }
};

export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`User profile ${req.user.id} started updating`);

    const validationResult = updateProfileSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update profile", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, username, bio, avatarUrl, avatarPublicId, userId } =
      validationResult.data;

    const profile = await updateProfileService({
      userId,
      name,
      username,
      bio,
      avatarUrl,
      avatarPublicId,
    });

    logger.info(`User profile ${userId} updated successfully`);

    const keys = await getKeys("users:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.profile(userId));
    await deleteCache(redisKeys.publicProfile(userId));

    res.json({
      success: true,
      profile,
      message: "Profile updated successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    next(error);
  }
};

export const updateProfilePreferencesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`User profile preferences ${req.user.id} started updating`);

    const validationResult = updateProfilePreferencesSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update profifle preferences", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const {
      interests,
      goals,
      dailyReminderEnabled,
      dailyReminderTime,
      streakReminderEnabled,
      lessonReminderEnabled,
      pushNotificationsEnabled,
      emailNotificationsEnabled,
      userId,
    } = validationResult.data;

    const profile = await updateProfilePreferencesService({
      userId,
      interests,
      goals,
      dailyReminderEnabled,
      dailyReminderTime,
      streakReminderEnabled,
      lessonReminderEnabled,
      pushNotificationsEnabled,
      emailNotificationsEnabled,
    });

    logger.info(`User profile preferences ${userId} updated successfully`);

    const keys = await getKeys("users:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.profile(userId));
    await deleteCache(redisKeys.publicProfile(userId));

    res.json({
      success: true,
      profile,
      message: "Profile preferences updatedsuccessfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    next(error);
  }
};
