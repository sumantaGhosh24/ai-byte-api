import { Router } from "express";

import {
  getAllQuestionsController,
  getQuestionController,
  createQuestionController,
  updateQuestionController,
  deleteQuestionController,
} from "../controllers/question.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/questions",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.questions(JSON.stringify(req.query.quizId))),
  getAllQuestionsController
);

router.get(
  "/questions/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.question(JSON.stringify(req.params.id))),
  getQuestionController
);

router.post(
  "/questions",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createQuestionController
);

router.put(
  "/questions/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateQuestionController
);

router.delete(
  "/questions/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteQuestionController
);

export default router;
