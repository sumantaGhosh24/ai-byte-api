import { Router } from "express";

import {
  getAllLessonsController,
  getPublicLessonsController,
  getLessonController,
  getPublicLessonController,
  createLessonController,
  updateLessonController,
  deleteLessonController,
  fixLessonOrderController,
  generateLessonController,
} from "../controllers/lesson.controller";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/lessons/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.allLessons(
      JSON.stringify(req.params.id),
      JSON.stringify(req.query)
    )
  ),
  getAllLessonsController
);

router.get(
  "/lessons/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.lessons(
      JSON.stringify(req.params.id),
      req.user.id,
      JSON.stringify(req.query)
    )
  ),
  getPublicLessonsController
);

router.get(
  "/lesson/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.lesson(JSON.stringify(req.params.id))),
  getLessonController
);

router.get(
  "/lesson/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.publicLesson(JSON.stringify(req.params.id), req.user.id)
  ),
  getPublicLessonController
);

router.post("/lessons", requireAdmin, generalRateLimit, createLessonController);

router.put(
  "/lessons/:id",
  requireAdmin,
  generalRateLimit,
  updateLessonController
);

router.patch(
  "/lessons/:courseId/fix-order",
  requireAdmin,
  generalRateLimit,
  fixLessonOrderController
);

router.delete(
  "/lessons/:id",
  requireAdmin,
  generalRateLimit,
  deleteLessonController
);

router.post(
  "/lessons/generate/:courseId",
  requireAdmin,
  generalRateLimit,
  generateLessonController
);

export default router;
