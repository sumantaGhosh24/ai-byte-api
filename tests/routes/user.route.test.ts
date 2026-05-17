import express, { Request, Response, NextFunction } from "express";

import request from "supertest";

const mockCacheMiddleware = jest.fn();

const mockGetUsersController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    users: [],
  });
});

jest.mock("../../src/middlewares/admin.middleware", () => ({
  requireAdmin: (req: Request, res: Response, next: NextFunction) => next(),
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

jest.mock("../../src/controllers/user.controller", () => ({
  getUsersController: (req: Request, res: Response) =>
    mockGetUsersController(req, res),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    users: jest.fn((query: string) => `users:${query}`),
  },
}));

import router from "../../src/routes/user.route";
import { redisKeys } from "../../src/utils/redisKeys";

describe("User Routes", () => {
  const app = express();

  app.use(express.json());

  app.use("/api", router);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return users successfully", async () => {
    const response = await request(app).get("/api/users").expect(200);

    expect(response.body).toEqual({
      success: true,
      users: [],
    });

    expect(mockGetUsersController).toHaveBeenCalled();
  });

  it("should call cache middleware with redis key builder", async () => {
    await request(app).get("/api/users?page=1&limit=10").expect(200);

    expect(mockCacheMiddleware).toHaveBeenCalled();

    const keyBuilder = mockCacheMiddleware.mock.calls[0][0];

    const mockReq = {
      query: {
        page: "1",
        limit: "10",
      },
    };

    keyBuilder(mockReq as unknown as Request);

    expect(redisKeys.users).toHaveBeenCalledWith(JSON.stringify(mockReq.query));
  });

  it("should execute middlewares in route", async () => {
    await request(app).get("/api/users").expect(200);

    expect(mockCacheMiddleware).toHaveBeenCalled();

    expect(mockGetUsersController).toHaveBeenCalledTimes(1);
  });

  it("should support query params", async () => {
    const response = await request(app)
      .get("/api/users?search=john&page=2")
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
