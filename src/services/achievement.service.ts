import { logger } from "@sentry/node";

import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/client";
import {
  CreateAchievementParams,
  CreateUserAchievementParams,
  GetAchievementsParams,
  UpdateAchievementParams,
} from "../validations/achievement.validation";
import { inngest } from "../inngest/client";

export const getAllAchievementsService = async ({
  page,
  limit,
  search,
  achievementType,
  achievementRarity,
}: GetAchievementsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.AchievementWhereInput = {
      ...(search && { title: { contains: search, mode: "insensitive" } }),
      ...(achievementType && { achievementType }),
      ...(achievementRarity && { achievementRarity }),
    };

    const [items, total] = await Promise.all([
      prisma.achievement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.achievement.count({ where }),
    ]);

    return {
      items,
      paginations: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
        nextPage: skip + items.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching achievements", { error });

    throw error;
  }
};

export const getAchievementByIdService = async (id: string) => {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      throw new Error("NOT_FOUND");
    }

    return achievement;
  } catch (error) {
    logger.error("Error fetching achievement by ID", { error, id });

    throw error;
  }
};

export const createAchievementService = async ({
  title,
  description,
  badgeImage,
  badgeImagePublicId,
  achievementType,
  achievementRarity,
}: CreateAchievementParams) => {
  try {
    return await prisma.achievement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        badgeImage,
        badgeImagePublicId,
        achievementType,
        achievementRarity,
      },
    });
  } catch (error) {
    logger.error("Error creating achievement", { error });

    throw error;
  }
};

export const updateAchievementService = async ({
  achievementId,
  achievementRarity,
  achievementType,
  badgeImage,
  badgeImagePublicId,
  description,
  title,
}: UpdateAchievementParams) => {
  try {
    const exists = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!exists) {
      throw new Error("NOT_FOUND");
    }

    return await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...(title && { title: title.toLowerCase() }),
        ...(description && { description: description.toLowerCase() }),
        ...(badgeImage !== undefined && { badgeImage }),
        ...(badgeImagePublicId !== undefined && { badgeImagePublicId }),
        ...(achievementType && { achievementType }),
        ...(achievementRarity && { achievementRarity }),
      },
    });
  } catch (error) {
    logger.error("Error updating achievement", { error });

    throw error;
  }
};

export const deleteAchievementService = async (id: string) => {
  try {
    const exists = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new Error("NOT_FOUND");
    }

    return await prisma.achievement.delete({
      where: { id },
    });
  } catch (error) {
    logger.error("Error deleting achievement", { error });

    throw error;
  }
};

export const getUserAchievementsService = async (userId: string) => {
  try {
    return await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });
  } catch (error) {
    logger.error("Error fetching user achievements", { error });

    throw error;
  }
};

export const createUserAchievementService = async ({
  userId,
  achievementId,
}: CreateUserAchievementParams) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new Error("NOT_FOUND");
    }

    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
      include: { achievement: true },
    });

    await inngest.send({
      name: "achievement/unlocked",
      data: {
        userId,
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        achievementDescription: achievement.description,
        achievementRarity: achievement.achievementRarity,
      },
    });

    return userAchievement;
  } catch (error) {
    logger.error("Error creating user achievement", { error });

    throw error;
  }
};

export const deleteUserAchievementService = async ({
  userId,
  achievementId,
}: CreateUserAchievementParams) => {
  try {
    return await prisma.userAchievement.delete({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });
  } catch (error) {
    logger.error("Error deleting user achievement", { error });

    throw error;
  }
};
