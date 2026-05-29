import { Router } from "express";

import {
  getAllQuizzesController,
  getQuizController,
  createQuizController,
  updateQuizController,
  deleteQuizController,
  getPublicQuizzesController,
  getPublicQuizController,
  generateQuizController,
} from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/quizzes/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.allQuizzes(
      JSON.stringify(req.params.id),
      JSON.stringify(req.query)
    )
  ),
  getAllQuizzesController
);

router.get(
  "/quizzes/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.quizzes(JSON.stringify(req.params.id), JSON.stringify(req.query))
  ),
  getPublicQuizzesController
);

router.get(
  "/quiz/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.quiz(JSON.stringify(req.params.id))),
  getQuizController
);

router.get(
  "/quiz/public/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.publicQuiz(JSON.stringify(req.params.id))),
  getPublicQuizController
);

router.post("/quizzes", requireAdmin, generalRateLimit, createQuizController);

router.put(
  "/quizzes/:id",
  requireAdmin,
  generalRateLimit,
  updateQuizController
);

router.delete(
  "/quizzes/:id",
  requireAdmin,
  generalRateLimit,
  deleteQuizController
);

router.post(
  "/quizzes/generate/:courseId",
  requireAdmin,
  generalRateLimit,
  generateQuizController
);

export default router;
