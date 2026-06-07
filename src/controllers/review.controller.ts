import { Request, Response, NextFunction } from "express";
import { logger } from "@sentry/node";

import {
  createReviewSchema,
  deleteReviewSchema,
  getReviewsQuerySchema,
} from "../validations/review.validation";
import {
  createReviewService,
  deleteReviewService,
  getAllReviewsService,
  getCourseReviewsService,
  getUserReviewsService,
} from "../services/review.service";
import { formatValidationError } from "../utils/format";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAllReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all reviews");

    const validationResult = getReviewsQuerySchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching all reviews", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, courseId, userId } = validationResult.data;

    const result = await getAllReviewsService({
      page,
      limit,
      courseId,
      userId,
    });

    logger.info("Successfully fetched all reviews");

    await setCache(
      redisKeys
        .reviews(JSON.stringify(courseId), JSON.stringify(req.query))
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

export const getUserReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching user reviews");

    const validationResult = getReviewsQuerySchema.safeParse({
      ...req.query,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching user reviews", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, courseId, userId } = validationResult.data;

    const result = await getUserReviewsService({
      page,
      limit,
      search,
      courseId,
      userId,
    });

    logger.info("Successfully fetched user reviews");

    await setCache(
      redisKeys
        .userReviews(req.user.id, JSON.stringify(req.query))
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

export const getCourseReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching course reviews");

    const validationResult = getReviewsQuerySchema.safeParse({
      ...req.query,
      courseId: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed while fetching course reviews", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { page, limit, search, courseId } = validationResult.data;

    const result = await getCourseReviewsService({
      page,
      limit,
      search,
      courseId,
    });

    logger.info("Successfully fetched course reviews");

    await setCache(
      redisKeys
        .courseReviews(JSON.stringify(courseId), JSON.stringify(req.query))
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

export const createReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating review");
    const validationResult = createReviewSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to create review", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { courseId, userId, message, rating } = validationResult.data;

    const review = await createReviewService({
      courseId,
      userId,
      message,
      rating,
    });

    logger.info("Successfully created review");

    const keys = await getKeys(`reviews:${courseId}:*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`reviews:user:${userId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`reviews:course:${courseId}:*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res
      .status(201)
      .json({ success: true, review, message: "Review created successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "COURSE_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    if (message === "REVIEW_ALREADY_EXISTS") {
      res.status(404).json({
        success: false,
        message: "Your already reviewed this course",
      });
      return;
    }

    next(error);
  }
};

export const deleteReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started deleting review");
    const validationResult = deleteReviewSchema.safeParse({
      reviewId: req.params.id,
      userId: req.user.id,
      courseId: req.body.courseId,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to delete review", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { reviewId, userId, courseId } = validationResult.data;

    const review = await deleteReviewService({
      reviewId,
      userId,
      courseId,
    });

    logger.info("Successfully deleted review");

    const keys = await getKeys(`reviews:${courseId}:*`);
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    const keys2 = await getKeys(`reviews:user:${userId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    const keys3 = await getKeys(`reviews:course:${courseId}:*`);
    if (keys3?.length) {
      await deleteManyCache(keys3);
    }

    const keys4 = await getKeys(`course:${courseId}:*`);
    if (keys4?.length) {
      await deleteManyCache(keys4);
    }

    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));

    res.status(201).json({
      success: true,
      review,
      message: "Review deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "REVIEW_NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    next(error);
  }
};
