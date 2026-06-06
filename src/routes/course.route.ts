import { Router } from "express";

import {
  getAllCoursesController,
  getPublicCoursesController,
  getMyCoursesController,
  getRecommendedCoursesController,
  getTrendingCoursesController,
  getBookmarkCoursesController,
  getCourseController,
  getMyCourseController,
  createCourseController,
  updateCourseController,
  deleteCourseController,
  generateCourseController,
} from "../controllers/course.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/courses",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.allCourses(JSON.stringify(req.query))),
  getAllCoursesController
);

router.get(
  "/courses/public",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.publicCourses(JSON.stringify(req.query))),
  getPublicCoursesController
);

router.get(
  "/courses/my",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.myCourses(JSON.stringify(req.user.id), JSON.stringify(req.query))
  ),
  getMyCoursesController
);

router.get(
  "/courses/recommended",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.recommendedCourses(
      JSON.stringify(req.user.id),
      JSON.stringify(req.query)
    )
  ),
  getRecommendedCoursesController
);

router.get(
  "/courses/bookmark",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.bookmarkCourses(
      JSON.stringify(req.user.id),
      JSON.stringify(req.query)
    )
  ),
  getBookmarkCoursesController
);

router.get(
  "/courses/trending",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.trendingCourses(JSON.stringify(req.query))),
  getTrendingCoursesController
);

router.get(
  "/courses/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.course(JSON.stringify(req.params.id))),
  getCourseController
);

router.get(
  "/courses/my/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.myCourses(JSON.stringify(req.user.id), JSON.stringify(req.query))
  ),
  getMyCourseController
);

router.post("/courses", requireAdmin, generalRateLimit, createCourseController);

router.put(
  "/courses/:id",
  requireAdmin,
  generalRateLimit,
  updateCourseController
);

router.delete(
  "/courses/:id",
  requireAdmin,
  generalRateLimit,
  deleteCourseController
);

router.post(
  "/courses/generate",
  requireAdmin,
  generalRateLimit,
  generateCourseController
);

export default router;
