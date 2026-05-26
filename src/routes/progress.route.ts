import { Router } from "express";

import {
  getAllProgressesController,
  getProgressController,
  updateProgressController,
} from "../controllers/progress.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/progresses/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.progresses(
      JSON.stringify(req.params.id),
      JSON.stringify(req.query)
    )
  ),
  getAllProgressesController
);

router.get(
  "/progress/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.progress(JSON.stringify(req.params.id))),
  getProgressController
);

router.post(
  "/progress",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  updateProgressController
);

export default router;
