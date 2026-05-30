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
    logger.error("Failed to fetch user reviews", {
      error: error instanceof Error ? error.message : String(error),
    });
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

    const keys2 = await getKeys(`reviews:${userId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));
    await deleteCache(redisKeys.myCourse(courseId, req.user.id));

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

    const keys2 = await getKeys(`reviews:${userId}:*`);
    if (keys2?.length) {
      await deleteManyCache(keys2);
    }

    await deleteCache(redisKeys.profile(req.user.id));
    await deleteCache(redisKeys.publicProfile(req.user.id));
    await deleteCache(redisKeys.myCourse(courseId, req.user.id));

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
