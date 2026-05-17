import { eq } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { profiles, streaks, users } from "../db/schema";

export const getPublicProfileService = async (userId: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!user || !profile) {
      logger.error("Profile not found");

      throw new Error("Profile not found");
    }

    const streak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });

    return {
      userId: user.id,
      email: user.email,
      profile,
      streak: streak?.currentStreak || 0,
      xp: user.xp || 0,
    };
  } catch (error) {
    logger.error("Error to get public profile", { error });

    throw error;
  }
};

export const getProfileService = async (userId: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!user || !profile) {
      logger.error("Profile not found");

      throw new Error("Profile not found");
    }

    return {
      userId: user.id,
      email: user.email,
      xp: user.xp,
      isAdmin: user.isAdmin,
      profile,
    };
  } catch (error) {
    logger.error("Error to get profile", { error });

    throw error;
  }
};

interface UpdateProfileParams {
  userId: string;
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  interests?: string;
  goals?: string;
  onboardingCompleted?: boolean;
}

export const updateProfileService = async ({
  userId,
  name,
  username,
  bio,
  avatarUrl,
  avatarPublicId,
  interests,
  goals,
  onboardingCompleted,
}: UpdateProfileParams) => {
  try {
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!existingProfile) {
      logger.error("Profile not found");

      throw new Error("Profile not found");
    }

    const [row] = await db
      .update(profiles)
      .set({
        name: name?.toLowerCase(),
        username: username?.toLowerCase(),
        bio: bio?.toLowerCase(),
        avatarUrl,
        avatarPublicId,
        interests: interests?.toLowerCase(),
        goals: goals?.toLowerCase(),
        onboardingCompleted,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    return row;
  } catch (error) {
    logger.error("Error to update profile", { error });

    throw error;
  }
};

interface UpdatePreferencesParams {
  userId: string;
  learningPreference?: "beginner" | "intermediate" | "advanced";
  videoPreference?: "short" | "medium" | "long";
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  streakReminderEnabled?: boolean;
  lessonReminderEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
}

export const updatePreferencesService = async ({
  userId,
  learningPreference,
  videoPreference,
  dailyReminderEnabled,
  dailyReminderTime,
  streakReminderEnabled,
  lessonReminderEnabled,
  pushNotificationsEnabled,
  emailNotificationsEnabled,
}: UpdatePreferencesParams) => {
  try {
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!existingProfile) {
      logger.error("Profile not found");

      throw new Error("Profile not found");
    }

    const [row] = await db
      .update(profiles)
      .set({
        learningPreference,
        videoPreference,
        dailyReminderEnabled,
        dailyReminderTime,
        streakReminderEnabled,
        lessonReminderEnabled,
        pushNotificationsEnabled,
        emailNotificationsEnabled,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    return row;
  } catch (error) {
    logger.error("Error to update profile preferences", { error });

    throw error;
  }
};
