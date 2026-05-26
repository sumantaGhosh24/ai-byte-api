import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  getPublicCategoriesService,
  getAllCategoriesService,
  getCategoryService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../services/category.service";
import { formatValidationError } from "../utils/format";
import {
  categorieSchema,
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getPublicCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching public categories");

    const categories = await getPublicCategoriesService();

    logger.info("Successfully fetched public categories");

    await setCache(redisKeys.categories, { success: true, categories });

    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const getAllCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching all categories");

    const validationResult = categorieSchema.safeParse({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get all categories", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { page, limit, search } = validationResult.data;

    const result = await getAllCategoriesService({ page, limit, search });

    logger.info("Successfully fetched all categories");

    await setCache(
      redisKeys.adminCategories(JSON.stringify(req.query)).replace(/"/g, ""),
      {
        success: true,
        result,
      }
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

export const getCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started fetching category ${req.params.id}`);

    const validationResult = categoryIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to get category", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const category = await getCategoryService(id);

    logger.info(`Successfully fetched category ${id}`);

    await setCache(redisKeys.category(id), { success: true, category });

    res.json({ success: true, category });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started creating category");

    const validationResult = createCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to create category", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, imageUrl, imagePublicId, visibility } = validationResult.data;

    const category = await createCategoryService({
      name,
      imageUrl,
      imagePublicId,
      visibility,
    });

    logger.info("Successfully created category");

    const keys = await getKeys("admin:categories:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.categories);

    res.status(201).json({
      success: true,
      category,
      message: "Category created successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const updateCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started updating category ${req.params.id}`);

    const validationResult = updateCategorySchema.safeParse({
      ...req.body,
      id: req.params.id,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to update category", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id, name, imageUrl, imagePublicId, visibility } =
      validationResult.data;

    const category = await updateCategoryService({
      id,
      name,
      imageUrl,
      imagePublicId,
      visibility,
    });

    logger.info(`Successfully updated category ${id}`);

    const keys = await getKeys("admin:categories:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.categories);
    await deleteCache(redisKeys.category(id));

    res.json({
      success: true,
      category,
      message: "Category updated successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`Started deleting category ${req.params.id}`);

    const validationResult = categoryIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      logger.error("Validation failed to delete category", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const category = await deleteCategoryService(id);

    logger.info(`Successfully deleted category ${id}`);

    const keys = await getKeys("admin:categories:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.categories);
    await deleteCache(redisKeys.category(id));

    res.json({
      success: true,
      category,
      message: "Category deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "NOT_FOUND") {
      res.status(500).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    next(error);
  }
};
