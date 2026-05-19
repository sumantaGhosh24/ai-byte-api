import { Request, Response } from "express";
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
} from "../validations/achievement.validation";
import { userIdSchema } from "../validations/user.validation";

export const getAllAchievementsController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string | undefined;
    const achievementType = req.query.achievementType as
      | "general"
      | "learning"
      | "quiz"
      | "course"
      | "streak"
      | "custom"
      | undefined;

    logger.info("Started fetching paginated all achievements");

    const result = await getAllAchievementsService({
      page,
      limit,
      search,
      achievementType,
    });

    logger.info("Successfully fetched paginated achievements");

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getAchievementController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching achievement ${req.params.id}`);

    const validationResult = achievementIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get achievement", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const achievement = await getAchievementByIdService(id);

    logger.info(`Successfully fetched achievement ${id}`);

    res.json({ success: true, achievement });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createAchievementController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started creating achievement");

    const validationResult = createAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create achievement", {
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
      title,
      description,
      badgeImage,
      badgeImagePublicId,
      xpReward,
      achievementType,
    } = validationResult.data;

    const achievement = await createAchievementService({
      title,
      description,
      badgeImage,
      badgeImagePublicId,
      xpReward,
      achievementType,
    });

    logger.info("Successfully created achievement");

    res.status(201).json({ success: true, achievement });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateAchievementController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started updating achievement ${req.params.id}`);

    const idValidationResult = achievementIdSchema.safeParse({
      id: req.params.id,
    });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update achievement (id)", {
        error: formatValidationError(idValidationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(idValidationResult.error),
      });
      return;
    }

    const { id } = idValidationResult.data;

    const validationResult = updateAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update achievement (body)", {
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
      title,
      description,
      badgeImage,
      badgeImagePublicId,
      xpReward,
      achievementType,
    } = validationResult.data;

    const achievement = await updateAchievementService({
      id,
      title,
      description,
      badgeImage,
      badgeImagePublicId,
      xpReward,
      achievementType,
    });

    logger.info(`Successfully updated achievement ${id}`);

    res.json({ success: true, achievement });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteAchievementController = async (
  req: Request,
  res: Response
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

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const achievement = await deleteAchievementService(id);

    logger.info(`Successfully deleted achievement ${id}`);

    res.json({ success: true, achievement });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getUserAchievementsController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started fetching achievements for user ${req.params.userId}`);

    const validationResult = userIdSchema.safeParse({
      userId: req.params.userId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get user achievement", {
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

    const result = await getUserAchievementsService(userId);

    logger.info(`Successfully fetched achievements for user ${userId}`);

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createUserAchievementController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(
      `Started granting achievement to user  ${req.body.achievementId} to user ${req.body.userId}`
    );

    const validationResult = createUserAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create user achievement", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { userId, achievementId } = validationResult.data;

    const userAchievement = await createUserAchievementService({
      userId,
      achievementId,
    });

    logger.info(
      `Successfully granted achievement ${achievementId} to user ${userId}`
    );

    res.status(201).json({ success: true, userAchievement });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteUserAchievementController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(
      `Started deleting user achievement ${req.body.achievementId} from user ${req.body.userId}`
    );

    const validationResult = createUserAchievementSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to delete user achievement", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { userId, achievementId } = validationResult.data;

    const deleted = await deleteUserAchievementService({
      userId,
      achievementId,
    });

    logger.info(
      `Successfully deleted achievement ${achievementId} from user ${userId}`
    );

    res.json({ success: true, userAchievement: deleted });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
