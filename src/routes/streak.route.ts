import { Router } from "express";

import {
  getUserStreakController,
  checkInStreakController,
} from "../controllers/streak.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get("/streak", requireAuth, generalRateLimit, getUserStreakController);

router.patch(
  "/streak/check-in",
  requireAuth,
  generalRateLimit,
  checkInStreakController
);

export default router;
