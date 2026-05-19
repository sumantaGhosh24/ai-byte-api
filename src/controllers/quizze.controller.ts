import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllQuizzesService,
  getQuizService,
  createQuizService,
  updateQuizService,
  deleteQuizService,
} from "../services/quizze.service";
import {
  quizIdSchema,
  createQuizSchema,
  updateQuizSchema,
} from "../validations/quizze.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllQuizzesController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;
    const courseId = req.query.courseId as string;
    const difficulty = req.query.difficulty as
      | "beginner"
      | "intermediate"
      | "advanced";

    logger.info("Started fetching paginated quizzes");

    const result = await getAllQuizzesService({
      page,
      limit,
      search,
      courseId,
      difficulty,
    });

    logger.info("Successfully fetched paginated quizzes");

    await setCache(redisKeys.quizzes(courseId || "all"), {
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

export const getQuizController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching quiz ${req.params.id}`);

    const validationResult = quizIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get quiz", {
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

    const quiz = await getQuizService(id);

    logger.info(`Successfully fetched quiz ${id}`);

    await setCache(redisKeys.quizze(id), { success: true, quiz });

    res.json({ success: true, quiz });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createQuizController = async (req: Request, res: Response) => {
  try {
    logger.info("Started creating quiz");

    const validationResult = createQuizSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create quiz", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { courseId, title, description, difficulty } = validationResult.data;

    const quiz = await createQuizService({
      courseId,
      title,
      description,
      difficulty,
    });

    logger.info("Successfully created quiz");

    const keys = await getKeys(`quizzes:${courseId}*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    res.status(201).json({ success: true, quiz });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateQuizController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating quiz ${req.params.id}`);

    const idValidationResult = quizIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update quiz (id)", {
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

    const validationResult = updateQuizSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update quiz (body)", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { courseId, title, description, difficulty } = validationResult.data;

    const quiz = await updateQuizService({
      id,
      courseId,
      title,
      description,
      difficulty,
    });

    logger.info(`Successfully updated quiz ${id}`);

    if (quiz) {
      const quizListKeys = await getKeys(`quizzes:${quiz.courseId}*`);
      if (quizListKeys?.length) {
        await deleteManyCache(quizListKeys);
      }
    }

    await deleteCache(redisKeys.quizze(id));

    res.json({ success: true, quiz });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteQuizController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started deleting quiz ${req.params.id}`);

    const validationResult = quizIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to delete quiz", {
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

    const quiz = await deleteQuizService(id);

    logger.info(`Successfully deleted quiz ${id}`);

    if (quiz) {
      const quizListKeys = await getKeys(`quizzes:${quiz.courseId}*`);
      if (quizListKeys?.length) {
        await deleteManyCache(quizListKeys);
      }
    }

    await deleteCache(redisKeys.quizze(id));

    res.json({ success: true, quiz });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
