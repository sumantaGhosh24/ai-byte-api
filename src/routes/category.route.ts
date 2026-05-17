import { Router } from "express";

import {
  getAllCategoriesController,
  getPaginatedCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";
import { cacheMiddleware } from "../middlewares/cache.middleware";
import { redisKeys } from "../utils/redisKeys";
import { requireAdmin } from "../middlewares/admin.middleware";
import { requireOnboarding } from "../middlewares/onboarding.middleware";

const router = Router();

router.get(
  "/categories/all",
  requireAuth,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(() => redisKeys.categories),
  getAllCategoriesController
);

router.get(
  "/categories",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.pCategories(JSON.stringify(req.query))),
  getPaginatedCategoriesController
);

router.get(
  "/categories/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.category(JSON.stringify(req.params.id))),
  getCategoryController
);

router.post(
  "/categories",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  createCategoryController
);

router.put(
  "/categories/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  updateCategoryController
);

router.delete(
  "/categories/:id",
  requireAdmin,
  requireOnboarding,
  generalRateLimit,
  deleteCategoryController
);

export default router;
