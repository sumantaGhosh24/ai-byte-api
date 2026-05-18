import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllAnswerSubmissionsService,
  getAnswerSubmissionService,
  createAnswerSubmissionService,
} from "../services/answerSubmission.service";
import {
  answerSubmissionIdSchema,
  createAnswerSubmissionSchema,
} from "../validations/answerSubmission.validation";
import { setCache, getKeys, deleteManyCache } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllAnswerSubmissionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const quizAttemptId = req.query.quizAttemptId as string | undefined;

    logger.info("Started fetching paginated answer submissions");

    const result = await getAllAnswerSubmissionsService({
      page,
      limit,
      quizAttemptId,
    });

    logger.info("Successfully fetched paginated answer submissions");

    const cacheKey =
      redisKeys.answerSubmissions(quizAttemptId ?? "all") +
      ":" +
      JSON.stringify(req.query);

    await setCache(cacheKey, { success: true, result });

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getAnswerSubmissionController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started fetching answer submission ${req.params.id}`);

    const validationResult = answerSubmissionIdSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get answer submission", {
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

    const answerSubmission = await getAnswerSubmissionService(id);

    logger.info(`Successfully fetched answer submission ${id}`);

    await setCache(redisKeys.answerSubmission(id), {
      success: true,
      answerSubmission,
    });

    res.json({ success: true, answerSubmission });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createAnswerSubmissionController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started creating answer submission");

    const validationResult = createAnswerSubmissionSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create answer submission", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { quizAttemptId, userAnswer } = validationResult.data;

    const answerSubmission = await createAnswerSubmissionService({
      quizAttemptId,
      userAnswer,
    });

    logger.info("Successfully created answer submission");

    const pattern = `answer-submissions:${quizAttemptId}*`;
    const keys = await getKeys(pattern);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    res.status(201).json({ success: true, answerSubmission });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
