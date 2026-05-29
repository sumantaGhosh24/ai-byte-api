import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getQuizAttemptService,
  createQuizAttemptService,
  getUserQuizAttemptsService,
  getQuizAttemptsService,
  getUserQuizAllAttemptsService,
} from "../services/quizAttempt.service";
import {
  quizAttemptIdSchema,
  createQuizAttemptSchema,
  getQuizAttemptsQuerySchema,
} from "../validations/quizAttempt.validation";
import { deleteManyCache, getKeys, setCache } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";
import { inngest } from "../inngest/client";

export const getUserQuizAllAttemptsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all quiz attempts");

    const validationResult = getQuizAttemptsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      logger.error("Validation failed to get quiz attempts", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });

      return;
    }

    const { page, limit, search, userId, quizId } = validationResult.data;

    const result = await getUserQuizAllAttemptsService({
      page,
      limit,
      search,
      userId,
      quizId,
    });

    logger.info("Successfully fetched all quiz attempts");

    await setCache(
      redisKeys
        .userQuizAttempts(
          JSON.stringify(userId),
          JSON.stringify(quizId),
          JSON.stringify(req.query)
        )
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserQuizAttemptsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching user quiz attempts ${req.params.userId}`);

    const validationResult = getQuizAttemptsQuerySchema.safeParse({
      ...req.query,
      userId: req.params.userId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get user quiz attempts", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });

      return;
    }

    const { page, limit, userId } = validationResult.data;

    const result = await getUserQuizAttemptsService({
      userId,
      page,
      limit,
    });

    logger.info(`Successfully fetched user quiz attempts ${req.params.userId}`);

    await setCache(
      redisKeys
        .userAttempts(req.user.id, JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getQuizAttemptsController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started fetching attempts for quiz ${req.params.quizId}`);

    const queryValidation = getQuizAttemptsQuerySchema.safeParse({
      ...req.query,
      quizId: req.params.quizId,
    });

    if (!queryValidation.success) {
      logger.error("Validation failed to get quiz attempts", {
        error: formatValidationError(queryValidation.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(queryValidation.error),
      });

      return;
    }

    const { page, limit, quizId } = queryValidation.data;

    const result = await getQuizAttemptsService({
      quizId,
      page,
      limit,
    });

    logger.info(`Successfully fetched attempts for quiz ${quizId}`);

    await setCache(
      redisKeys
        .attempts(JSON.stringify(quizId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });

    return;
  }
};

export const getQuizAttemptController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching quiz attempt ${req.params.id}`);

    const validationResult = quizAttemptIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get quiz attempt", {
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

    const quizAttempt = await getQuizAttemptService(id);

    logger.info(`Successfully fetched quiz attempt ${id}`);

    await setCache(redisKeys.attempt(id), { success: true, quizAttempt });

    res.json({ success: true, quizAttempt });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createQuizAttemptController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating quiz attempt");

    const validationResult = createQuizAttemptSchema.safeParse({
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

    const { answers, quizId, userId } = validationResult.data;

    const attempt = await createQuizAttemptService({
      answers,
      quizId,
      userId,
    });

    await inngest.send({
      name: "quiz-attempt/summary.requested",
      data: { attemptId: attempt.id },
    });

    const keys = await getKeys(`attempts:user:${attempt.userId}*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`attempts:${attempt.quizId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(
      `attempts:${attempt.userId}:${attempt.quizId}*`
    );
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    return res.status(201).json({
      success: true,
      attempt,
      message: "Quiz attempt created successfully",
    });
  } catch (error) {
    next(error);
  }
};
