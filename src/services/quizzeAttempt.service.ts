import { and, eq, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { quizAttempts } from "../db/schema";

interface GetQuizAttemptsParams {
  page: number;
  limit: number;
  userId?: string;
  quizId?: string;
}

export const getAllQuizAttemptsService = async ({
  page,
  limit,
  userId,
  quizId,
}: GetQuizAttemptsParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [];
    if (userId) {
      filters.push(eq(quizAttempts.userId, userId));
    }
    if (quizId) {
      filters.push(eq(quizAttempts.quizId, quizId));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.quizAttempts.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (quizAttempts, { desc }) => [desc(quizAttempts.submittedAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizAttempts)
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
    logger.error("Error fetching paginated quiz attempts", { error });

    throw error;
  }
};

export const getQuizAttemptService = async (id: string) => {
  try {
    const attempt = await db.query.quizAttempts.findFirst({
      where: eq(quizAttempts.id, id),
      with: {
        quiz: true,
        answerSubmissions: true,
      },
    });

    if (!attempt) {
      logger.error("Quiz Attempt not found");

      throw new Error("Quiz Attempt not found");
    }

    return attempt;
  } catch (error) {
    logger.error("Error fetching quiz attempt", { error });

    throw error;
  }
};

interface CreateQuizAttemptParams {
  userId: string;
  quizId: string;
  score: number;
}

export const createQuizAttemptService = async ({
  userId,
  quizId,
  score,
}: CreateQuizAttemptParams) => {
  try {
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId,
        quizId,
        score,
      })
      .returning();

    return attempt;
  } catch (error) {
    logger.error("Error creating quiz attempt", { error });

    throw error;
  }
};

interface UpdateQuizAttemptParams {
  id: string;
  userId?: string;
  quizId?: string;
  score?: number;
}

export const updateQuizAttemptService = async ({
  id,
  userId,
  quizId,
  score,
}: UpdateQuizAttemptParams) => {
  try {
    const existing = await db.query.quizAttempts.findFirst({
      where: eq(quizAttempts.id, id),
    });
    if (!existing) {
      logger.error("Quiz Attempt not found");

      throw new Error("Quiz Attempt not found");
    }

    const [updated] = await db
      .update(quizAttempts)
      .set({
        ...(userId !== undefined ? { userId } : {}),
        ...(quizId !== undefined ? { quizId } : {}),
        ...(score !== undefined ? { score } : {}),
        submittedAt: new Date(),
      })
      .where(eq(quizAttempts.id, id))
      .returning();

    return updated;
  } catch (error) {
    logger.error("Error updating quiz attempt", { error });

    throw error;
  }
};

export const deleteQuizAttemptService = async (id: string) => {
  try {
    const existing = await db.query.quizAttempts.findFirst({
      where: eq(quizAttempts.id, id),
    });
    if (!existing) {
      logger.error("Quiz Attempt not found");

      throw new Error("Quiz Attempt not found");
    }
    const [del] = await db
      .delete(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .returning();

    return del;
  } catch (error) {
    logger.error("Error deleting quiz attempt", { error });

    throw error;
  }
};
