import { Request, Response, NextFunction } from "express";

import { cacheMiddleware } from "../../src/middlewares/cache.middleware";
import { getCache } from "../../src/utils/cache";

jest.mock("../../src/utils/cache", () => ({
  getCache: jest.fn(),
}));

describe("cacheMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

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

    next = jest.fn();

    jest.clearAllMocks();
  });

  it("should return cached data when cache exists", async () => {
    const mockData = {
      id: 1,
      name: "AIByte",
    };

    (getCache as jest.Mock).mockResolvedValue(mockData);

    const middleware = cacheMiddleware(() => "test-cache-key");

    await middleware(req as Request, res as Response, next);

    expect(getCache).toHaveBeenCalledWith("test-cache-key");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      source: "cache",
      data: mockData,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when cache does not exist", async () => {
    (getCache as jest.Mock).mockResolvedValue(null);

    const middleware = cacheMiddleware(() => "test-cache-key");

    await middleware(req as Request, res as Response, next);

    expect(getCache).toHaveBeenCalledWith("test-cache-key");

    expect(next).toHaveBeenCalled();

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should use dynamic cache key from request", async () => {
    req.params = {
      id: "123",
    };

    (getCache as jest.Mock).mockResolvedValue(null);

    const middleware = cacheMiddleware(req => `user:${req.params.id}`);

    await middleware(req as Request, res as Response, next);

    expect(getCache).toHaveBeenCalledWith("user:123");

    expect(next).toHaveBeenCalled();
  });

  it("should work with query params in keyBuilder", async () => {
    req.query = {
      search: "openai",
    };

    (getCache as jest.Mock).mockResolvedValue(null);

    const middleware = cacheMiddleware(req => `search:${req.query.search}`);

    await middleware(req as Request, res as Response, next);

    expect(getCache).toHaveBeenCalledWith("search:openai");

    expect(next).toHaveBeenCalled();
  });
});
