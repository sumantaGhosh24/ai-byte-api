import { Router } from "express";

import {
  getAllBookmarksController,
  getBookmarkController,
  createBookmarkController,
  deleteBookmarkController,
} from "../controllers/bookmark.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { redisKeys } from "../utils/redisKeys";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = Router();

router.get(
  "/bookmarks/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req =>
    redisKeys.bookmarks(
      JSON.stringify(req.params.id),
      JSON.stringify(req.query)
    )
  ),
  getAllBookmarksController
);

router.get(
  "/bookmark/:id",
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.bookmark(JSON.stringify(req.params.id))),
  getBookmarkController
);

router.post(
  "/bookmarks/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  createBookmarkController
);

router.delete(
  "/bookmarks/:id",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  deleteBookmarkController
);

export default router;
