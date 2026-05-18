import { Router } from "express";

import {
  getAllAnswerSubmissionsController,
  getAnswerSubmissionController,
  createAnswerSubmissionController,
} from "../controllers/answerSubmission.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/answer-submissions",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(
    req =>
      redisKeys.answerSubmissions(String(req.query.quizAttemptId ?? "all")) +
      ":" +
      JSON.stringify(req.query)
  ),
  getAllAnswerSubmissionsController
);

router.get(
  "/answer-submissions/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.answerSubmission(JSON.stringify(req.params.id))
  ),
  getAnswerSubmissionController
);

router.post(
  "/answer-submissions",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createAnswerSubmissionController
);

export default router;
