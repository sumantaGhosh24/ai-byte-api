import {
  getAllCategoriesService,
  getPaginatedCategoriesService,
  getCategoryService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../../src/services/category.service";
import { db } from "../../src/db";

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../../src/db", () => {
  const mockFindMany = jest.fn();
  const mockFindFirst = jest.fn();

  const mockWhere = jest.fn();

  const mockFrom = jest.fn(() => ({
    where: mockWhere,
  }));

  const mockSelect = jest.fn(() => ({
    from: mockFrom,
  }));

  const mockReturningInsert = jest.fn();

  const mockValues = jest.fn(() => ({
    returning: mockReturningInsert,
  }));

  const mockInsert = jest.fn(() => ({
    values: mockValues,
  }));

  const mockReturningUpdate = jest.fn();

  const mockUpdateWhere = jest.fn(() => ({
    returning: mockReturningUpdate,
  }));

  const mockSet = jest.fn(() => ({
    where: mockUpdateWhere,
  }));

  const mockUpdate = jest.fn(() => ({
    set: mockSet,
  }));

  const mockReturningDelete = jest.fn();

  const mockDeleteWhere = jest.fn(() => ({
    returning: mockReturningDelete,
  }));

  const mockDelete = jest.fn(() => ({
    where: mockDeleteWhere,
  }));

  return {
    db: {
      query: {
        categories: {
          findMany: mockFindMany,
          findFirst: mockFindFirst,
        },
      },

      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
});

describe("Category Service", () => {
  let mockFindMany: jest.Mock;
  let mockFindFirst: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFindMany = db.query.categories.findMany as jest.Mock;
    mockFindFirst = db.query.categories.findFirst as jest.Mock;
    mockSelect = db.select as jest.Mock;
    mockInsert = db.insert as jest.Mock;
    mockUpdate = db.update as jest.Mock;
    mockDelete = db.delete as jest.Mock;
  });

  describe("getAllCategoriesService", () => {
    it("should return all public categories", async () => {
      const categories = [
        {
          id: "1",
          name: "Programming",
        },
      ];

      mockFindMany.mockResolvedValue(categories);

      const result = await getAllCategoriesService();

      expect(mockFindMany).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });

    it("should throw error", async () => {
      mockFindMany.mockRejectedValue(new Error("Database error"));

      await expect(getAllCategoriesService()).rejects.toThrow("Database error");
    });
  });

  describe("getPaginatedCategoriesService", () => {
    it("should return paginated categories", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "1",
          name: "Programming",
        },
      ]);

      const mockCountWhere = jest.fn().mockResolvedValue([
        {
          count: 1,
        },
      ]);

      const mockCountFrom = jest.fn(() => ({
        where: mockCountWhere,
      }));

      mockSelect.mockReturnValue({
        from: mockCountFrom,
      });

      const result = await getPaginatedCategoriesService({
        page: 1,
        limit: 10,
      });

      expect(mockFindMany).toHaveBeenCalled();

      expect(result).toEqual({
        items: [
          {
            id: "1",
            name: "Programming",
          },
        ],
        paginations: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });
    });

    it("should throw error", async () => {
      mockFindMany.mockRejectedValue(new Error("Database error"));

      await expect(
        getPaginatedCategoriesService({
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Database error");
    });
  });

  describe("getCategoryService", () => {
    it("should return category", async () => {
      const category = {
        id: "category-1",
        name: "Programming",
      };

      mockFindFirst.mockResolvedValue(category);

      const result = await getCategoryService("category-1");

      expect(mockFindFirst).toHaveBeenCalled();
      expect(result).toEqual(category);
    });

    it("should throw if category not found", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(getCategoryService("category-1")).rejects.toThrow(
        "Category not found"
      );
    });
  });

  describe("createCategoryService", () => {
    it("should create category", async () => {
      const createdCategory = {
        id: "category-1",
        name: "programming",
      };

      const mockReturningInsert = jest
        .fn()
        .mockResolvedValue([createdCategory]);

      const mockValues = jest.fn(() => ({
        returning: mockReturningInsert,
      }));

      mockInsert.mockReturnValue({
        values: mockValues,
      });

      const result = await createCategoryService({
        name: "Programming",
        visibility: "public",
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(createdCategory);
    });

    it("should throw create error", async () => {
      const mockReturningInsert = jest
        .fn()
        .mockRejectedValue(new Error("Create failed"));

      const mockValues = jest.fn(() => ({
        returning: mockReturningInsert,
      }));

      mockInsert.mockReturnValue({
        values: mockValues,
      });

      await expect(
        createCategoryService({
          name: "Programming",
          visibility: "public",
        })
      ).rejects.toThrow("Create failed");
    });
  });

  describe("updateCategoryService", () => {
    it("should update category", async () => {
      mockFindFirst.mockResolvedValue({
        id: "category-1",
      });

      const updatedCategory = {
        id: "category-1",
        name: "updated",
      };

      const mockReturningUpdate = jest
        .fn()
        .mockResolvedValue([updatedCategory]);

      const mockWhere = jest.fn(() => ({
        returning: mockReturningUpdate,
      }));

      const mockSet = jest.fn(() => ({
        where: mockWhere,
      }));

      mockUpdate.mockReturnValue({
        set: mockSet,
      });

      const result = await updateCategoryService({
        id: "category-1",
        name: "Updated",
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updatedCategory);
    });

    it("should throw if category not found", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(
        updateCategoryService({
          id: "category-1",
          name: "Updated",
        })
      ).rejects.toThrow("Category not found");
    });
  });

  describe("deleteCategoryService", () => {
    it("should delete category", async () => {
      mockFindFirst.mockResolvedValue({
        id: "category-1",
      });

      const deletedCategory = {
        id: "category-1",
      };

      const mockReturningDelete = jest
        .fn()
        .mockResolvedValue([deletedCategory]);

      const mockWhere = jest.fn(() => ({
        returning: mockReturningDelete,
      }));

      mockDelete.mockReturnValue({
        where: mockWhere,
      });

      const result = await deleteCategoryService("category-1");

      expect(mockDelete).toHaveBeenCalled();
      expect(result).toEqual(deletedCategory);
    });

    it("should throw if category not found", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(deleteCategoryService("category-1")).rejects.toThrow(
        "Category not found"
      );
    });
  });
});
