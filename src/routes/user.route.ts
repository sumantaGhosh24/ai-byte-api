import { Router } from "express";

import { requireAdmin } from "../middlewares/admin.middleware";
import { getUsersController } from "../controllers/user.controller";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/users",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.users(JSON.stringify(req.query))),
  getUsersController
);

export default router;
