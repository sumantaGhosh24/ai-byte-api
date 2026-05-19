import { Router } from "express";
import {
  getAllAchievementsController,
  getAchievementController,
  createAchievementController,
  updateAchievementController,
  deleteAchievementController,
  getUserAchievementsController,
  createUserAchievementController,
  deleteUserAchievementController,
} from "../controllers/achievement.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get(
  "/achievements",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  getAllAchievementsController
);

router.get(
  "/achievements/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  getAchievementController
);

router.post(
  "/achievements",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createAchievementController
);

router.put(
  "/achievements/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateAchievementController
);

router.delete(
  "/achievements/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteAchievementController
);

router.get(
  "/users/:userId/achievements",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  getUserAchievementsController
);

router.post(
  "/users/achievement",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createUserAchievementController
);

router.delete(
  "/users/achievement",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteUserAchievementController
);

export default router;
