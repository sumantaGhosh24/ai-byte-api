import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllQuestionsService,
  getQuestionService,
  createQuestionService,
  updateQuestionService,
  deleteQuestionService,
  getPublicQuestionsService,
  getPublicQuestionService,
} from "../services/question.service";
import {
  questionIdSchema,
  createQuestionSchema,
  updateQuestionSchema,
  questionsSchema,
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
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching paginated questions");

    const validationResult = questionsSchema.safeParse({
      ...req.query,
      quizId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all questions", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, quizId, difficulty, status, visibility } =
      validationResult.data;

    const result = await getAllQuestionsService({
      page,
      limit,
      search,
      quizId,
      difficulty,
      status,
      visibility,
    });

    logger.info("Successfully fetched paginated questions");

    await setCache(
      redisKeys
        .allQuestions(String(quizId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

export const getPublicQuestionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching paginated questions");

    const validationResult = questionsSchema.safeParse({
      ...req.query,
      quizId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all questions", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, quizId, difficulty } = validationResult.data;

    const result = await getPublicQuestionsService({
      page,
      limit,
      search,
      quizId,
      difficulty,
    });

    logger.info("Successfully fetched paginated questions");

    await setCache(
      redisKeys
        .questions(String(quizId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

export const getQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching question ${req.params.id}`);

    const validationResult = questionIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get question", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const question = await getQuestionService(id);

    logger.info(`Successfully fetched question ${id}`);

    await setCache(redisKeys.question(id), { success: true, question });

    res.json({ success: true, question });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Question not found",
      });
      return;
    }

    next(error);
  }
};

export const getPublicQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching question ${req.params.id}`);

    const validationResult = questionIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get question", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const question = await getPublicQuestionService(id);

    logger.info(`Successfully fetched question ${id}`);

    await setCache(redisKeys.publicQuiz(id), { success: true, question });

    res.json({ success: true, question });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Question not found",
      });
      return;
    }

    next(error);
  }
};

export const createQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating question");

    const validationResult = createQuestionSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create question", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { quizId, difficulty, options, question, visibility, explanation } =
      validationResult.data;

    const newQuestion = await createQuestionService({
      quizId,
      difficulty,
      options,
      question,
      visibility,
      explanation,
    });

    logger.info("Successfully created question");

    const keys = await getKeys("quizzes:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`questions:all:${quizId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`questions:${quizId}*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    await deleteCache(redisKeys.quiz(JSON.stringify(quizId)));
    await deleteCache(redisKeys.publicQuiz(JSON.stringify(quizId)));

    res.status(201).json({ success: true, question: newQuestion });
  } catch (error) {
    next(error);
  }
};

export const updateQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started updating question ${req.params.id}`);

    const validationResult = updateQuestionSchema.safeParse({
      ...req.body,
      questionId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update question", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      quizId,
      questionId,
      difficulty,
      explanation,
      options,
      question,
      status,
      visibility,
    } = validationResult.data;

    const updatedQuestion = await updateQuestionService({
      quizId,
      questionId,
      difficulty,
      explanation,
      options,
      question,
      status,
      visibility,
    });

    logger.info(`Successfully updated question ${questionId}`);

    const keys = await getKeys("quizzes:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`questions:all:${quizId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`questions:${quizId}*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    await deleteCache(redisKeys.quiz(JSON.stringify(quizId)));
    await deleteCache(redisKeys.publicQuiz(JSON.stringify(quizId)));
    await deleteCache(redisKeys.question(questionId as string));
    await deleteCache(redisKeys.publicQuestion(questionId as string));

    res.json({ success: true, question: updatedQuestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Question not found",
      });
      return;
    }

    next(error);
  }
};

export const deleteQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started deleting question ${req.params.id}`);

    const validationResult = questionIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to delete question", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const deleted = await deleteQuestionService(id);

    logger.info(`Successfully deleted question ${id}`);

    const keys = await getKeys("quizzes:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`questions:all:${deleted.quizId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`questions:${deleted.quizId}*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    await deleteCache(redisKeys.quiz(JSON.stringify(deleted.quizId)));
    await deleteCache(redisKeys.publicQuiz(JSON.stringify(deleted.quizId)));
    await deleteCache(redisKeys.question(id));
    await deleteCache(redisKeys.publicQuestion(id));

    res.json({ success: true, question: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Question not found",
      });
      return;
    }

    next(error);
  }
};
