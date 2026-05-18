import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllQuizAttemptsService,
  getQuizAttemptService,
  createQuizAttemptService,
  updateQuizAttemptService,
  deleteQuizAttemptService,
} from "../services/quizzeAttempt.service";
import {
  quizAttemptIdSchema,
  createQuizAttemptSchema,
  updateQuizAttemptSchema,
} from "../validations/quizzeAttempt.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllQuizAttemptsController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const userId = req.query.userId as string | undefined;
    const quizId = req.query.quizId as string | undefined;

    logger.info("Started fetching paginated quiz attempts");

    const result = await getAllQuizAttemptsService({
      page,
      limit,
      userId,
      quizId,
    });

    logger.info("Successfully fetched paginated quiz attempts");

    const cacheKey =
      redisKeys.quizAttempts(userId ?? "all", quizId ?? "all") +
      ":" +
      JSON.stringify(req.query);

    await setCache(cacheKey, {
      success: true,
      result,
    });

    res.json({ success: true, result });
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

    await setCache(redisKeys.quizAttempt(id), { success: true, quizAttempt });

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
  res: Response
) => {
  try {
    logger.info("Started creating quiz attempt");

    const validationResult = createQuizAttemptSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create quiz attempt", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { userId, quizId, score } = validationResult.data;

    const quizAttempt = await createQuizAttemptService({
      userId,
      quizId,
      score,
    });

    logger.info("Successfully created quiz attempt");

    const userQuizPattern = `quiz-attempts:${userId || "*"}:${quizId || "*"}`;
    const keys = await getKeys(userQuizPattern + "*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    res.status(201).json({ success: true, quizAttempt });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateQuizAttemptController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started updating quiz attempt ${req.params.id}`);

    const idValidationResult = quizAttemptIdSchema.safeParse({
      id: req.params.id,
    });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update quiz attempt (id)", {
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

    const validationResult = updateQuizAttemptSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update quiz attempt (body)", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { userId, quizId, score } = validationResult.data;

    const updated = await updateQuizAttemptService({
      id,
      userId,
      quizId,
      score,
    });

    logger.info(`Successfully updated quiz attempt ${id}`);

    const pattern = "quiz-attempts:*:*";
    const keys = await getKeys(pattern);
    if (keys?.length) {
      await deleteManyCache(keys);
    }
    await deleteCache(redisKeys.quizAttempt(id));

    res.json({ success: true, quizAttempt: updated });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteQuizAttemptController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started deleting quiz attempt ${req.params.id}`);

    const validationResult = quizAttemptIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to delete quiz attempt", {
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

    const deleted = await deleteQuizAttemptService(id);

    logger.info(`Successfully deleted quiz attempt ${id}`);

    const pattern = "quiz-attempts:*:*";
    const keys = await getKeys(pattern);
    if (keys?.length) {
      await deleteManyCache(keys);
    }
    await deleteCache(redisKeys.quizAttempt(id));

    res.json({ success: true, quizAttempt: deleted });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
