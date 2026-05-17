import { Request, Response } from "express";
import { logger } from "@sentry/node";

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
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../../src/utils/cache";
import { formatValidationError } from "../../src/utils/format";
import { redisKeys } from "../../src/utils/redisKeys";

import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../../src/validations/category.validation";

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
  deleteCache: jest.fn(),
  deleteManyCache: jest.fn(),
  getKeys: jest.fn(),
}));

jest.mock("../../src/utils/format", () => ({
  formatValidationError: jest.fn(),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    categories: "categories-key",
    pCategories: jest.fn(),
    category: jest.fn(),
  },
}));

jest.mock("../../src/validations/category.validation", () => ({
  categoryIdSchema: {
    safeParse: jest.fn(),
  },
  createCategorySchema: {
    safeParse: jest.fn(),
  },
  updateCategorySchema: {
    safeParse: jest.fn(),
  },
}));

describe("Category Controllers", () => {
  const mockJson = jest.fn();

  const mockStatus = jest.fn(() => ({
    json: mockJson,
  }));

  const res = {
    json: mockJson,
    status: mockStatus,
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCategoriesController", () => {
    it("should get all categories successfully", async () => {
      const req = {} as Request;

      const categories = [
        {
          id: "1",
          name: "Technology",
        },
      ];

      (getAllCategoriesService as jest.Mock).mockResolvedValue(categories);

      await getAllCategoriesController(req, res);

      expect(logger.info).toHaveBeenCalled();

      expect(getAllCategoriesService).toHaveBeenCalled();

      expect(setCache).toHaveBeenCalledWith("categories-key", {
        success: true,
        categories,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        categories,
      });
    });

    it("should return 500 if service fails", async () => {
      const req = {} as Request;

      (getAllCategoriesService as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch categories")
      );

      await getAllCategoriesController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch categories",
      });
    });
  });

  describe("getPaginatedCategoriesController", () => {
    it("should get paginated categories successfully", async () => {
      const req = {
        query: {
          page: "1",
          limit: "10",
          search: "tech",
        },
      } as unknown as Request;

      const result = {
        data: [],
        total: 0,
      };

      (getPaginatedCategoriesService as jest.Mock).mockResolvedValue(result);

      (redisKeys.pCategories as jest.Mock).mockReturnValue(
        "paginated-categories-key"
      );

      await getPaginatedCategoriesController(req, res);

      expect(getPaginatedCategoriesService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "tech",
      });

      expect(setCache).toHaveBeenCalledWith("paginated-categories-key", {
        success: true,
        result,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        result,
      });
    });

    it("should return 500 if service fails", async () => {
      const req = {
        query: {},
      } as unknown as Request;

      (getPaginatedCategoriesService as jest.Mock).mockRejectedValue(
        new Error("Pagination failed")
      );

      await getPaginatedCategoriesController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Pagination failed",
      });
    });
  });

  describe("getCategoryController", () => {
    it("should get category successfully", async () => {
      const req = {
        params: {
          id: "category_1",
        },
      } as unknown as Request;

      const category = {
        id: "1",
        name: "Technology",
      };

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (getCategoryService as jest.Mock).mockResolvedValue(category);

      (redisKeys.category as jest.Mock).mockReturnValue("category-key");

      await getCategoryController(req, res);

      expect(getCategoryService).toHaveBeenCalledWith("category_1");

      expect(setCache).toHaveBeenCalledWith("category-key", {
        success: true,
        category,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return 400 if validation fails", async () => {
      const req = {
        params: {
          id: "",
        },
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue(
        "Invalid category id"
      );

      await getCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid category id",
      });
    });

    it("should return 500 if service fails", async () => {
      const req = {
        params: {
          id: "category_1",
        },
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (getCategoryService as jest.Mock).mockRejectedValue(
        new Error("Category fetch failed")
      );

      await getCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Category fetch failed",
      });
    });
  });

  describe("createCategoryController", () => {
    it("should create category successfully", async () => {
      const req = {
        body: {
          name: "Technology",
        },
      } as unknown as Request;

      const category = {
        id: "1",
        name: "Technology",
      };

      (createCategorySchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Technology",
          imageUrl: undefined,
          imagePublicId: undefined,
        },
      });

      (createCategoryService as jest.Mock).mockResolvedValue(category);

      (getKeys as jest.Mock).mockResolvedValue(["categories-paginated:1"]);

      await createCategoryController(req, res);

      expect(createCategoryService).toHaveBeenCalledWith({
        name: "Technology",
        imageUrl: undefined,
        imagePublicId: undefined,
      });

      expect(deleteManyCache).toHaveBeenCalledWith(["categories-paginated:1"]);

      expect(deleteCache).toHaveBeenCalledWith("categories-key");

      expect(mockStatus).toHaveBeenCalledWith(201);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return 400 if validation fails", async () => {
      const req = {
        body: {},
      } as unknown as Request;

      (createCategorySchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue(
        "Invalid category data"
      );

      await createCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid category data",
      });
    });

    it("should return 500 if service fails", async () => {
      const req = {
        body: {
          name: "Technology",
        },
      } as unknown as Request;

      (createCategorySchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Technology",
        },
      });

      (createCategoryService as jest.Mock).mockRejectedValue(
        new Error("Create failed")
      );

      await createCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Create failed",
      });
    });
  });

  describe("updateCategoryController", () => {
    it("should update category successfully", async () => {
      const req = {
        params: {
          id: "category_1",
        },
        body: {
          name: "Updated Technology",
        },
      } as unknown as Request;

      const category = {
        id: "1",
        name: "Updated Technology",
      };

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (updateCategorySchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Updated Technology",
          imageUrl: undefined,
          imagePublicId: undefined,
        },
      });

      (updateCategoryService as jest.Mock).mockResolvedValue(category);

      (getKeys as jest.Mock).mockResolvedValue(["categories-paginated:1"]);

      (redisKeys.category as jest.Mock).mockReturnValue("category-key");

      await updateCategoryController(req, res);

      expect(updateCategoryService).toHaveBeenCalledWith({
        id: "category_1",
        name: "Updated Technology",
        imageUrl: undefined,
        imagePublicId: undefined,
      });

      expect(deleteManyCache).toHaveBeenCalledWith(["categories-paginated:1"]);

      expect(deleteCache).toHaveBeenCalledTimes(2);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return 400 if id validation fails", async () => {
      const req = {
        params: {
          id: "",
        },
        body: {},
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue("Invalid id");

      await updateCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid id",
      });
    });

    it("should return 400 if body validation fails", async () => {
      const req = {
        params: {
          id: "category_1",
        },
        body: {},
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (updateCategorySchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue(
        "Invalid update data"
      );

      await updateCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid update data",
      });
    });

    it("should return 500 if update fails", async () => {
      const req = {
        params: {
          id: "category_1",
        },
        body: {
          name: "Updated Technology",
        },
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (updateCategorySchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Updated Technology",
        },
      });

      (updateCategoryService as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      await updateCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Update failed",
      });
    });
  });

  describe("deleteCategoryController", () => {
    it("should delete category successfully", async () => {
      const req = {
        params: {
          id: "category_1",
        },
      } as unknown as Request;

      const category = {
        id: "1",
        name: "Technology",
      };

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (deleteCategoryService as jest.Mock).mockResolvedValue(category);

      (getKeys as jest.Mock).mockResolvedValue(["categories-paginated:1"]);

      (redisKeys.category as jest.Mock).mockReturnValue("category-key");

      await deleteCategoryController(req, res);

      expect(deleteCategoryService).toHaveBeenCalledWith("category_1");

      expect(deleteManyCache).toHaveBeenCalledWith(["categories-paginated:1"]);

      expect(deleteCache).toHaveBeenCalledTimes(2);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        category,
      });
    });

    it("should return 400 if validation fails", async () => {
      const req = {
        params: {
          id: "",
        },
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue(
        "Invalid category id"
      );

      await deleteCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid category id",
      });
    });

    it("should return 500 if delete fails", async () => {
      const req = {
        params: {
          id: "category_1",
        },
      } as unknown as Request;

      (categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "category_1",
        },
      });

      (deleteCategoryService as jest.Mock).mockRejectedValue(
        new Error("Delete failed")
      );

      await deleteCategoryController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Delete failed",
      });
    });
  });
});
