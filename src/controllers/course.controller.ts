import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { formatValidationError } from "../utils/format";
import {
  getAllCoursesService,
  getPublicCoursesService,
  getMyCoursesService,
  getRecommendedCoursesService,
  getBookmarkCoursesService,
  getTrendingCoursesService,
  getCourseService,
  getMyCourseService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
  generateCourseService,
} from "../services/course.service";
import {
  courseIdSchema,
  courseSchema,
  createCourseSchema,
  generateAICourseSchema,
  myCourseSchema,
  updateCourseSchema,
} from "../validations/course.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";
import { inngest } from "../inngest/client";

export const getAllCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all courses");

    const validationResult = courseSchema.safeParse(req.query);

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all courses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, categoryId, difficulty, status, visibility } =
      validationResult.data;

    const result = await getAllCoursesService({
      page,
      limit,
      search,
      categoryId,
      difficulty,
      visibility,
      status,
    });

    logger.info("Successfully fetched all courses");

    await setCache(
      redisKeys.allCourses(JSON.stringify(req.query)).replace(/"/g, ""),
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

export const getPublicCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching public courses");

    const validationResult = courseSchema.safeParse(req.query);

    if (!validationResult.success) {
      logger.error("Validation failed while fetching public courses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, categoryId, difficulty } =
      validationResult.data;

    const result = await getPublicCoursesService({
      page,
      limit,
      search,
      categoryId,
      difficulty,
    });

    logger.info("Successfully fetched public courses");

    await setCache(
      redisKeys.publicCourses(JSON.stringify(req.query)).replace(/"/g, ""),
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

export const getMyCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching my courses");

    const validationResult = myCourseSchema.safeParse({
      ...req.query,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching my courses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, categoryId, difficulty, userId } =
      validationResult.data;

    const result = await getMyCoursesService({
      userId,
      page,
      limit,
      search,
      categoryId,
      difficulty,
    });

    logger.info("Successfully fetched my courses");

    await setCache(
      redisKeys.myCourses(userId, JSON.stringify(req.query)).replace(/"/g, ""),
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

export const getRecommendedCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching recommended courses");

    const validationResult = myCourseSchema.safeParse({
      ...req.query,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching recommended courses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, categoryId, difficulty, userId } =
      validationResult.data;

    const result = await getRecommendedCoursesService({
      userId,
      page,
      limit,
      search,
      categoryId,
      difficulty,
    });

    logger.info("Successfully fetched recommended courses");

    await setCache(
      redisKeys
        .recommendedCourses(userId, JSON.stringify(req.query))
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

export const getBookmarkCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching bookmark courses");

    const validationResult = myCourseSchema.safeParse({
      ...req.query,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching bookmark courses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, categoryId, difficulty, userId } =
      validationResult.data;

    const result = await getBookmarkCoursesService({
      userId,
      page,
      limit,
      search,
      categoryId,
      difficulty,
    });

    logger.info("Successfully fetched bookmark courses");

    await setCache(
      redisKeys
        .bookmarkCourses(userId, JSON.stringify(req.query))
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

export const getTrendingCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching trending courses");

    const validationResult = courseSchema.safeParse(req.query);

    if (!validationResult.success) {
      logger.error("Validation failed while fetching trending courses", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, categoryId, difficulty } =
      validationResult.data;

    const result = await getTrendingCoursesService({
      page,
      limit,
      search,
      categoryId,
      difficulty,
    });

    logger.info("Successfully fetched trending courses");

    await setCache(
      redisKeys.trendingCourses(JSON.stringify(req.query)).replace(/"/g, ""),
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

export const getCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
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
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const getMyCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching my course ${req.params.id}`);

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

    const course = await getMyCourseService(id);

    logger.info(`Successfully fetched my course ${id}`);

    await setCache(redisKeys.myCourse(id, req.user.id), {
      success: true,
      course,
    });

    res.json({ success: true, course });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const createCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    });

    logger.info("Successfully created course");

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    res
      .status(201)
      .json({ success: true, course, message: "Course created successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started updating course ${req.params.id}`);

    const validationResult = updateCourseSchema.safeParse({
      ...req.body,
      courseId: req.params.id,
    });

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
      courseId,
    } = validationResult.data;

    const course = await updateCourseService({
      courseId,
      categoryId,
      title,
      description,
      thumbnailUrl,
      thumbnailPublicId,
      difficulty,
      duration,
      visibility,
      status,
    });

    logger.info(`Successfully updated course ${courseId}`);

    const keys = await getKeys("courses:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.course(courseId));
    await deleteCache(redisKeys.myCourse(courseId, req.user.id));

    res.json({ success: true, course, message: "Course updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const deleteCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    await deleteCache(redisKeys.myCourse(id, req.user.id));

    res.json({ success: true, course, message: "Course deleted sucessfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const generateCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started generating course");

    const validationResult = generateAICourseSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to generate course", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const {
      topic,
      difficulty,
      lessonCount,
      categoryId,
      thumbnailUrl,
      thumbnailPublicId,
    } = validationResult.data;

    const course = await generateCourseService({
      topic,
      difficulty,
      lessonCount,
      categoryId,
      thumbnailUrl,
      thumbnailPublicId,
    });

    logger.info("Successfully started AI course generation");

    await inngest.send({
      name: "course/generate.requested",
      data: {
        topic,
        difficulty,
        lessonCount,
        categoryId,
        courseId: course.id,
      },
    });

    const keys = await getKeys("courses:all:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    return res.status(202).json({
      success: true,
      message: "AI course generation started successfully",
      data: {
        courseId: course.id,
        status: course.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
