import { Router } from "express";
import { getAuth } from "@clerk/express";

import {
  getProfileController,
  updateProfileController,
  updatePreferencesController,
  getPublicProfileController,
} from "../controllers/profile.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";

const router = Router();

router.get(
  "/profile/:id",
  requireAuth,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.publicProfile(JSON.stringify(req.params.id))
  ),
  getPublicProfileController
);

router.get(
  "/profile",
  requireAuth,
  generalRateLimit,
  cacheMiddleware(req => {
    const { userId } = getAuth(req);

    return redisKeys.profile(String(userId));
  }),
  getProfileController
);

router.patch(
  "/profile",
  requireAuth,
  generalRateLimit,
  updateProfileController
);

router.patch(
  "/profile/preferences",
  requireAuth,
  generalRateLimit,
  updatePreferencesController
);

export default router;
