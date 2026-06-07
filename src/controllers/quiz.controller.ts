import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllQuizzesService,
  getQuizService,
  createQuizService,
  updateQuizService,
  deleteQuizService,
  generateQuizService,
} from "../services/quiz.service";
import {
  createQuizSchema,
  generateQuizSchema,
  quizIdSchema,
  quizzesSchema,
  updateQuizSchema,
} from "../validations/quiz.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";
import { inngest } from "../inngest/client";

export const getAllQuizzesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching paginated quizzes");

    const validationResult = quizzesSchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all quizzes", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, difficulty, status, visibility, courseId } =
      validationResult.data;

    const result = await getAllQuizzesService({
      page,
      limit,
      search,
      courseId,
      difficulty,
      visibility,
      status,
    });

    logger.info("Successfully fetched paginated quizzes");

    await setCache(
      redisKeys
        .allQuizzes(JSON.stringify(courseId), JSON.stringify(req.query))
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

export const getPublicQuizzesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching paginated quizzes");

    const validationResult = quizzesSchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all quizzes", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, difficulty, courseId } = validationResult.data;

    const result = await getAllQuizzesService({
      page,
      limit,
      search,
      courseId,
      difficulty,
    });

    logger.info("Successfully fetched paginated quizzes");

    await setCache(
      redisKeys
        .quizzes(JSON.stringify(courseId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error: unknown) {
    next(error);
  }
};

export const getQuizController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    await setCache(redisKeys.quiz(id), { success: true, quiz });

    res.json({ success: true, quiz });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
      return;
    }

    next(error);
  }
};

export const getPublicQuizController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    await setCache(redisKeys.publicQuiz(id), { success: true, quiz });

    res.json({ success: true, quiz });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
      return;
    }

    next(error);
  }
};

export const createQuizController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const {
      courseId,
      title,
      description,
      difficulty,
      passingScore,
      visibility,
    } = validationResult.data;

    const quiz = await createQuizService({
      courseId,
      title,
      description,
      difficulty,
      passingScore,
      visibility,
    });

    logger.info("Successfully created quiz");

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`quizzes:all:${courseId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`quizzes:${courseId}*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    await deleteCache(redisKeys.course(JSON.stringify(courseId)));

    res
      .status(201)
      .json({ success: true, quiz, message: "Quiz created successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateQuizController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started updating quiz ${req.params.id}`);

    const validationResult = updateQuizSchema.safeParse({
      ...req.body,
      quizId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update quiz", {
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
      courseId,
      title,
      description,
      difficulty,
      quizId,
      passingScore,
      visibility,
    } = validationResult.data;

    const quiz = await updateQuizService({
      quizId,
      courseId,
      title,
      description,
      difficulty,
      passingScore,
      visibility,
    });

    logger.info(`Successfully updated quiz ${quizId}`);

    if (quiz) {
      const quizListKeys = await getKeys(`quizzes:${quiz.courseId}*`);
      if (quizListKeys?.length) {
        await deleteManyCache(quizListKeys);
      }
    }

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`quizzes:all:${courseId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`quizzes:${courseId}*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    await deleteCache(redisKeys.quiz(quizId as string));
    await deleteCache(redisKeys.publicQuiz(quizId as string));
    await deleteCache(redisKeys.course(JSON.stringify(courseId)));

    res.json({ success: true, quiz, message: "Quiz updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
      return;
    }

    next(error);
  }
};

export const deleteQuizController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`quizzes:all:${quiz.courseId}*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`quizzes:${quiz.courseId}*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${quiz.courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    await deleteCache(redisKeys.quiz(id));
    await deleteCache(redisKeys.course(JSON.stringify(quiz.courseId)));

    res.json({ success: true, quiz, message: "Quiz deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
      return;
    }

    next(error);
  }
};

export const generateQuizController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started generating quiz with AI");

    const validationResult = generateQuizSchema.safeParse({
      ...req.body,
      courseId: req.params.courseId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed for generating quiz with AI", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const { topic, difficulty, courseId, numberOfQuestions } =
      validationResult.data;

    const quiz = await generateQuizService({
      topic,
      courseId,
      difficulty,
    });

    logger.info("Successfully generated quiz with AI");

    await inngest.send({
      name: "quiz/generate.requested",
      data: {
        topic,
        difficulty,
        courseId,
        quizId: quiz.id,
        numberOfQuestions,
      },
    });

    const keys = await getKeys(`quizzes:all:${courseId}*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    return res.status(202).json({
      success: true,
      message: "AI quiz generation started successfully",
      data: {
        quiz: quiz.id,
        status: quiz.status,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};
