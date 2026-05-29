import { Router } from "express";

import {
  getQuizAttemptController,
  getUserQuizAttemptsController,
  getQuizAttemptsController,
  createQuizAttemptController,
  getUserQuizAllAttemptsController,
} from "../controllers/quizAttempt.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/attempts",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.userQuizAttempts(
      JSON.stringify(req.query.userId),
      JSON.stringify(req.query.quizId),
      JSON.stringify(req.query)
    )
  ),
  getUserQuizAllAttemptsController
);

router.get(
  "/attempts/users/:userId",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.userAttempts(
      JSON.stringify(req.params.userId),
      JSON.stringify(req.query)
    )
  ),
  getUserQuizAttemptsController
);

router.get(
  "/attempts/quiz/:quizId",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.attempts(
      JSON.stringify(req.params.quizId),
      JSON.stringify(req.query)
    )
  ),
  getQuizAttemptsController
);

router.get(
  "/attempts/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.attempt(String(req.params.id))),
  getQuizAttemptController
);

router.post(
  "/quiz-attempts",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createQuizAttemptController
);

export default router;
