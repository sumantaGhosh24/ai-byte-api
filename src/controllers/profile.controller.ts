import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import {
  getProfileService,
  updateProfileService,
  updatePreferencesService,
  getPublicProfileService,
} from "../services/profile.service";
import { formatValidationError } from "../utils/format";
import { userIdSchema } from "../validations/user.validation";
import {
  updatePreferencesSchema,
  updateProfileSchema,
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
  res: Response
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

    const profile = await getPublicProfileService(userId);

    logger.info(`User public profile ${userId} retrieved successfully`);

    await setCache(redisKeys.publicProfile(userId), { success: true, profile });

    res.json({ success: true, profile });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getProfileController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(`User profile ${rawUserId} started fetching`);

    const validationResult = userIdSchema.safeParse({ userId: rawUserId });

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

    const profile = await getProfileService(userId);

    logger.info(`User profile ${userId} retrieved successfully`);

    await setCache(redisKeys.profile(userId), { success: true, profile });

    res.json({ success: true, profile });
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(`User profile ${rawUserId} started updating`);

    const idValidationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update profile", {
        error: formatValidationError(idValidationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(idValidationResult.error),
      });
      return;
    }

    const { userId } = idValidationResult.data;

    const validationResult = updateProfileSchema.safeParse(req.body);

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

    const {
      name,
      username,
      bio,
      avatarUrl,
      avatarPublicId,
      interests,
      goals,
      onboardingCompleted,
    } = validationResult.data;

    const profile = await updateProfileService({
      userId,
      name,
      username,
      bio,
      avatarUrl,
      avatarPublicId,
      interests,
      goals,
      onboardingCompleted,
    });

    logger.info(`User profile ${userId} updated successfully`);

    const keys = await getKeys("users:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.profile(userId));
    await deleteCache(redisKeys.publicProfile(userId));

    res.json({ success: true, profile });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updatePreferencesController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId: rawUserId } = getAuth(req);

    logger.info(`User profile preferences ${rawUserId} started updating`);

    const idValidationResult = userIdSchema.safeParse({ userId: rawUserId });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update profile preferences", {
        error: formatValidationError(idValidationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(idValidationResult.error),
      });
      return;
    }

    const { userId } = idValidationResult.data;

    const validationResult = updatePreferencesSchema.safeParse(req.body);

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
      learningPreference,
      videoPreference,
      dailyReminderEnabled,
      dailyReminderTime,
      streakReminderEnabled,
      lessonReminderEnabled,
      pushNotificationsEnabled,
      emailNotificationsEnabled,
    } = validationResult.data;

    const profile = await updatePreferencesService({
      userId,
      learningPreference,
      videoPreference,
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

    res.json({ success: true, profile });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
