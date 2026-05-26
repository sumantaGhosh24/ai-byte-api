import { Router } from "express";

import {
  getPublicCategoriesController,
  getAllCategoriesController,
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
  "/categories",
  requireAuth,
  generalRateLimit,
  requireOnboarding,
  cacheMiddleware(() => redisKeys.categories),
  getPublicCategoriesController
);

router.get(
  "/admin/categories",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.adminCategories(JSON.stringify(req.query))),
  getAllCategoriesController
);

router.get(
  "/categories/:id",
  requireAdmin,
  generalRateLimit,
  cacheMiddleware(req => redisKeys.category(JSON.stringify(req.params.id))),
  getCategoryController
);

router.post(
  "/categories",
  requireAdmin,
  generalRateLimit,
  createCategoryController
);

router.put(
  "/categories/:id",
  requireAdmin,
  generalRateLimit,
  updateCategoryController
);

router.delete(
  "/categories/:id",
  requireAdmin,
  generalRateLimit,
  deleteCategoryController
);

export default router;
