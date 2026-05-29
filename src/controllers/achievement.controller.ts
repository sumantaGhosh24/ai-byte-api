import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllAchievementsService,
  getAchievementByIdService,
  createAchievementService,
  updateAchievementService,
  deleteAchievementService,
  getUserAchievementsService,
  createUserAchievementService,
  deleteUserAchievementService,
} from "../services/achievement.service";
import {
  achievementIdSchema,
  createAchievementSchema,
  updateAchievementSchema,
  createUserAchievementSchema,
  getAchievementsQuerySchema,
} from "../validations/achievement.validation";
import { userIdSchema } from "../validations/user.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllAchievementsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching achievements");

    const validationResult = getAchievementsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      logger.error("Validation failed to get achievements", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, achievementType, achievementRarity } =
      validationResult.data;

    const result = await getAllAchievementsService({
      page,
      limit,
      search,
      achievementType,
      achievementRarity,
    });

    await setCache(
      redisKeys.achievements(JSON.stringify(req.query)).replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    logger.info("Successfully fetched achievements");

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching achievement ${req.params.id}`);

    const validationResult = achievementIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get achievement", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const achievement = await getAchievementByIdService(id);

    await setCache(redisKeys.achievement(id), {
      success: true,
      achievement,
    });

    logger.info(`Successfully fetched achievement ${id}`);

    res.json({
      success: true,
      achievement,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Quiz not found",
      });
      return;
    }

    next(error);
  }
};

export const createAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating achievement");

    const validationResult = createAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create achievement", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      title,
      description,
      badgeImage,
      badgeImagePublicId,
      achievementType,
      achievementRarity,
    } = validationResult.data;

    const achievement = await createAchievementService({
      title,
      description,
      badgeImage,
      badgeImagePublicId,
      achievementType,
      achievementRarity,
    });

    const keys = await getKeys("achievements:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    logger.info("Successfully created achievement");

    res.status(201).json({
      success: true,
      achievement,
      message: "Achievement created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started updating achievement ${req.params.id}`);

    const validationResult = updateAchievementSchema.safeParse({
      ...req.body,
      achievementId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update achievement", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      achievementId,
      achievementRarity,
      achievementType,
      badgeImage,
      badgeImagePublicId,
      description,
      title,
    } = validationResult.data;

    const achievement = await updateAchievementService({
      achievementId,
      achievementRarity,
      achievementType,
      badgeImage,
      badgeImagePublicId,
      description,
      title,
    });

    const keys = await getKeys("achievements:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.achievement(achievementId));

    logger.info(`Successfully updated achievement ${achievementId}`);

    res.json({
      success: true,
      achievement,
      message: "Achievement updated successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Quiz not found",
      });
      return;
    }

    next(error);
  }
};

export const deleteAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started deleting achievement ${req.params.id}`);

    const validationResult = achievementIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to delete achievement", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const achievement = await deleteAchievementService(id);

    const keys = await getKeys("achievements:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.achievement(id));

    logger.info(`Successfully deleted achievement ${id}`);

    res.json({
      success: true,
      achievement,
      message: "Achievement deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Quiz not found",
      });
      return;
    }

    next(error);
  }
};

export const getUserAchievementsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching achievements for user ${req.params.userId}`);

    const validationResult = userIdSchema.safeParse({
      userId: req.params.userId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get user achievements", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId } = validationResult.data;

    const achievements = await getUserAchievementsService(userId);

    await setCache(redisKeys.userAchievements(userId), {
      success: true,
      achievements,
    });

    logger.info(`Successfully fetched achievements for user ${userId}`);

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    next(error);
  }
};

export const createUserAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started granting achievement");

    const validationResult = createUserAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to grant achievement", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, achievementId } = validationResult.data;

    const userAchievement = await createUserAchievementService({
      userId,
      achievementId,
    });

    await deleteCache(redisKeys.userAchievements(userId));

    logger.info(
      `Successfully granted achievement ${achievementId} to user ${userId}`
    );

    res.status(201).json({
      success: true,
      userAchievement,
      message: "User acheivement created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "USER_NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Achievement not found",
      });
      return;
    }

    next(error);
  }
};

export const deleteUserAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started deleting user achievement");

    const validationResult = createUserAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to delete user achievement", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, achievementId } = validationResult.data;

    const userAchievement = await deleteUserAchievementService({
      userId,
      achievementId,
    });

    await deleteCache(redisKeys.userAchievements(userId));

    logger.info(
      `Successfully removed achievement ${achievementId} from user ${userId}`
    );

    res.json({
      success: true,
      userAchievement,
      message: "User achievement updated successfully",
    });
  } catch (error: unknown) {
    next(error);
  }
};
