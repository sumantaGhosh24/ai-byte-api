import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { getUsersController } from "../../src/controllers/user.controller";
import { getUsersService } from "../../src/services/user.service";
import { setCache } from "../../src/utils/cache";
import { redisKeys } from "../../src/utils/redisKeys";

jest.mock("../../src/services/user.service", () => ({
  getUsersService: jest.fn(),
}));

jest.mock("../../src/utils/cache", () => ({
  setCache: jest.fn(),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    users: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe("User Controllers", () => {
  describe("getUsersController", () => {
    const mockJson = jest.fn();

    const mockStatus = jest.fn(() => ({
      json: mockJson,
    }));

    const mockResponse = {
      json: mockJson,
      status: mockStatus,
    } as unknown as Response;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should fetch users successfully", async () => {
      const mockUsers = {
        items: [
          {
            id: "1",
            email: "test@example.com",
          },
        ],

        paginations: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      };

      const mockRequest = {
        query: {
          page: "1",
          limit: "10",
          search: "test",
        },
      } as unknown as Request;

      (getUsersService as jest.Mock).mockResolvedValue(mockUsers);

      (redisKeys.users as jest.Mock).mockReturnValue("users-cache-key");

      await getUsersController(mockRequest, mockResponse);

      expect(logger.info).toHaveBeenCalledWith("Started fetching users");

      expect(getUsersService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "test",
      });

      expect(logger.info).toHaveBeenCalledWith("Successfully fetched users");

      expect(redisKeys.users).toHaveBeenCalledWith(
        JSON.stringify(mockRequest.query)
      );

      expect(setCache).toHaveBeenCalledWith("users-cache-key", {
        success: true,
        users: mockUsers,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        users: mockUsers,
      });
    });

    it("should use default pagination values", async () => {
      const mockUsers = {
        items: [],
        paginations: {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false,
        },
      };

      const mockRequest = {
        query: {},
      } as unknown as Request;

      (getUsersService as jest.Mock).mockResolvedValue(mockUsers);

      (redisKeys.users as jest.Mock).mockReturnValue("users-cache-key");

      await getUsersController(mockRequest, mockResponse);

      expect(getUsersService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        users: mockUsers,
      });
    });

    it("should return 500 when service throws error", async () => {
      const mockRequest = {
        query: {},
      } as unknown as Request;

      const mockError = new Error("Failed to fetch users");

      (getUsersService as jest.Mock).mockRejectedValue(mockError);

      await getUsersController(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch users",
      });
    });

    it("should handle unknown errors", async () => {
      const mockRequest = {
        query: {},
      } as unknown as Request;

      (getUsersService as jest.Mock).mockRejectedValue("Unknown error");

      await getUsersController(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Unknown error",
      });
    });

    it("should handle numeric query params correctly", async () => {
      const mockRequest = {
        query: {
          page: "2",
          limit: "20",
        },
      } as unknown as Request;

      (getUsersService as jest.Mock).mockResolvedValue({
        items: [],
        paginations: {},
      });

      (redisKeys.users as jest.Mock).mockReturnValue("users-cache-key");

      await getUsersController(mockRequest, mockResponse);

      expect(getUsersService).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: undefined,
      });
    });
  });
});
