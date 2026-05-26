import { Router } from "express";

import {
  createEnrollController,
  deleteEnrollController,
  getAllEnrollsController,
  updateEnrollController,
  getEnrollController,
} from "../controllers/enroll.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = Router();

router.get(
  "/enrolls/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.enrolls(JSON.stringify(req.params.id), JSON.stringify(req.query))
  ),
  getAllEnrollsController
);

router.get(
  "/enroll/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.enroll(JSON.stringify(req.params.id))),
  getEnrollController
);

router.post(
  "/enrolls/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createEnrollController
);

router.put(
  "/enrolls/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  updateEnrollController
);

router.delete(
  "/enrolls/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  deleteEnrollController
);

export default router;
