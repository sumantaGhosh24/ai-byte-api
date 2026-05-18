import { and, eq, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { answerSubmissions } from "../db/schema";

interface GetAnswerSubmissionsParams {
  page: number;
  limit: number;
  quizAttemptId?: string;
}

export const getAllAnswerSubmissionsService = async ({
  page,
  limit,
  quizAttemptId,
}: GetAnswerSubmissionsParams) => {
  try {
    const offset = (page - 1) * limit;
    const filters = [];
    if (quizAttemptId) {
      filters.push(eq(answerSubmissions.quizAttemptId, quizAttemptId));
    }
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.answerSubmissions.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (answerSubmissions, { desc }) => [
        desc(answerSubmissions.createdAt),
      ],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(answerSubmissions)
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
    logger.error("Error fetching paginated answer submissions", { error });

    throw error;
  }
};

export const getAnswerSubmissionService = async (id: string) => {
  try {
    const answerSubmission = await db.query.answerSubmissions.findFirst({
      where: eq(answerSubmissions.id, id),
    });

    if (!answerSubmission) {
      logger.error("Answer Submission not found");

      throw new Error("Answer Submission not found");
    }

    return answerSubmission;
  } catch (error) {
    logger.error("Error fetching answer submission", { error });

    throw error;
  }
};

interface CreateAnswerSubmissionParams {
  quizAttemptId: string;
  userAnswer: string;
}

export const createAnswerSubmissionService = async ({
  quizAttemptId,
  userAnswer,
}: CreateAnswerSubmissionParams) => {
  try {
    const [row] = await db
      .insert(answerSubmissions)
      .values({
        quizAttemptId,
        userAnswer,
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating answer submission", { error });

    throw error;
  }
};
