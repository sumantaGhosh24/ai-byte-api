import { logger } from "@sentry/node";

import {
  CategoriesParams,
  CreateCategoryParams,
  UpdateCategoryParams,
} from "../validations/category.validation";
import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/client";

export const getPublicCategoriesService = async () => {
  try {
    return await prisma.category.findMany({
      where: {
        visibility: "public",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    logger.error("Error fetching public categories", { error });

    throw error;
  }
};

export const getAllCategoriesService = async ({
  page = 1,
  limit = 10,
  search,
}: CategoriesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip,
      }),

      prisma.category.count({
        where,
      }),
    ]);

    return {
      data: items,
      paginations: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
        nextPage: skip + items.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    logger.error("Error fetching all categories", { error });

    throw error;
  }
};

export const getCategoryService = async (id: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      logger.error("Category not found");

      throw new Error("NOT_FOUND");
    }

    return category;
  } catch (error) {
    logger.error("Error fetching category", { error });

    throw error;
  }
};

export const createCategoryService = async ({
  name,
  imageUrl,
  imagePublicId,
  visibility,
}: CreateCategoryParams) => {
  try {
    const category = await prisma.category.create({
      data: {
        name: name.toLowerCase(),
        imageUrl,
        imagePublicId,
        visibility,
      },
    });

    return category;
  } catch (error) {
    logger.error("Error creating category", { error });

    throw error;
  }
};

export const updateCategoryService = async ({
  id,
  name,
  imageUrl,
  imagePublicId,
  visibility,
}: UpdateCategoryParams) => {
  try {
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      logger.error("Category not found");

      throw new Error("NOT_FOUND");
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.toLowerCase() } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(imagePublicId !== undefined ? { imagePublicId } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
      },
    });

    return category;
  } catch (error) {
    logger.error("Error updating category", { error });

    throw error;
  }
};

export const deleteCategoryService = async (id: string) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      logger.error("Category not found");

      throw new Error("NOT_FOUND");
    }

    const category = await prisma.category.delete({
      where: { id },
    });

    return category;
  } catch (error) {
    logger.error("Error deleting category", { error });

    throw error;
  }
};
