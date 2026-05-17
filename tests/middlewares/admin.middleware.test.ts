import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import { requireAdmin } from "../../src/middlewares/admin.middleware";
import { getLocalUser } from "../../src/utils/users";

jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../../src/utils/users", () => ({
  getLocalUser: jest.fn(),
}));

describe("requireAdmin", () => {
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

  it("should call next when user is admin", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockResolvedValue({
      id: "1",
      isAdmin: true,
    });

    await requireAdmin(mockRequest, mockResponse, mockNext);

    expect(getAuth).toHaveBeenCalledWith(mockRequest);

    expect(getLocalUser).toHaveBeenCalledWith("user_123");

    expect(mockNext).toHaveBeenCalled();

    expect(mockStatus).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null,
    });

    await requireAdmin(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(401);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "User not authenticated",
    });

    expect(logger.error).toHaveBeenCalledWith("Unauthenticated", {
      reason: "User not authenticated",
    });

    expect(getLocalUser).not.toHaveBeenCalled();

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 when user is not admin", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockResolvedValue({
      id: "1",
      isAdmin: false,
    });

    await requireAdmin(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden admin only",
    });

    expect(logger.error).toHaveBeenCalledWith("Unauthorized", {
      reason: "User not authenticated",
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 when user does not exist", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockResolvedValue(null);

    await requireAdmin(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden admin only",
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when getAuth throws error", async () => {
    const mockError = new Error("Clerk error");

    (getAuth as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await requireAdmin(mockRequest, mockResponse, mockNext);

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

  it("should return 401 when getLocalUser throws error", async () => {
    const mockError = new Error("Database error");

    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockRejectedValue(mockError);

    await requireAdmin(mockRequest, mockResponse, mockNext);

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
