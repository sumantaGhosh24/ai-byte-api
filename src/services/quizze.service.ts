import { and, eq, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { quizzes } from "../db/schema";

interface GetQuizzesParams {
  page: number;
  limit: number;
  search?: string;
  courseId?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export const getAllQuizzesService = async ({
  page,
  limit,
  search,
  courseId,
  difficulty,
}: GetQuizzesParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [];

    if (search) {
      filters.push(ilike(quizzes.title, `%${search}%`));
    }
    if (courseId) {
      filters.push(eq(quizzes.courseId, courseId));
    }
    if (difficulty) {
      filters.push(eq(quizzes.difficulty, difficulty));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.quizzes.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizzes)
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
    logger.error("Error fetching paginated quizzes", { error });

    throw error;
  }
};

export const getQuizService = async (id: string) => {
  try {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
    });

    if (!quiz) {
      logger.error("Quiz not found");

      throw new Error("Quiz not found");
    }

    return quiz;
  } catch (error) {
    logger.error("Error fetching quiz", { error });

    throw error;
  }
};

interface CreateQuizParams {
  courseId: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const createQuizService = async ({
  courseId,
  title,
  description,
  difficulty,
}: CreateQuizParams) => {
  try {
    const [row] = await db
      .insert(quizzes)
      .values({
        courseId,
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        difficulty,
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating quiz", { error });

    throw error;
  }
};

interface UpdateQuizParams {
  id: string;
  courseId?: string;
  title?: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export const updateQuizService = async ({
  id,
  courseId,
  title,
  description,
  difficulty,
}: UpdateQuizParams) => {
  try {
    const existingQuiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
    });

    if (!existingQuiz) {
      logger.error("Quiz not found");

      throw new Error("Quiz not found");
    }

    const [quiz] = await db
      .update(quizzes)
      .set({
        ...(courseId !== undefined ? { courseId } : {}),
        ...(title !== undefined ? { title: title.toLowerCase() } : {}),
        ...(description !== undefined
          ? { description: description.toLowerCase() }
          : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, id))
      .returning();

    return quiz;
  } catch (error) {
    logger.error("Error updating quiz", { error });

    throw error;
  }
};

export const deleteQuizService = async (id: string) => {
  try {
    const existingQuiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
    });

    if (!existingQuiz) {
      logger.error("Quiz not found");

      throw new Error("Quiz not found");
    }

    const [quiz] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning();

    return quiz;
  } catch (error) {
    logger.error("Error deleting quiz", { error });

    throw error;
  }
};
