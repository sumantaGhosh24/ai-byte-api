import { Request, Response, NextFunction } from "express";
import { slidingWindow } from "@arcjet/node";
import * as Sentry from "@sentry/node";

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
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  let mockProtect: jest.Mock;

  beforeEach(() => {
    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    mockProtect = jest.fn();

    (aj.withRule as jest.Mock).mockReturnValue({
      protect: mockProtect,
    });

    jest.clearAllMocks();
  });

  it("should call next when request is allowed", async () => {
    mockProtect.mockResolvedValue({
      isDenied: () => false,
    });

    await securityMiddleware(req as Request, res as Response, next);

    expect(slidingWindow).toHaveBeenCalledWith({
      mode: "LIVE",
      interval: "1m",
      max: 100,
    });

    expect(next).toHaveBeenCalled();

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block bot requests", async () => {
    mockProtect.mockResolvedValue({
      isDenied: () => true,
      reason: {
        isBot: () => true,
        isShield: () => false,
        isRateLimit: () => false,
      },
    });

    await securityMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Automated requests are not allowed",
    });

    expect(next).not.toHaveBeenCalled();

    expect(Sentry.logger.error).toHaveBeenCalled();
  });

  it("should block shield requests", async () => {
    mockProtect.mockResolvedValue({
      isDenied: () => true,
      reason: {
        isBot: () => false,
        isShield: () => true,
        isRateLimit: () => false,
      },
    });

    await securityMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Request blocked by security policy",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should block rate limited requests", async () => {
    mockProtect.mockResolvedValue({
      isDenied: () => true,
      reason: {
        isBot: () => false,
        isShield: () => false,
        isRateLimit: () => true,
      },
    });

    await securityMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Too many requests",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 when middleware throws error", async () => {
    mockProtect.mockRejectedValue(new Error("Security middleware failed"));

    await securityMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      message: "Something went wrong with security middleware",
    });

    expect(next).not.toHaveBeenCalled();

    expect(Sentry.logger.error).toHaveBeenCalled();
  });
});
