import type { Request, Response } from "express";

import {
  getAllCategoriesController,
  getPaginatedCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../../src/controllers/category.controller";
import {
  getAllCategoriesService,
  getPaginatedCategoriesService,
  getCategoryService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../../src/services/category.service";
import {
  setCache,
  getKeys,
  deleteManyCache,
  deleteCache,
} from "../../src/utils/cache";

jest.mock("@sentry/node", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../src/services/category.service", () => ({
  getAllCategoriesService: jest.fn(),
  getPaginatedCategoriesService: jest.fn(),
  getCategoryService: jest.fn(),
  createCategoryService: jest.fn(),
  updateCategoryService: jest.fn(),
  deleteCategoryService: jest.fn(),
}));

jest.mock("../../src/utils/cache", () => ({
  setCache: jest.fn(),
  getKeys: jest.fn(),
  deleteManyCache: jest.fn(),
  deleteCache: jest.fn(),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    categories: "categories-cache-key",
    pCategories: jest.fn((query: string) => `categories-paginated:${query}`),
    category: jest.fn((id: string) => `category:${id}`),
  },
}));

describe("Category Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("getAllCategoriesController", () => {
    it("should return all categories", async () => {
      const categories = [
        {
          id: "1",
          name: "Programming",
        },
      ];

      (getAllCategoriesService as jest.Mock).mockResolvedValue(categories);

      await getAllCategoriesController(req as Request, res as Response);

      expect(getAllCategoriesService).toHaveBeenCalled();

      expect(setCache).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        categories,
      });
    });

    it("should handle errors", async () => {
      (getAllCategoriesService as jest.Mock).mockRejectedValue(
        new Error("Failed")
      );

      await getAllCategoriesController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed",
      });
    });
  });

  describe("getPaginatedCategoriesController", () => {
    it("should return paginated categories", async () => {
      req.query = {
        page: "1",
        limit: "10",
      };

      const result = {
        items: [],
        paginations: {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false,
        },
      };

      (getPaginatedCategoriesService as jest.Mock).mockResolvedValue(result);

      await getPaginatedCategoriesController(req as Request, res as Response);

      expect(getPaginatedCategoriesService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        result,
      });
    });
  });

  describe("getCategoryController", () => {
    it("should return a category", async () => {
      req.params = {
        id: "category-1",
      };

      const category = {
        id: "category-1",
        name: "Programming",
      };

      (getCategoryService as jest.Mock).mockResolvedValue(category);

      await getCategoryController(req as Request, res as Response);

      expect(getCategoryService).toHaveBeenCalledWith("category-1");

      expect(setCache).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return validation error", async () => {
      req.params = {
        id: "",
      };

      await getCategoryController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("createCategoryController", () => {
    it("should create a category", async () => {
      req.body = {
        name: "Programming",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "public-id",
        visibility: "public",
      };

      const category = {
        id: "category-1",
        ...req.body,
      };

      (createCategoryService as jest.Mock).mockResolvedValue(category);

      (getKeys as jest.Mock).mockResolvedValue(["categories-paginated:1"]);

      await createCategoryController(req as Request, res as Response);

      expect(createCategoryService).toHaveBeenCalled();

      expect(deleteManyCache).toHaveBeenCalled();

      expect(deleteCache).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return validation error", async () => {
      req.body = {};

      await createCategoryController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateCategoryController", () => {
    it("should update a category", async () => {
      req.params = {
        id: "category-1",
      };

      req.body = {
        name: "Updated Category",
      };

      const category = {
        id: "category-1",
        name: "Updated Category",
      };

      (updateCategoryService as jest.Mock).mockResolvedValue(category);

      (getKeys as jest.Mock).mockResolvedValue(["categories-paginated:1"]);

      await updateCategoryController(req as Request, res as Response);

      expect(updateCategoryService).toHaveBeenCalled();

      expect(deleteManyCache).toHaveBeenCalled();

      expect(deleteCache).toHaveBeenCalledTimes(2);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return validation error for invalid id", async () => {
      req.params = {
        id: "",
      };

      await updateCategoryController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteCategoryController", () => {
    it("should delete a category", async () => {
      req.params = {
        id: "category-1",
      };

      const category = {
        id: "category-1",
      };

      (deleteCategoryService as jest.Mock).mockResolvedValue(category);

      (getKeys as jest.Mock).mockResolvedValue(["categories-paginated:1"]);

      await deleteCategoryController(req as Request, res as Response);

      expect(deleteCategoryService).toHaveBeenCalledWith("category-1");

      expect(deleteManyCache).toHaveBeenCalled();

      expect(deleteCache).toHaveBeenCalledTimes(2);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return validation error", async () => {
      req.params = {
        id: "",
      };

      await deleteCategoryController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
