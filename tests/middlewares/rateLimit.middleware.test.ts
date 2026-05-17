import { Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  generalRateLimit,
  loginRateLimit,
} from "../../src/middlewares/rateLimit.middleware";
import { apiRateLimit, authRateLimit } from "../../src/config/rateLimit";

jest.mock("../../src/config/rateLimit", () => ({
  apiRateLimit: {
    limit: jest.fn(),
  },

  authRateLimit: {
    limit: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("rateLimit", () => {
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

  describe("generalRateLimit", () => {
    it("should call next when request is allowed", async () => {
      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
        remaining: 10,
        reset: 100,
      });

      const mockRequest = {
        ip: "127.0.0.1",
        headers: {},
      } as unknown as Request;

      await generalRateLimit(mockRequest, mockResponse, mockNext);

      expect(apiRateLimit.limit).toHaveBeenCalledWith("user:127.0.0.1");

      expect(mockNext).toHaveBeenCalled();

      expect(mockStatus).not.toHaveBeenCalled();
    });

    it("should return 429 when rate limit exceeded", async () => {
      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: 120,
      });

      const mockRequest = {
        ip: "127.0.0.1",
        headers: {},
      } as unknown as Request;

      await generalRateLimit(mockRequest, mockResponse, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(429);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Too many requests",
        remaining: 0,
        reset: 120,
      });

      expect(logger.error).toHaveBeenCalledWith("Too many requests", {
        remaining: 0,
        reset: 120,
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should use x-forwarded-for header when ip is missing", async () => {
      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      const mockRequest = {
        headers: {
          "x-forwarded-for": "192.168.1.1",
        },
      } as unknown as Request;

      await generalRateLimit(mockRequest, mockResponse, mockNext);

      expect(apiRateLimit.limit).toHaveBeenCalledWith("user:192.168.1.1");
    });

    it("should fallback to anonymous identifier", async () => {
      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      const mockRequest = {
        headers: {},
      } as unknown as Request;

      await generalRateLimit(mockRequest, mockResponse, mockNext);

      expect(apiRateLimit.limit).toHaveBeenCalledWith("user:anonymous");
    });
  });

  describe("loginRateLimit", () => {
    it("should call next when login request is allowed", async () => {
      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      const mockRequest = {
        ip: "127.0.0.1",
        headers: {},
      } as unknown as Request;

      await loginRateLimit(mockRequest, mockResponse, mockNext);

      expect(authRateLimit.limit).toHaveBeenCalledWith("user:127.0.0.1");

      expect(mockNext).toHaveBeenCalled();

      expect(mockStatus).not.toHaveBeenCalled();
    });

    it("should return 429 when auth limit exceeded", async () => {
      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: false,
      });

      const mockRequest = {
        ip: "127.0.0.1",
        headers: {},
      } as unknown as Request;

      await loginRateLimit(mockRequest, mockResponse, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(429);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Too many auth attempts",
      });

      expect(logger.error).toHaveBeenCalledWith("Too many auth attempts");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should use forwarded ip for auth limiter", async () => {
      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      const mockRequest = {
        headers: {
          "x-forwarded-for": "10.0.0.1",
        },
      } as unknown as Request;

      await loginRateLimit(mockRequest, mockResponse, mockNext);

      expect(authRateLimit.limit).toHaveBeenCalledWith("user:10.0.0.1");
    });

    it("should fallback to anonymous for auth limiter", async () => {
      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      const mockRequest = {
        headers: {},
      } as unknown as Request;

      await loginRateLimit(mockRequest, mockResponse, mockNext);

      expect(authRateLimit.limit).toHaveBeenCalledWith("user:anonymous");
    });
  });
});
