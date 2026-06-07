import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  getAllLessonsService,
  getPublicLessonsService,
  getLessonService,
  getPublicLessonService,
  createLessonService,
  updateLessonService,
  deleteLessonService,
  fixLessonOrderService,
  generateLessonService,
} from "../services/lesson.service";
import {
  lessonIdSchema,
  createLessonSchema,
  updateLessonSchema,
  fixLessonOrderSchema,
  generateLessonSchema,
  lessonsSchema,
} from "../validations/lesson.validation";
import {
  setCache,
  deleteCache,
  deleteManyCache,
  getKeys,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";
import { formatValidationError } from "../utils/format";
import { inngest } from "../inngest/client";

export const getAllLessonsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all lessons");

    const validationResult = lessonsSchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all lessons", {
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

    const result = await getAllLessonsService({
      page,
      limit,
      search,
      difficulty,
      visibility,
      status,
      courseId,
    });

    logger.info("Successfully fetched all lessons");

    await setCache(
      redisKeys
        .allLessons(JSON.stringify(courseId), JSON.stringify(req.query))
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicLessonsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching public lessons");

    const validationResult = lessonsSchema.safeParse({
      ...req.query,
      courseId: req.params.id,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching public lessons", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, difficulty, courseId, userId } =
      validationResult.data;

    const result = await getPublicLessonsService({
      page,
      limit,
      search,
      userId,
      difficulty,
      courseId,
    });

    logger.info("Successfully fetched public lessons");

    await setCache(
      redisKeys
        .lessons(
          JSON.stringify(courseId),
          JSON.stringify(userId),
          JSON.stringify(req.query)
        )
        .replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching lesson ${req.params.id}`);

    const validationResult = lessonIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      logger.error("Validation failed to fetch lesson", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const lesson = await getLessonService(id);

    logger.info(`Successfully fetched lesson ${id}`);

    await setCache(redisKeys.lesson(id), { success: true, lesson });

    res.json({ success: true, lesson });
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

export const getPublicLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching public lesson ${req.params.id}`);

    const validationResult = lessonIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to fetch public lesson", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const lesson = await getPublicLessonService(id, req.user.id);

    logger.info(`Successfully fetched public lesson ${id}`);

    await setCache(redisKeys.publicLesson(id, req.user.id), {
      success: true,
      lesson,
    });

    res.json({ success: true, lesson });
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

export const createLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating lesson");

    const validationResult = createLessonSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create lesson", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      courseId,
      title,
      content,
      difficulty,
      duration,
      visibility,
      thumbnailPublicId,
      thumbnailUrl,
      videoPublicId,
      videoUrl,
    } = validationResult.data;

    const lesson = await createLessonService({
      courseId,
      title,
      content,
      difficulty,
      duration,
      visibility,
      thumbnailPublicId,
      thumbnailUrl,
      videoPublicId,
      videoUrl,
    });

    logger.info("Successfully created lesson");

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`lessons:all:${courseId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`lessons:${courseId}:*`);
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
      .json({ success: true, lesson, message: "Lesson created successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started updating lesson ${req.params.id}`);

    const validationResult = updateLessonSchema.safeParse({
      ...req.body,
      lessonId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed for lesson update body", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      lessonId,
      content,
      duration,
      title,
      courseId,
      difficulty,
      status,
      thumbnailPublicId,
      thumbnailUrl,
      videoPublicId,
      videoUrl,
      visibility,
    } = validationResult.data;

    const lesson = await updateLessonService({
      lessonId,
      content,
      duration,
      title,
      courseId,
      difficulty,
      status,
      thumbnailPublicId,
      thumbnailUrl,
      videoPublicId,
      videoUrl,
      visibility,
    });

    logger.info(`Successfully updated lesson ${lessonId}`);

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`lessons:all:${courseId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`lessons:${courseId}:*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    const keys5 = await getKeys(`lesson:public:${lessonId}:*`);
    if (keys5?.length) {
      await deleteManyCache(keys5);
    }

    await deleteCache(redisKeys.lesson(lessonId));
    await deleteCache(redisKeys.course(JSON.stringify(courseId)));

    res.json({ success: true, lesson, message: "Lesson updated successfully" });
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

export const deleteLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started deleting lesson ${req.params.id}`);

    const validationResult = lessonIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      logger.error("Validation failed for lesson id on delete", {
        error: formatValidationError(validationResult.error),
      });
      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    const lesson = await deleteLessonService(id);

    logger.info(`Successfully deleted lesson ${id}`);

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`lessons:all:${lesson.courseId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`lessons:${lesson.courseId}:*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${lesson.courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    const keys5 = await getKeys(`lesson:public:${id}:*`);
    if (keys5?.length) {
      await deleteManyCache(keys5);
    }

    await deleteCache(redisKeys.lesson(id));
    await deleteCache(redisKeys.course(JSON.stringify(lesson.courseId)));

    res.json({ success: true, lesson, message: "Lesson deleted successfully" });
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

export const fixLessonOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fixing lesson order");

    const validationResult = fixLessonOrderSchema.safeParse({
      ...req.body,
      courseId: req.params.courseId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to fix lesson order", {
        error: formatValidationError(validationResult.error),
      });
      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const { courseId, lessons } = validationResult.data;

    const lesson = await fixLessonOrderService({ courseId, lessons });

    logger.info("Successfully fixed lesson order");

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`lessons:all:${courseId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`lessons:${courseId}:*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    await deleteCache(redisKeys.course(JSON.stringify(courseId)));

    res.json({
      success: true,
      lesson,
      message: "Lesson order fixed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const generateLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started generating lesson with AI");

    const validationResult = generateLessonSchema.safeParse({
      ...req.body,
      courseId: req.params.courseId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed for generating lesson with AI", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      topic,
      difficulty,
      courseId,
      thumbnailPublicId,
      thumbnailUrl,
      videoPublicId,
      videoUrl,
    } = validationResult.data;

    const lesson = await generateLessonService({
      topic,
      courseId,
      difficulty,
      thumbnailUrl,
      thumbnailPublicId,
      videoUrl,
      videoPublicId,
    });

    logger.info("Successfully generated lesson with AI");

    await inngest.send({
      name: "lesson/generate.requested",
      data: {
        topic,
        difficulty,
        courseId,
        lessonId: lesson.id,
      },
    });

    const keys = await getKeys(`lessons:all:${courseId}:*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    return res.status(202).json({
      success: true,
      message: "AI lesson generation started successfully",
      data: {
        lesson: lesson.id,
        status: lesson.status,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};
