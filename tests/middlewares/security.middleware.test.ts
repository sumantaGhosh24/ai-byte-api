import { Request, Response } from "express";
import { slidingWindow } from "@arcjet/node";
import { logger } from "@sentry/node";

import securityMiddleware from "../../src/middlewares/security.middleware";
import aj from "../../src/config/arcjet";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));

jest.mock("../../src/config/arcjet", () => ({
  __esModule: true,
  default: {
    withRule: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("securityMiddleware", () => {
  const mockJson = jest.fn();

  const mockStatus = jest.fn(() => ({
    json: mockJson,
  }));

  const mockResponse = {
    status: mockStatus,
  } as unknown as Response;

  const mockNext = jest.fn();

  const mockRequest = {} as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call next when request is allowed", async () => {
    const protect = jest.fn().mockResolvedValue({
      isDenied: () => false,

      reason: {
        isBot: jest.fn(),
        isShield: jest.fn(),
        isRateLimit: jest.fn(),
      },
    });

    (aj.withRule as jest.Mock).mockReturnValue({
      protect,
    });

    await securityMiddleware(mockRequest, mockResponse, mockNext);

    expect(slidingWindow).toHaveBeenCalledWith({
      mode: "LIVE",
      interval: "1m",
      max: 100,
    });

    expect(aj.withRule).toHaveBeenCalled();

    expect(protect).toHaveBeenCalledWith(mockRequest, {
      requested: 5,
    });

    expect(mockNext).toHaveBeenCalled();
  });

  it("should block bot requests", async () => {
    const protect = jest.fn().mockResolvedValue({
      isDenied: () => true,

      reason: {
        isBot: () => true,
        isShield: () => false,
        isRateLimit: () => false,
      },
    });

    (aj.withRule as jest.Mock).mockReturnValue({
      protect,
    });

    await securityMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Automated requests are not allowed",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Bot request blocked",
      expect.any(Object)
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should block shield requests", async () => {
    const protect = jest.fn().mockResolvedValue({
      isDenied: () => true,

      reason: {
        isBot: () => false,
        isShield: () => true,
        isRateLimit: () => false,
      },
    });

    (aj.withRule as jest.Mock).mockReturnValue({
      protect,
    });

    await securityMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Request blocked by security policy",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Shield request blocked",
      expect.any(Object)
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should block rate limit requests", async () => {
    const protect = jest.fn().mockResolvedValue({
      isDenied: () => true,

      reason: {
        isBot: () => false,
        isShield: () => false,
        isRateLimit: () => true,
      },
    });

    (aj.withRule as jest.Mock).mockReturnValue({
      protect,
    });

    await securityMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Too many requests",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Rate limit request blocked",
      expect.any(Object)
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 500 when middleware throws error", async () => {
    (aj.withRule as jest.Mock).mockImplementation(() => {
      throw new Error("Security middleware error");
    });

    await securityMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(500);

    expect(mockJson).toHaveBeenCalledWith({
      error: "Internal server error",
      message: "Something went wrong with security middleware",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Security middleware failed",
      expect.any(Object)
    );

    expect(mockNext).not.toHaveBeenCalled();
  });
});
