import { Router } from "express";

import {
  createBookmarkController,
  deleteBookmarkController,
  getBookmarksController,
} from "../controllers/bookmark.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/bookmarks",
  requireAuth,
  generalRateLimit,
  createBookmarkController
);

router.delete(
  "/bookmarks",
  requireAuth,
  generalRateLimit,
  deleteBookmarkController
);

router.get("/bookmarks", requireAuth, generalRateLimit, getBookmarksController);

export default router;
