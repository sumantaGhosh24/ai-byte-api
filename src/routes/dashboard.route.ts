import { Router } from "express";

import { getAdminDashboardController } from "../controllers/dashboard.controller";
import { requireAdmin } from "../middlewares/admin.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/dashboard/admin",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(() => redisKeys.dashboard),
  getAdminDashboardController
);

export default router;
