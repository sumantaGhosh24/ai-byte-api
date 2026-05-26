import { Router } from "express";

import {
  createReviewController,
  deleteReviewController,
  getAllReviewsController,
  getUserReviewsController,
} from "../controllers/review.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/reviews",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.userReviews(
      JSON.stringify(req.user.id),
      JSON.stringify(req.query)
    )
  ),
  getUserReviewsController
);

router.get(
  "/admin/reviews/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.reviews(JSON.stringify(req.params.id), JSON.stringify(req.query))
  ),
  getAllReviewsController
);

router.post(
  "/reviews",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createReviewController
);

router.delete(
  "/reviews/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  deleteReviewController
);

export default router;
