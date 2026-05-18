import { Router } from "express";

import {
  getAllQuizAttemptsController,
  getQuizAttemptController,
  createQuizAttemptController,
  updateQuizAttemptController,
  deleteQuizAttemptController,
} from "../controllers/quizzeAttempt.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/quiz-attempts",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(
    req =>
      redisKeys.quizAttempts(
        String(req.query.userId ?? "all"),
        String(req.query.quizId ?? "all")
      ) +
      ":" +
      JSON.stringify(req.query)
  ),
  getAllQuizAttemptsController
);

router.get(
  "/quiz-attempts/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.quizAttempt(String(req.params.id))),
  getQuizAttemptController
);

router.post(
  "/quiz-attempts",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createQuizAttemptController
);

router.put(
  "/quiz-attempts/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateQuizAttemptController
);

router.delete(
  "/quiz-attempts/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteQuizAttemptController
);

export default router;
