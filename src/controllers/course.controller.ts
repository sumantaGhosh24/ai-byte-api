import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllCoursesService,
  getPublicCoursesService,
  getCourseService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
} from "../services/course.service";
import {
  courseIdSchema,
  createCourseSchema,
  updateCourseSchema,
} from "../validations/course.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllCoursesController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const difficulty = req.query.difficulty as
      | "beginner"
      | "intermediate"
      | "advanced";
    const visibility = req.query.visibility as "public" | "private";
    const status = req.query.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed";

    logger.info("Started fetching paginated all courses (admin)");

    const result = await getAllCoursesService({
      page,
      limit,
      search,
      categoryId,
      difficulty,
      visibility,
      status,
    });

    logger.info("Successfully fetched paginated all courses (admin)");

    await setCache(redisKeys.courses(JSON.stringify(req.query)), {
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

export const getPublicCoursesController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const difficulty = req.query.difficulty as
      | "beginner"
      | "intermediate"
      | "advanced";
    const status = req.query.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed";

    logger.info("Started fetching paginated public courses");

    const result = await getPublicCoursesService({
      page,
      limit,
      search,
      categoryId,
      difficulty,
      status,
    });

    logger.info("Successfully fetched paginated public courses");

    await setCache(redisKeys.courses(JSON.stringify(req.query)), {
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

export const getCourseController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching course ${req.params.id} (admin)`);

    const validationResult = courseIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get course", {
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

    const course = await getCourseService(id);

    logger.info(`Successfully fetched course ${id} (admin)`);

    await setCache(redisKeys.course(id), { success: true, course });

    res.json({ success: true, course });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getPublicCourseController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info(`Started fetching public course ${req.params.id}`);

    const validationResult = courseIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get course", {
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

    const course = await getCourseService(id);

    logger.info(`Successfully fetched public course ${id}`);

    await setCache(redisKeys.course(id), { success: true, course });

    res.json({ success: true, course });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createCourseController = async (req: Request, res: Response) => {
  try {
    logger.info("Started creating course");

    const validationResult = createCourseSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create course", {
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
      categoryId,
      title,
      description,
      thumbnailUrl,
      thumbnailPublicId,
      difficulty,
      duration,
      visibility,
      status,
      xpReward,
    } = validationResult.data;

    const course = await createCourseService({
      categoryId,
      title,
      description,
      thumbnailUrl,
      thumbnailPublicId,
      difficulty,
      duration,
      visibility,
      status,
      xpReward,
    });

    logger.info("Successfully created course");

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    res.status(201).json({ success: true, course });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateCourseController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating course ${req.params.id}`);

    const idValidationResult = courseIdSchema.safeParse({
      id: req.params.id,
    });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update course (id)", {
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

    const validationResult = updateCourseSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update course (body)", {
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
      categoryId,
      title,
      description,
      thumbnailUrl,
      thumbnailPublicId,
      difficulty,
      duration,
      visibility,
      status,
      xpReward,
    } = validationResult.data;

    const course = await updateCourseService({
      id,
      categoryId,
      title,
      description,
      thumbnailUrl,
      thumbnailPublicId,
      difficulty,
      duration,
      visibility,
      status,
      xpReward,
    });

    logger.info(`Successfully updated course ${id}`);

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.course(id));

    res.json({ success: true, course });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteCourseController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started deleting course ${req.params.id}`);

    const validationResult = courseIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to delete course", {
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

    const course = await deleteCourseService(id);

    logger.info(`Successfully deleted course ${id}`);

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.course(id));

    res.json({ success: true, course });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
