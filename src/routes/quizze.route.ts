import { Router } from "express";

import {
  getAllQuizzesController,
  getQuizController,
  createQuizController,
  updateQuizController,
  deleteQuizController,
} from "../controllers/quizze.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/quizzes",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.quizzes(JSON.stringify(req.query.courseId))),
  getAllQuizzesController
);

router.get(
  "/quizzes/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.quizze(JSON.stringify(req.params.id))),
  getQuizController
);

router.post(
  "/quizzes",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createQuizController
);

router.put(
  "/quizzes/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateQuizController
);

router.delete(
  "/quizzes/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteQuizController
);

export default router;
