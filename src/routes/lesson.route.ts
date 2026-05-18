import { Router } from "express";

import {
  getAllLessonsController,
  getAllPublicLessonsController,
  getLessonController,
  getPublicLessonController,
  createLessonController,
  updateLessonController,
  deleteLessonController,
} from "../controllers/lesson.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/lessons",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.lessons(JSON.stringify(req.query))),
  getAllLessonsController
);

router.get(
  "/lessons/public",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.publicLessons(JSON.stringify(req.query))),
  getAllPublicLessonsController
);

router.get(
  "/lessons/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.lesson(JSON.stringify(req.params.id))),
  getLessonController
);

router.get(
  "/lessons/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.lesson(JSON.stringify(req.params.id))),
  getPublicLessonController
);

router.post(
  "/lessons",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createLessonController
);

router.put(
  "/lessons/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateLessonController
);

router.delete(
  "/lessons/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteLessonController
);

export default router;
