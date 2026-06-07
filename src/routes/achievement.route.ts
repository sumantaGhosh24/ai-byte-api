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
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/achievements",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.achievements(JSON.stringify(req.query))),
  getAllAchievementsController
);

router.get(
  "/achievements/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.achievement(JSON.stringify(req.params.id))),
  getAchievementController
);

router.get(
  "/users/:userId/achievements",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.userAchievements(JSON.stringify(req.params.userId))
  ),
  getUserAchievementsController
);

router.post(
  "/achievements",
  requireAdmin,
  generalRateLimit,
  createAchievementController
);

router.put(
  "/achievements/:id",
  requireAdmin,
  generalRateLimit,
  updateAchievementController
);

router.delete(
  "/achievements/:id",
  requireAdmin,
  generalRateLimit,
  deleteAchievementController
);

router.post(
  "/users/achievement",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createUserAchievementController
);

router.delete(
  "/users/achievement",
  requireAdmin,
  generalRateLimit,
  deleteUserAchievementController
);

export default router;
