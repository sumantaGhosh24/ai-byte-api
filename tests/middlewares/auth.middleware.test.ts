import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import { requireAuth } from "../../src/middlewares/auth.middleware";

jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("requireAuth", () => {
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

  it("should call next when user is authenticated", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    await requireAuth(mockRequest, mockResponse, mockNext);

    expect(getAuth).toHaveBeenCalledWith(mockRequest);

    expect(mockNext).toHaveBeenCalled();

    expect(mockStatus).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null,
    });

    await requireAuth(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(401);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "User not authenticated",
    });

    expect(logger.error).toHaveBeenCalledWith("Unauthenticated", {
      reason: "User not authenticated",
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when userId is missing", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: null,
    });

    await requireAuth(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(401);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "User not authenticated",
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when getAuth throws error", async () => {
    const mockError = new Error("Clerk error");

    (getAuth as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await requireAuth(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(401);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: User not authenticated",
    });

    expect(logger.error).toHaveBeenCalledWith("Clerk user not authenticated", {
      reason: "User not authenticated",
      error: mockError,
    });

    expect(mockNext).not.toHaveBeenCalled();
  });
});
