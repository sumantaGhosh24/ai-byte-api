import { Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  getAllCategoriesService,
  getPaginatedCategoriesService,
  getCategoryService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../services/category.service";
import { formatValidationError } from "../utils/format";
import {
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

export const getAllCategoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started fetching all categories");

    const categories = await getAllCategoriesService();

    logger.info("Successfully fetched all categories");

    await setCache(redisKeys.categories, { success: true, categories });

    res.json({ success: true, categories });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getPaginatedCategoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;

    logger.info("Started fetching paginated categories");

    const result = await getPaginatedCategoriesService({ page, limit, search });

    logger.info("Successfully fetched paginated categories");

    await setCache(redisKeys.pCategories(JSON.stringify(req.query)), {
      success: true,
      result,
    });

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getCategoryController = async (req: Request, res: Response) => {
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
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createCategoryController = async (req: Request, res: Response) => {
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

    const { name, imageUrl, imagePublicId } = validationResult.data;

    const category = await createCategoryService({
      name,
      imageUrl,
      imagePublicId,
    });

    logger.info("Successfully created category");

    const keys = await getKeys("categories-paginated:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.categories);

    res.status(201).json({ success: true, category });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateCategoryController = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating category ${req.params.id}`);

    const idValidationResult = categoryIdSchema.safeParse({
      id: req.params.id,
    });

    if (!idValidationResult.success) {
      logger.error("Validation failed to update category (id)", {
        error: formatValidationError(idValidationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(idValidationResult.error),
      });
      return;
    }

    const { id } = idValidationResult.data;

    const validationResult = updateCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update category (body)", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, imageUrl, imagePublicId } = validationResult.data;

    const category = await updateCategoryService({
      id,
      name,
      imageUrl,
      imagePublicId,
    });

    logger.info(`Successfully updated category ${id}`);

    const keys = await getKeys("categories-paginated:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.categories);
    await deleteCache(redisKeys.category(id));

    res.json({ success: true, category });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteCategoryController = async (req: Request, res: Response) => {
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

    const keys = await getKeys("categories-paginated:*");
    if (keys?.length) {
      await deleteManyCache(keys);
    }

    await deleteCache(redisKeys.categories);
    await deleteCache(redisKeys.category(id));

    res.json({ success: true, category });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
