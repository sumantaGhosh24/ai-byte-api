import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllQuestionsService,
  getQuestionService,
  createQuestionService,
  updateQuestionService,
  deleteQuestionService,
} from "../services/question.service";
import {
  questionIdSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from "../validations/question.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllQuestionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;
    const quizId = req.query.quizId as string;

    logger.info("Started fetching paginated questions");

    const result = await getAllQuestionsService({
      page,
      limit,
      search,
      quizId,
    });

    logger.info("Successfully fetched paginated questions");

    await setCache(
      redisKeys.questions(
        String(quizId || "all") + ":" + JSON.stringify(req.query)
      ),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getQuestionController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching question ${req.params.id}`);

    const validationResult = questionIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get question", {
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

    const question = await getQuestionService(id);

    logger.info(`Successfully fetched question ${id}`);

    await setCache(redisKeys.question(id), { success: true, question });

    res.json({ success: true, question });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const createQuestionController = async (req: Request, res: Response) => {
  try {
    logger.info("Started creating question");

    const validationResult = createQuestionSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create question", {
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
      quizId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
    } = validationResult.data;

    const newQuestion = await createQuestionService({
      quizId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
    });

    logger.info("Successfully created question");

    const keys = await getKeys(`questions:${quizId}*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    res.status(201).json({ success: true, question: newQuestion });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateQuestionController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating question ${req.params.id}`);

    const idValidationResult = questionIdSchema.safeParse({
      id: req.params.id,
    });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update question (id)", {
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

    const validationResult = updateQuestionSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update question (body)", {
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
      quizId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
    } = validationResult.data;

    const updatedQuestion = await updateQuestionService({
      id,
      quizId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
    });

    logger.info(`Successfully updated question ${id}`);

    const keys = await getKeys(`questions:${quizId}*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.question(id));

    res.json({ success: true, question: updatedQuestion });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteQuestionController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started deleting question ${req.params.id}`);

    const validationResult = questionIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to delete question", {
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

    const deleted = await deleteQuestionService(id);

    logger.info(`Successfully deleted question ${id}`);

    if (deleted) {
      const keys = await getKeys(`questions:${deleted.quizId}*`);
      if (keys?.length) {
        await deleteManyCache(keys);
      }
    }

    await deleteCache(redisKeys.question(id));

    res.json({ success: true, question: deleted });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
