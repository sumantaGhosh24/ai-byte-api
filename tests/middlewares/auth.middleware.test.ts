import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import * as Sentry from "@sentry/node";

import { verifyClerkToken } from "../../src/middlewares/auth.middleware";

jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("verifyClerkToken Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  it("should return 401 if authorization header is missing", async () => {
    await verifyClerkToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: Missing token",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if authorization header is invalid", async () => {
    req.headers = {
      authorization: "InvalidToken",
    };

    await verifyClerkToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: Missing token",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token payload has no sub", async () => {
    req.headers = {
      authorization: "Bearer fake-token",
    };

    (verifyToken as jest.Mock).mockResolvedValue({});

    await verifyClerkToken(req as Request, res as Response, next);

    expect(verifyToken).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: Invalid token",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if token is valid", async () => {
    req.headers = {
      authorization: "Bearer valid-token",
    };

    (verifyToken as jest.Mock).mockResolvedValue({
      sub: "user_123",
    });

    await verifyClerkToken(req as Request, res as Response, next);

    expect(verifyToken).toHaveBeenCalledWith("valid-token", expect.any(Object));

    expect(next).toHaveBeenCalled();

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 if verifyToken throws error", async () => {
    req.headers = {
      authorization: "Bearer invalid-token",
    };

    (verifyToken as jest.Mock).mockRejectedValue(
      new Error("Token verification failed")
    );

    await verifyClerkToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: Token verification failed",
    });

    expect(next).not.toHaveBeenCalled();

    expect(Sentry.logger.error).toHaveBeenCalled();
  });
});
