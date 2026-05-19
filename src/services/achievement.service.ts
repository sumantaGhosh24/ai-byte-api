import { and, eq, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { achievements, userAchievements } from "../db/schema";

interface GetAchievementsParams {
  page: number;
  limit: number;
  search?: string;
  achievementType?:
    | "general"
    | "learning"
    | "quiz"
    | "course"
    | "streak"
    | "custom";
}

export const getAllAchievementsService = async ({
  page,
  limit,
  search,
  achievementType,
}: GetAchievementsParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [];
    if (search) {
      filters.push(ilike(achievements.title, `%${search}%`));
    }
    if (achievementType) {
      filters.push(eq(achievements.achievementType, achievementType));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const data = await db.query.achievements.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (achievements, { desc }) => [desc(achievements.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(achievements)
      .where(whereClause);

    return {
      items: data,
      paginations: {
        page,
        limit,
        total: Number(total[0]?.count || 0),
        hasMore: offset + data.length < Number(total[0]?.count || 0),
      },
    };
  } catch (error) {
    logger.error("Error fetching paginated achievements", { error });

    throw error;
  }
};

export const getAchievementByIdService = async (id: string) => {
  try {
    const achievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, id),
    });

    if (!achievement) {
      logger.error("Achievement not found");

      throw new Error("Achievement not found");
    }

    return achievement;
  } catch (error) {
    logger.error("Error fetching achievement", { error });

    throw error;
  }
};

interface CreateAchievementParams {
  title: string;
  description: string;
  badgeImage: string;
  badgeImagePublicId: string;
  xpReward: number;
  achievementType:
    | "general"
    | "learning"
    | "quiz"
    | "course"
    | "streak"
    | "custom";
}

export const createAchievementService = async ({
  title,
  description,
  badgeImage,
  badgeImagePublicId,
  xpReward,
  achievementType,
}: CreateAchievementParams) => {
  try {
    const [row] = await db
      .insert(achievements)
      .values({
        title: title.trim(),
        description: description.trim(),
        badgeImage,
        badgeImagePublicId,
        xpReward,
        achievementType,
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating achievement", { error });

    throw error;
  }
};

interface UpdateAchievementParams {
  id: string;
  title?: string;
  description?: string;
  badgeImage?: string;
  badgeImagePublicId?: string;
  xpReward?: number;
  achievementType?:
    | "general"
    | "learning"
    | "quiz"
    | "course"
    | "streak"
    | "custom";
}

export const updateAchievementService = async ({
  id,
  title,
  description,
  badgeImage,
  badgeImagePublicId,
  xpReward,
  achievementType,
}: UpdateAchievementParams) => {
  try {
    const existingAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, id),
    });

    if (!existingAchievement) {
      logger.error("Achievement not found");

      throw new Error("Achievement not found");
    }

    const [achievement] = await db
      .update(achievements)
      .set({
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined
          ? { description: description.trim() }
          : {}),
        ...(badgeImage !== undefined ? { badgeImage } : {}),
        ...(badgeImagePublicId !== undefined ? { badgeImagePublicId } : {}),
        ...(xpReward !== undefined ? { xpReward } : {}),
        ...(achievementType !== undefined ? { achievementType } : {}),
        updatedAt: new Date(),
      })
      .where(eq(achievements.id, id))
      .returning();

    return achievement;
  } catch (error) {
    logger.error("Error updating achievement", { error });

    throw error;
  }
};

export const deleteAchievementService = async (id: string) => {
  try {
    const existingAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, id),
    });

    if (!existingAchievement) {
      logger.error("Achievement not found");

      throw new Error("Achievement not found");
    }

    const [achievement] = await db
      .delete(achievements)
      .where(eq(achievements.id, id))
      .returning();

    return achievement;
  } catch (error) {
    logger.error("Error deleting achievement", { error });

    throw error;
  }
};

export const getUserAchievementsService = async (userId: string) => {
  try {
    const userAchievementsList = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, userId),
      with: {
        achievement: true,
      },
      orderBy: (userAchievements, { desc }) => [
        desc(userAchievements.unlockedAt),
      ],
    });

    return userAchievementsList;
  } catch (error) {
    logger.error("Error fetching user achievements", { error });

    throw error;
  }
};

interface CreateUserAchievementParams {
  userId: string;
  achievementId: string;
}

export const createUserAchievementService = async ({
  userId,
  achievementId,
}: CreateUserAchievementParams) => {
  try {
    const exists = await db.query.userAchievements.findFirst({
      where: and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ),
    });
    if (exists) {
      return exists;
    }

    const [created] = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
        unlockedAt: new Date(),
      })
      .returning();

    return created;
  } catch (error) {
    logger.error("Error granting user achievement", { error });

    throw error;
  }
};

export const deleteUserAchievementService = async ({
  userId,
  achievementId,
}: CreateUserAchievementParams) => {
  try {
    const [deleted] = await db
      .delete(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      )
      .returning();

    return deleted;
  } catch (error) {
    logger.error("Error deleting user achievement", { error });

    throw error;
  }
};
