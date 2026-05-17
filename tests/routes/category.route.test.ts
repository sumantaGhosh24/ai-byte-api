import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import request from "supertest";

import categoryRoutes from "../../src/routes/category.route";

const mockGetAllCategoriesController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({
      message: "get all categories",
    });
  }
);

const mockGetPaginatedCategoriesController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({
      message: "get paginated categories",
    });
  }
);

const mockGetCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    message: "get category",
  });
});

const mockCreateCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(201).json({
    message: "category created",
  });
});

const mockUpdateCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    message: "category updated",
  });
});

const mockDeleteCategoryController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    message: "category deleted",
  });
});

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

jest.mock("../../src/middlewares/cache.middleware", () => ({
  cacheMiddleware: () => {
    return (req: Request, res: Response, next: NextFunction) => next();
  },
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    categories: "categories-cache-key",

    pCategories: jest.fn((query: string) => `categories:${query}`),

    category: jest.fn((id: string) => `category:${id}`),
  },
}));

describe("Category Routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", categoryRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /categories/all", () => {
    it("should call getAllCategoriesController", async () => {
      const response = await request(app)
        .get("/api/v1/categories/all")
        .expect(200);

      expect(response.body.message).toBe("get all categories");

      expect(mockGetAllCategoriesController).toHaveBeenCalled();
    });
  });

  describe("GET /categories", () => {
    it("should call getPaginatedCategoriesController", async () => {
      const response = await request(app).get("/api/v1/categories").expect(200);

      expect(response.body.message).toBe("get paginated categories");

      expect(mockGetPaginatedCategoriesController).toHaveBeenCalled();
    });
  });

  describe("GET /categories/:id", () => {
    it("should call getCategoryController", async () => {
      const response = await request(app)
        .get("/api/v1/categories/category-1")
        .expect(200);

      expect(response.body.message).toBe("get category");

      expect(mockGetCategoryController).toHaveBeenCalled();
    });
  });

  describe("POST /categories", () => {
    it("should call createCategoryController", async () => {
      const response = await request(app)
        .post("/api/v1/categories")
        .send({
          name: "Programming",
        })
        .expect(201);

      expect(response.body.message).toBe("category created");

      expect(mockCreateCategoryController).toHaveBeenCalled();
    });
  });

  describe("PUT /categories/:id", () => {
    it("should call updateCategoryController", async () => {
      const response = await request(app)
        .put("/api/v1/categories/category-1")
        .send({
          name: "Updated Category",
        })
        .expect(200);

      expect(response.body.message).toBe("category updated");

      expect(mockUpdateCategoryController).toHaveBeenCalled();
    });
  });

  describe("DELETE /categories/:id", () => {
    it("should call deleteCategoryController", async () => {
      const response = await request(app)
        .delete("/api/v1/categories/category-1")
        .expect(200);

      expect(response.body.message).toBe("category deleted");

      expect(mockDeleteCategoryController).toHaveBeenCalled();
    });
  });
});
