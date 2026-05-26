import { Router } from "express";

import {
  getAllQuestionsController,
  getQuestionController,
  createQuestionController,
  updateQuestionController,
  deleteQuestionController,
  getPublicQuestionsController,
  getPublicQuestionController,
} from "../controllers/question.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/questions/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.allQuestions(
      JSON.stringify(req.params.id),
      JSON.stringify(req.query)
    )
  ),
  getAllQuestionsController
);

router.get(
  "/questions/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.questions(
      JSON.stringify(req.params.id),
      JSON.stringify(req.query)
    )
  ),
  getPublicQuestionsController
);

router.get(
  "/question/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.question(JSON.stringify(req.params.id))),
  getQuestionController
);

router.get(
  "/question/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.publicQuestion(JSON.stringify(req.params.id))
  ),
  getPublicQuestionController
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
