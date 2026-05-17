import { Request, Response } from "express";

import { cacheMiddleware } from "../../src/middlewares/cache.middleware";
import { getCache } from "../../src/utils/cache";

jest.mock("../../src/utils/cache", () => ({
  getCache: jest.fn(),
}));

describe("cacheMiddleware", () => {
  const mockJson = jest.fn();

  const mockStatus = jest.fn(() => ({
    json: mockJson,
  }));

  const mockResponse = {
    status: mockStatus,
  } as unknown as Response;

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return cached data when cache exists", async () => {
    (getCache as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: "1",
        name: "John",
      },
    });

    const keyBuilder = jest.fn(() => "users:1");

    const middleware = cacheMiddleware(keyBuilder);

    const mockRequest = {} as unknown as Request;

    await middleware(mockRequest, mockResponse, mockNext);

    expect(keyBuilder).toHaveBeenCalledWith(mockRequest);

    expect(getCache).toHaveBeenCalledWith("users:1");

    expect(mockStatus).toHaveBeenCalledWith(200);

    expect(mockJson).toHaveBeenCalledWith({
      source: "cache",
      success: true,
      data: {
        id: "1",
        name: "John",
      },
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next when cache does not exist", async () => {
    (getCache as jest.Mock).mockResolvedValue(null);

    const keyBuilder = jest.fn(() => "users:1");

    const middleware = cacheMiddleware(keyBuilder);

    const mockRequest = {} as unknown as Request;

    await middleware(mockRequest, mockResponse, mockNext);

    expect(keyBuilder).toHaveBeenCalledWith(mockRequest);

    expect(getCache).toHaveBeenCalledWith("users:1");

    expect(mockNext).toHaveBeenCalled();

    expect(mockStatus).not.toHaveBeenCalled();
  });

  it("should use request object in key builder", async () => {
    (getCache as jest.Mock).mockResolvedValue(null);

    const keyBuilder = jest.fn((req: Request) => `profile:${req.params.id}`);

    const middleware = cacheMiddleware(keyBuilder);

    const mockRequest = {
      params: {
        id: "123",
      },
    };

    await middleware(mockRequest as unknown as Request, mockResponse, mockNext);

    expect(keyBuilder).toHaveBeenCalledWith(mockRequest);

    expect(getCache).toHaveBeenCalledWith("profile:123");

    expect(mockNext).toHaveBeenCalled();
  });
});
