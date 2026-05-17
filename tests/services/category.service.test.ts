import { logger } from "@sentry/node";

import {
  getAllCategoriesService,
  getPaginatedCategoriesService,
  getCategoryService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../../src/services/category.service";
import { db } from "../../src/db";
import { categories } from "../../src/db/schema";

jest.mock("drizzle-orm", () => ({
  and: jest.fn(),
  eq: jest.fn(),
  ilike: jest.fn(),
  sql: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../../src/db", () => {
  const mockReturning = jest.fn();

  const mockWhere = jest.fn(() => ({
    returning: mockReturning,
  }));

  const mockSet = jest.fn(() => ({
    where: mockWhere,
  }));

  const mockValues = jest.fn(() => ({
    returning: mockReturning,
  }));

  const mockInsert = jest.fn(() => ({
    values: mockValues,
  }));

  const mockDeleteWhere = jest.fn(() => ({
    returning: mockReturning,
  }));

  const mockDelete = jest.fn(() => ({
    where: mockDeleteWhere,
  }));

  const mockSelectWhere = jest.fn();

  const mockFrom = jest.fn(() => ({
    where: mockSelectWhere,
  }));

  return {
    db: {
      query: {
        categories: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
      },
      select: jest.fn(() => ({
        from: mockFrom,
      })),
      insert: mockInsert,
      update: jest.fn(() => ({
        set: mockSet,
      })),
      delete: mockDelete,
    },
    mockReturning,
    mockSet,
    mockValues,
    mockInsert,
    mockDelete,
    mockSelectWhere,
  };
});

jest.mock("../../src/db/schema", () => ({
  categories: {
    id: "id",
    name: "name",
    createdAt: "createdAt",
  },
}));

const {
  mockReturning,
  mockSet,
  mockValues,
  mockInsert,
  mockDelete,
  mockSelectWhere,
} = jest.requireMock("../../src/db") as {
  mockReturning: jest.Mock;
  mockSet: jest.Mock;
  mockValues: jest.Mock;
  mockInsert: jest.Mock;
  mockDelete: jest.Mock;
  mockSelectWhere: jest.Mock;
};

describe("Category Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCategoriesService", () => {
    it("should return all categories", async () => {
      const categoriesData = [
        {
          id: "1",
          name: "technology",
        },
      ];

      (db.query.categories.findMany as jest.Mock).mockResolvedValue(
        categoriesData
      );

      const result = await getAllCategoriesService();

      expect(db.query.categories.findMany).toHaveBeenCalled();

      expect(result).toEqual(categoriesData);
    });

    it("should throw when fetching categories fails", async () => {
      (db.query.categories.findMany as jest.Mock).mockRejectedValue(
        new Error("Fetch failed")
      );

      await expect(getAllCategoriesService()).rejects.toThrow("Fetch failed");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("getPaginatedCategoriesService", () => {
    it("should return paginated categories", async () => {
      const categoriesData = [
        {
          id: "1",
          name: "technology",
        },
      ];

      (db.query.categories.findMany as jest.Mock).mockResolvedValue(
        categoriesData
      );

      mockSelectWhere.mockResolvedValue([
        {
          count: 1,
        },
      ]);

      const result = await getPaginatedCategoriesService({
        page: 1,
        limit: 10,
        search: "tech",
      });

      expect(db.query.categories.findMany).toHaveBeenCalled();

      expect(result).toEqual({
        items: categoriesData,
        paginations: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });
    });

    it("should return hasMore true when more data exists", async () => {
      const categoriesData = [
        {
          id: "1",
          name: "technology",
        },
      ];

      (db.query.categories.findMany as jest.Mock).mockResolvedValue(
        categoriesData
      );

      mockSelectWhere.mockResolvedValue([
        {
          count: 20,
        },
      ]);

      const result = await getPaginatedCategoriesService({
        page: 1,
        limit: 10,
      });

      expect(result.paginations.hasMore).toBe(true);
    });

    it("should throw when pagination fails", async () => {
      (db.query.categories.findMany as jest.Mock).mockRejectedValue(
        new Error("Pagination failed")
      );

      await expect(
        getPaginatedCategoriesService({
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Pagination failed");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("getCategoryService", () => {
    it("should return category", async () => {
      const category = {
        id: "1",
        name: "technology",
      };

      (db.query.categories.findFirst as jest.Mock).mockResolvedValue(category);

      const result = await getCategoryService("category_1");

      expect(result).toEqual(category);
    });

    it("should throw when category not found", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getCategoryService("category_1")).rejects.toThrow(
        "Category not found"
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("createCategoryService", () => {
    it("should create category successfully", async () => {
      const createdCategory = {
        id: "1",
        name: "technology",
      };

      mockReturning.mockResolvedValue([createdCategory]);

      const result = await createCategoryService({
        name: "Technology",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "image_123",
      });

      expect(mockInsert).toHaveBeenCalledWith(categories);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "technology",
          imageUrl: "https://example.com/image.png",
          imagePublicId: "image_123",
        })
      );

      expect(result).toEqual(createdCategory);
    });

    it("should throw when create fails", async () => {
      mockReturning.mockRejectedValue(new Error("Create failed"));

      await expect(
        createCategoryService({
          name: "Technology",
        })
      ).rejects.toThrow("Create failed");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("updateCategoryService", () => {
    it("should update category successfully", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
      });

      const updatedCategory = {
        id: "1",
        name: "updated technology",
      };

      mockReturning.mockResolvedValue([updatedCategory]);

      const result = await updateCategoryService({
        id: "category_1",
        name: "Updated Technology",
        imageUrl: "https://example.com/image.png",
      });

      expect(db.update).toHaveBeenCalledWith(categories);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "updated technology",
          imageUrl: "https://example.com/image.png",
        })
      );

      expect(result).toEqual(updatedCategory);
    });

    it("should throw when category does not exist", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        updateCategoryService({
          id: "category_1",
        })
      ).rejects.toThrow("Category not found");

      expect(logger.error).toHaveBeenCalled();
    });

    it("should throw when update fails", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
      });

      mockReturning.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateCategoryService({
          id: "category_1",
          name: "Updated Technology",
        })
      ).rejects.toThrow("Update failed");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("deleteCategoryService", () => {
    it("should delete category successfully", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
      });

      const deletedCategory = {
        id: "1",
        name: "technology",
      };

      mockReturning.mockResolvedValue([deletedCategory]);

      const result = await deleteCategoryService("category_1");

      expect(mockDelete).toHaveBeenCalledWith(categories);

      expect(result).toEqual(deletedCategory);
    });

    it("should throw when category does not exist", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(deleteCategoryService("category_1")).rejects.toThrow(
        "Category not found"
      );

      expect(logger.error).toHaveBeenCalled();
    });

    it("should throw when delete fails", async () => {
      (db.query.categories.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
      });

      mockReturning.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteCategoryService("category_1")).rejects.toThrow(
        "Delete failed"
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
