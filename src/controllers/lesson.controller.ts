import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllLessonsService,
  getAllPublicLessonsService,
  getLessonService,
  getPublicLessonService,
  createLessonService,
  updateLessonService,
  deleteLessonService,
} from "../services/lesson.service";
import {
  lessonIdSchema,
  createLessonSchema,
  updateLessonSchema,
} from "../validations/lesson.validation";
import { deleteCache, setCache } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllLessonsController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;
    const courseId = req.query.courseId as string;
    const status = req.query.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed";
    const visibility = req.query.visibility as "public" | "private";

    logger.info("Started fetching paginated all lessons (admin)");

    const result = await getAllLessonsService({
      page,
      limit,
      search,
      courseId,
      status,
      visibility,
    });

    logger.info("Successfully fetched paginated all lessons (admin)");

    await setCache(redisKeys.lessons(JSON.stringify(req.query)), {
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

export const getAllPublicLessonsController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;
    const courseId = req.query.courseId as string;
    const status = req.query.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed";

    logger.info("Started fetching paginated public lessons");

    const result = await getAllPublicLessonsService({
      page,
      limit,
      search,
      courseId,
      status,
    });

    logger.info("Successfully fetched paginated public lessons");

    await setCache(redisKeys.publicLessons(JSON.stringify(req.query)), {
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

export const getLessonController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching lesson ${req.params.id} (admin)`);

    const validationResult = lessonIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get lesson", {
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

    const lesson = await getLessonService(id);

    logger.info(`Successfully fetched lesson ${id} (admin)`);

    await setCache(redisKeys.lesson(id), { success: true, lesson });

    res.json({ success: true, lesson });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getPublicLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started fetching public lesson ${req.params.id}`);

    const validationResult = lessonIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get public lesson", {
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

    const lesson = await getPublicLessonService(id);

    logger.info(`Successfully fetched public lesson ${id}`);

    await setCache(redisKeys.lesson(id), { success: true, lesson });

    res.json({ success: true, lesson });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createLessonController = async (req: Request, res: Response) => {
  try {
    logger.info("Started creating lesson");

    const validationResult = createLessonSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create lesson", {
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
      content,
      thumbnailUrl,
      thumbnailPublicId,
      videoUrl,
      videoPublicId,
      duration,
      visibility,
      status,
      xpReward,
      orderIndex,
    } = validationResult.data;

    const lesson = await createLessonService({
      courseId,
      title,
      content,
      thumbnailUrl,
      thumbnailPublicId,
      videoUrl,
      videoPublicId,
      duration,
      visibility,
      status,
      xpReward,
      orderIndex,
    });

    logger.info("Successfully created lesson");

    await deleteCache(redisKeys.lessons(lesson.courseId));
    await deleteCache(redisKeys.publicLessons(lesson.courseId));

    res.status(201).json({ success: true, lesson });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateLessonController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating lesson ${req.params.id}`);

    const idValidationResult = lessonIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update lesson (id)", {
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

    const validationResult = updateLessonSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update lesson (body)", {
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
      content,
      thumbnailUrl,
      thumbnailPublicId,
      videoUrl,
      videoPublicId,
      duration,
      visibility,
      status,
      xpReward,
      orderIndex,
    } = validationResult.data;

    const lesson = await updateLessonService({
      id,
      courseId,
      title,
      content,
      thumbnailUrl,
      thumbnailPublicId,
      videoUrl,
      videoPublicId,
      duration,
      visibility,
      status,
      xpReward,
      orderIndex,
    });

    logger.info(`Successfully updated lesson ${id}`);

    await deleteCache(redisKeys.lessons(lesson.courseId));
    await deleteCache(redisKeys.publicLessons(lesson.courseId));
    await deleteCache(redisKeys.lesson(id));

    res.json({ success: true, lesson });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteLessonController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started deleting lesson ${req.params.id}`);

    const validationResult = lessonIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to delete lesson", {
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

    const lesson = await deleteLessonService(id);

    logger.info(`Successfully deleted lesson ${id}`);

    await deleteCache(redisKeys.lessons(lesson.courseId));
    await deleteCache(redisKeys.publicLessons(lesson.courseId));
    await deleteCache(redisKeys.lesson(id));

    res.json({ success: true, lesson });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
