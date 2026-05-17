import { and, eq, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { categories } from "../db/schema";

export const getAllCategoriesService = async () => {
  try {
    const categories = await db.query.categories.findMany();

    return categories;
  } catch (error) {
    logger.error("Error fetching all categories", { error });

    throw error;
  }
};

interface GetPaginatedCategoriesParams {
  page: number;
  limit: number;
  search?: string;
}

export const getPaginatedCategoriesService = async ({
  page,
  limit,
  search,
}: GetPaginatedCategoriesParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [];
    if (search) {
      filters.push(ilike(categories.name, `%${search}%`));
    }
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.categories.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (categories, { desc }) => [desc(categories.createdAt)],
    });

    const total = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(categories)
      .where(whereClause);

    return {
      items: data,
      paginations: {
        page,
        limit,
        total: Number(total[0]?.count || 0),
        hasMore: offset + data.length < Number(total[0]?.count || 0),
      },
    };
  } catch (error) {
    logger.error("Error fetching paginated categories", { error });

    throw error;
  }
};

export const getCategoryService = async (id: string) => {
  try {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      logger.error("Category not found");

      throw new Error("Category not found");
    }

    return category;
  } catch (error) {
    logger.error("Error fetching category", { error });

    throw error;
  }
};

interface CreateCategoryParams {
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export const createCategoryService = async ({
  name,
  imageUrl,
  imagePublicId,
}: CreateCategoryParams) => {
  try {
    const [row] = await db
      .insert(categories)
      .values({
        name: name.toLowerCase(),
        imageUrl,
        imagePublicId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating category", { error });

    throw error;
  }
};

interface UpdateCategoryParams {
  id: string;
  name?: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export const updateCategoryService = async ({
  id,
  name,
  imageUrl,
  imagePublicId,
}: UpdateCategoryParams) => {
  try {
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      logger.error("Category not found");

      throw new Error("Category not found");
    }

    const [category] = await db
      .update(categories)
      .set({
        ...(name !== undefined ? { name: name.toLowerCase() } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(imagePublicId !== undefined ? { imagePublicId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return category;
  } catch (error) {
    logger.error("Error updating category", { error });

    throw error;
  }
};

export const deleteCategoryService = async (id: string) => {
  try {
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      logger.error("Category not found");

      throw new Error("Category not found");
    }

    const [category] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return category;
  } catch (error) {
    logger.error("Error deleting category", { error });

    throw error;
  }
};
