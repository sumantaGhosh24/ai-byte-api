import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "@sentry/node";

import {
  getProfileController,
  getPublicProfileController,
  updatePreferencesController,
  updateProfileController,
} from "../../src/controllers/profile.controller";
import {
  getProfileService,
  getPublicProfileService,
  updatePreferencesService,
  updateProfileService,
} from "../../src/services/profile.service";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../../src/utils/cache";
import { formatValidationError } from "../../src/utils/format";
import { redisKeys } from "../../src/utils/redisKeys";
import { userIdSchema } from "../../src/validations/user.validation";

import {
  updatePreferencesSchema,
  updateProfileSchema,
} from "../../src/validations/profile.validation";

jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../src/services/profile.service", () => ({
  getProfileService: jest.fn(),
  getPublicProfileService: jest.fn(),
  updateProfileService: jest.fn(),
  updatePreferencesService: jest.fn(),
}));

jest.mock("../../src/utils/cache", () => ({
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  deleteManyCache: jest.fn(),
  getKeys: jest.fn(),
}));

jest.mock("../../src/utils/format", () => ({
  formatValidationError: jest.fn(),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    profile: jest.fn(),
    publicProfile: jest.fn(),
  },
}));

jest.mock("../../src/validations/user.validation", () => ({
  userIdSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock("../../src/validations/profile.validation", () => ({
  updateProfileSchema: {
    safeParse: jest.fn(),
  },
  updatePreferencesSchema: {
    safeParse: jest.fn(),
  },
}));

describe("Profile Controllers", () => {
  const mockJson = jest.fn();

  const mockStatus = jest.fn(() => ({
    json: mockJson,
  }));

  const res = {
    json: mockJson,
    status: mockStatus,
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPublicProfileController", () => {
    it("should get public profile successfully", async () => {
      const req = {
        params: {
          id: "user_123",
        },
      } as unknown as Request;

      const profile = {
        id: "1",
        name: "John",
      };

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (getPublicProfileService as jest.Mock).mockResolvedValue(profile);

      (redisKeys.publicProfile as jest.Mock).mockReturnValue(
        "public-profile-key"
      );

      await getPublicProfileController(req, res);

      expect(logger.info).toHaveBeenCalled();

      expect(getPublicProfileService).toHaveBeenCalledWith("user_123");

      expect(setCache).toHaveBeenCalledWith("public-profile-key", {
        success: true,
        profile,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        profile,
      });
    });

    it("should return 400 if validation fails", async () => {
      const req = {
        params: {
          id: "",
        },
      } as unknown as Request;

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue("Invalid user id");

      await getPublicProfileController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid user id",
      });
    });

    it("should return 500 if service fails", async () => {
      const req = {
        params: {
          id: "user_123",
        },
      } as unknown as Request;

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (getPublicProfileService as jest.Mock).mockRejectedValue(
        new Error("Service error")
      );

      await getPublicProfileController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Service error",
      });
    });
  });

  describe("getProfileController", () => {
    it("should get profile successfully", async () => {
      const req = {} as Request;

      const profile = {
        id: "1",
        name: "John",
      };

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (getProfileService as jest.Mock).mockResolvedValue(profile);

      (redisKeys.profile as jest.Mock).mockReturnValue("profile-key");

      await getProfileController(req, res);

      expect(getProfileService).toHaveBeenCalledWith("user_123");

      expect(setCache).toHaveBeenCalledWith("profile-key", {
        success: true,
        profile,
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        profile,
      });
    });

    it("should return 400 if validation fails", async () => {
      const req = {} as Request;

      (getAuth as jest.Mock).mockReturnValue({
        userId: "",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue("Validation failed");

      await getProfileController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Validation failed",
      });
    });

    it("should return 500 if service fails", async () => {
      const req = {} as Request;

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (getProfileService as jest.Mock).mockRejectedValue(
        new Error("Profile error")
      );

      await getProfileController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        message: "Profile error",
      });
    });
  });

  describe("updateProfileController", () => {
    it("should update profile successfully", async () => {
      const req = {
        body: {
          name: "John",
        },
      } as unknown as Request;

      const profile = {
        id: "1",
        name: "John",
      };

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (updateProfileSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "John",
        },
      });

      (updateProfileService as jest.Mock).mockResolvedValue(profile);

      (getKeys as jest.Mock).mockResolvedValue(["users:1"]);

      (redisKeys.profile as jest.Mock).mockReturnValue("profile-key");

      (redisKeys.publicProfile as jest.Mock).mockReturnValue(
        "public-profile-key"
      );

      await updateProfileController(req, res);

      expect(updateProfileService).toHaveBeenCalledWith({
        userId: "user_123",
        name: "John",
        username: undefined,
        bio: undefined,
        avatarUrl: undefined,
        avatarPublicId: undefined,
        interests: undefined,
        goals: undefined,
        onboardingCompleted: undefined,
      });

      expect(deleteManyCache).toHaveBeenCalledWith(["users:1"]);

      expect(deleteCache).toHaveBeenCalledTimes(2);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        profile,
      });
    });

    it("should return 400 if body validation fails", async () => {
      const req = {
        body: {},
      } as unknown as Request;

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (updateProfileSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue("Invalid profile");

      await updateProfileController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid profile",
      });
    });

    it("should return 500 if update fails", async () => {
      const req = {
        body: {
          name: "John",
        },
      } as unknown as Request;

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (updateProfileSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "John",
        },
      });

      (updateProfileService as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      await updateProfileController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Update failed",
      });
    });
  });

  describe("updatePreferencesController", () => {
    it("should update preferences successfully", async () => {
      const req = {
        body: {
          learningPreference: "beginner",
        },
      } as unknown as Request;

      const profile = {
        id: "1",
      };

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (updatePreferencesSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          learningPreference: "beginner",
        },
      });

      (updatePreferencesService as jest.Mock).mockResolvedValue(profile);

      (getKeys as jest.Mock).mockResolvedValue(["users:1"]);

      (redisKeys.profile as jest.Mock).mockReturnValue("profile-key");

      (redisKeys.publicProfile as jest.Mock).mockReturnValue(
        "public-profile-key"
      );

      await updatePreferencesController(req, res);

      expect(updatePreferencesService).toHaveBeenCalledWith({
        userId: "user_123",
        learningPreference: "beginner",
        videoPreference: undefined,
        dailyReminderEnabled: undefined,
        dailyReminderTime: undefined,
        streakReminderEnabled: undefined,
        lessonReminderEnabled: undefined,
        pushNotificationsEnabled: undefined,
        emailNotificationsEnabled: undefined,
      });

      expect(deleteManyCache).toHaveBeenCalled();

      expect(deleteCache).toHaveBeenCalledTimes(2);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        profile,
      });
    });

    it("should return 400 if validation fails", async () => {
      const req = {
        body: {},
      } as unknown as Request;

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (updatePreferencesSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatValidationError as jest.Mock).mockReturnValue(
        "Invalid preferences"
      );

      await updatePreferencesController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        message: "Invalid preferences",
      });
    });

    it("should return 500 if update fails", async () => {
      const req = {
        body: {
          learningPreference: "beginner",
        },
      } as unknown as Request;

      (getAuth as jest.Mock).mockReturnValue({
        userId: "user_123",
      });

      (userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          userId: "user_123",
        },
      });

      (updatePreferencesSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          learningPreference: "beginner",
        },
      });

      (updatePreferencesService as jest.Mock).mockRejectedValue(
        new Error("Preferences failed")
      );

      await updatePreferencesController(req, res);

      expect(mockStatus).toHaveBeenCalledWith(500);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Preferences failed",
      });
    });
  });
});
