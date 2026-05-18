import { Router } from "express";

import { updateProgressController } from "../controllers/progress.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.post(
  "/progress",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  updateProgressController
);

export default router;
