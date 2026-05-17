import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { logger } from "@sentry/node";

import { requireOnboarding } from "../../src/middlewares/onboarding.middleware";
import { getLocalUser } from "../../src/utils/users";
import { db } from "../../src/db";
import { profiles } from "../../src/db/schema";

jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../../src/utils/users", () => ({
  getLocalUser: jest.fn(),
}));

const mockLimit = jest.fn();

const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));

const mockFrom = jest.fn(() => ({
  where: mockWhere,
}));

jest.mock("../../src/db", () => ({
  db: {
    select: jest.fn(() => ({
      from: mockFrom,
    })),
  },
}));

jest.mock("../../src/db/schema", () => ({
  profiles: {
    userId: "userId",
  },
}));

describe("requireOnboarding", () => {
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

  it("should call next when onboarding is completed", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockResolvedValue({
      id: "local_user_1",
    });

    mockLimit.mockResolvedValue([
      {
        onboardingCompleted: true,
      },
    ]);

    await requireOnboarding(mockRequest, mockResponse, mockNext);

    expect(getAuth).toHaveBeenCalledWith(mockRequest);

    expect(getLocalUser).toHaveBeenCalledWith("user_123");

    expect(db.select).toHaveBeenCalled();

    expect(mockFrom).toHaveBeenCalledWith(profiles);

    expect(eq).toHaveBeenCalledWith(profiles.userId, "local_user_1");

    expect(mockNext).toHaveBeenCalled();

    expect(mockStatus).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null,
    });

    await requireOnboarding(mockRequest, mockResponse, mockNext);

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

  it("should return 403 when onboarding is not completed", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockResolvedValue({
      id: "local_user_1",
    });

    mockLimit.mockResolvedValue([
      {
        onboardingCompleted: false,
      },
    ]);

    await requireOnboarding(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Complete onboarding first",
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 when profile does not exist", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: "user_123",
    });

    (getLocalUser as jest.Mock).mockResolvedValue({
      id: "local_user_1",
    });

    mockLimit.mockResolvedValue([]);

    await requireOnboarding(mockRequest, mockResponse, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Complete onboarding first",
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when middleware throws error", async () => {
    const mockError = new Error("Database error");

    (getAuth as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await requireOnboarding(mockRequest, mockResponse, mockNext);

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
