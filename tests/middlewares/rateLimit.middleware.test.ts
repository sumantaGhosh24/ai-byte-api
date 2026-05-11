import { Request, Response, NextFunction } from "express";

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

describe("Rate Limit Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: "127.0.0.1",
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("generalRateLimit", () => {
    it("should call next when rate limit is successful", async () => {
      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
        remaining: 10,
        reset: 1000,
      });

      await generalRateLimit(req as Request, res as Response, next);

      expect(apiRateLimit.limit).toHaveBeenCalledWith("user:127.0.0.1");

      expect(next).toHaveBeenCalled();

      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 429 when rate limit fails", async () => {
      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: 12345,
      });

      await generalRateLimit(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Too many requests",
        remaining: 0,
        reset: 12345,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should use x-forwarded-for when ip is missing", async () => {
      const req = {
        headers: {
          "x-forwarded-for": "192.168.1.1",
        },
      } as Partial<Request>;

      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      await generalRateLimit(req as Request, res as Response, next);

      expect(apiRateLimit.limit).toHaveBeenCalledWith("user:192.168.1.1");

      expect(next).toHaveBeenCalled();
    });

    it("should fallback to anonymous when no identifier exists", async () => {
      const req = {
        headers: {},
      } as Partial<Request>;

      (apiRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      await generalRateLimit(req as Request, res as Response, next);

      expect(apiRateLimit.limit).toHaveBeenCalledWith("user:anonymous");

      expect(next).toHaveBeenCalled();
    });
  });

  describe("loginRateLimit", () => {
    it("should call next when auth rate limit passes", async () => {
      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      await loginRateLimit(req as Request, res as Response, next);

      expect(authRateLimit.limit).toHaveBeenCalledWith("user:127.0.0.1");

      expect(next).toHaveBeenCalled();

      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 429 when auth rate limit fails", async () => {
      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: false,
      });

      await loginRateLimit(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Too many auth attempts",
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should use x-forwarded-for for auth limiter", async () => {
      const req = {
        headers: {
          "x-forwarded-for": "10.0.0.1",
        },
      } as Partial<Request>;

      (authRateLimit.limit as jest.Mock).mockResolvedValue({
        success: true,
      });

      await loginRateLimit(req as Request, res as Response, next);

      expect(authRateLimit.limit).toHaveBeenCalledWith("user:10.0.0.1");

      expect(next).toHaveBeenCalled();
    });
  });
});
