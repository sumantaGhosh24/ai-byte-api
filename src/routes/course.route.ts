import { Router } from "express";

import {
  getAllCoursesController,
  getPublicCoursesController,
  getCourseController,
  createCourseController,
  generateCourseController,
  updateCourseController,
  deleteCourseController,
  getPublicCourseController,
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
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.courses(JSON.stringify(req.query))),
  getAllCoursesController
);

router.get(
  "/courses/public",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.courses(JSON.stringify(req.query))),
  getPublicCoursesController
);

router.get(
  "/courses/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.course(JSON.stringify(req.params.id))),
  getCourseController
);

router.get(
  "/courses/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.course(JSON.stringify(req.params.id))),
  getPublicCourseController
);

router.post(
  "/courses",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createCourseController
);

router.post("/generate-course", requireAdmin, generateCourseController);

router.put(
  "/courses/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateCourseController
);

router.delete(
  "/courses/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteCourseController
);

export default router;
