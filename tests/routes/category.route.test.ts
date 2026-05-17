import express, { Request, Response, NextFunction } from "express";
import request from "supertest";

import router from "../../src/routes/category.route";
import { redisKeys } from "../../src/utils/redisKeys";

const mockCacheMiddleware = jest.fn();

const mockGetAllCategoriesController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      route: "get-all-categories",
    });
  }
);

const mockGetPaginatedCategoriesController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      route: "get-paginated-categories",
    });
  }
);

const mockGetCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    route: "get-category",
  });
});

const mockCreateCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    route: "create-category",
  });
});

const mockUpdateCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    route: "update-category",
  });
});

const mockDeleteCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    route: "delete-category",
  });
});

jest.mock("../../src/middlewares/auth.middleware", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middlewares/admin.middleware", () => ({
  requireAdmin: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middlewares/onboarding.middleware", () => ({
  requireOnboarding: (req: Request, res: Response, next: NextFunction) =>
    next(),
}));

jest.mock("../../src/middlewares/rateLimit.middleware", () => ({
  generalRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
}));

/* eslint-disable indent */
jest.mock("../../src/middlewares/cache.middleware", () => ({
  cacheMiddleware:
    (keyBuilder: (_req: Request) => string) =>
    (req: Request, res: Response, next: NextFunction) => {
      mockCacheMiddleware(keyBuilder);

      next();
    },
}));

jest.mock("../../src/controllers/category.controller", () => ({
  getAllCategoriesController: (req: Request, res: Response) =>
    mockGetAllCategoriesController(req, res),

  getPaginatedCategoriesController: (req: Request, res: Response) =>
    mockGetPaginatedCategoriesController(req, res),

  getCategoryController: (req: Request, res: Response) =>
    mockGetCategoryController(req, res),

  createCategoryController: (req: Request, res: Response) =>
    mockCreateCategoryController(req, res),

  updateCategoryController: (req: Request, res: Response) =>
    mockUpdateCategoryController(req, res),

  deleteCategoryController: (req: Request, res: Response) =>
    mockDeleteCategoryController(req, res),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    categories: "categories",

    pCategories: jest.fn((query: string) => `paginated-categories:${query}`),

    category: jest.fn((id: string) => `category:${id}`),
  },
}));

describe("Category Routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/api", router);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /categories/all", () => {
    it("should return all categories", async () => {
      const response = await request(app)
        .get("/api/categories/all")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "get-all-categories",
      });

      expect(mockGetAllCategoriesController).toHaveBeenCalled();
    });

    it("should call categories cache key builder", async () => {
      await request(app).get("/api/categories/all").expect(200);

      const keyBuilder = mockCacheMiddleware.mock.calls[0][0];

      expect(keyBuilder()).toBe(redisKeys.categories);
    });
  });

  describe("GET /categories", () => {
    it("should return paginated categories", async () => {
      const response = await request(app)
        .get("/api/categories?page=1&limit=10")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "get-paginated-categories",
      });

      expect(mockGetPaginatedCategoriesController).toHaveBeenCalled();
    });

    it("should call paginated categories cache key builder", async () => {
      await request(app).get("/api/categories?page=1&limit=10").expect(200);

      const keyBuilder = mockCacheMiddleware.mock.calls[0][0];

      const mockReq = {
        query: {
          page: "1",
          limit: "10",
        },
      };

      keyBuilder(mockReq as unknown as Request);

      expect(redisKeys.pCategories).toHaveBeenCalledWith(
        JSON.stringify({
          page: "1",
          limit: "10",
        })
      );
    });
  });

  describe("GET /categories/:id", () => {
    it("should return category", async () => {
      const response = await request(app)
        .get("/api/categories/category_1")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "get-category",
      });

      expect(mockGetCategoryController).toHaveBeenCalled();
    });

    it("should call category cache key builder", async () => {
      await request(app).get("/api/categories/category_1").expect(200);

      const keyBuilder = mockCacheMiddleware.mock.calls[0][0];

      const mockReq = {
        params: {
          id: "category_1",
        },
      };

      keyBuilder(mockReq as unknown as Request);

      expect(redisKeys.category).toHaveBeenCalledWith(
        JSON.stringify("category_1")
      );
    });
  });

  describe("POST /categories", () => {
    it("should create category", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({
          name: "Technology",
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        route: "create-category",
      });

      expect(mockCreateCategoryController).toHaveBeenCalled();
    });
  });

  describe("PUT /categories/:id", () => {
    it("should update category", async () => {
      const response = await request(app)
        .put("/api/categories/category_1")
        .send({
          name: "Updated Technology",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "update-category",
      });

      expect(mockUpdateCategoryController).toHaveBeenCalled();
    });
  });

  describe("DELETE /categories/:id", () => {
    it("should delete category", async () => {
      const response = await request(app)
        .delete("/api/categories/category_1")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "delete-category",
      });

      expect(mockDeleteCategoryController).toHaveBeenCalled();
    });
  });
});
