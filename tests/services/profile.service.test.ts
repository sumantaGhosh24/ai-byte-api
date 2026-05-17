import { logger } from "@sentry/node";

import {
  getPublicProfileService,
  getProfileService,
  updateProfileService,
  updatePreferencesService,
} from "../../src/services/profile.service";
import { db } from "../../src/db";
import { profiles } from "../../src/db/schema";

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockReturning = jest.fn();

const mockWhere = jest.fn(() => ({
  returning: mockReturning,
}));

const mockSet = jest.fn(() => ({
  where: mockWhere,
}));

jest.mock("../../src/db", () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
      },
      profiles: {
        findFirst: jest.fn(),
      },
      streaks: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(() => ({
      set: mockSet,
    })),
  },
}));

jest.mock("../../src/db/schema", () => ({
  users: {
    id: "id",
  },
  profiles: {
    userId: "userId",
  },
  streaks: {
    userId: "userId",
  },
}));

describe("Profile Services", () => {
  describe("getPublicProfileService", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return public profile data", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        id: "user_1",
        email: "test@example.com",
        xp: 100,
      });

      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue({
        name: "John",
      });

      (db.query.streaks.findFirst as jest.Mock).mockResolvedValue({
        currentStreak: 5,
      });

      const result = await getPublicProfileService("user_1");

      expect(result).toEqual({
        userId: "user_1",
        email: "test@example.com",
        profile: {
          name: "John",
        },
        streak: 5,
        xp: 100,
      });
    });

    it("should return streak 0 when streak not found", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        id: "user_1",
        email: "test@example.com",
        xp: 50,
      });

      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue({
        name: "John",
      });

      (db.query.streaks.findFirst as jest.Mock).mockResolvedValue(undefined);

      const result = await getPublicProfileService("user_1");

      expect(result.streak).toBe(0);
    });

    it("should throw when profile not found", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getPublicProfileService("user_1")).rejects.toThrow(
        "Profile not found"
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("getProfileService", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return profile data", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        id: "user_1",
        email: "test@example.com",
        xp: 200,
        isAdmin: true,
      });

      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue({
        name: "John",
      });

      const result = await getProfileService("user_1");

      expect(result).toEqual({
        userId: "user_1",
        email: "test@example.com",
        xp: 200,
        isAdmin: true,
        profile: {
          name: "John",
        },
      });
    });

    it("should throw when profile not found", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProfileService("user_1")).rejects.toThrow(
        "Profile not found"
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("updateProfileService", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update profile successfully", async () => {
      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue({
        id: "profile_1",
      });

      const updatedProfile = {
        id: "profile_1",
        name: "john",
        username: "johndoe",
      };

      mockReturning.mockResolvedValue([updatedProfile]);

      const result = await updateProfileService({
        userId: "user_1",
        name: "John",
        username: "JohnDoe",
        bio: "Developer",
        interests: "Coding",
        goals: "Learn AI",
      });

      expect(db.update).toHaveBeenCalledWith(profiles);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "john",
          username: "johndoe",
          bio: "developer",
          interests: "coding",
          goals: "learn ai",
        })
      );

      expect(result).toEqual(updatedProfile);
    });

    it("should throw when profile does not exist", async () => {
      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        updateProfileService({
          userId: "user_1",
        })
      ).rejects.toThrow("Profile not found");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("updatePreferencesService", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update preferences successfully", async () => {
      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue({
        id: "profile_1",
      });

      const updatedPreferences = {
        id: "profile_1",
        learningPreference: "beginner",
      };

      mockReturning.mockResolvedValue([updatedPreferences]);

      const result = await updatePreferencesService({
        userId: "user_1",
        learningPreference: "beginner",
        videoPreference: "short",
        dailyReminderEnabled: true,
      });

      expect(db.update).toHaveBeenCalledWith(profiles);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          learningPreference: "beginner",
          videoPreference: "short",
          dailyReminderEnabled: true,
        })
      );

      expect(result).toEqual(updatedPreferences);
    });

    it("should throw when profile does not exist", async () => {
      (db.query.profiles.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        updatePreferencesService({
          userId: "user_1",
        })
      ).rejects.toThrow("Profile not found");

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
