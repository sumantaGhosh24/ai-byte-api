import { and, eq, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { questions } from "../db/schema";

interface GetQuestionsParams {
  page: number;
  limit: number;
  search?: string;
  quizId?: string;
}

export const getAllQuestionsService = async ({
  page,
  limit,
  search,
  quizId,
}: GetQuestionsParams) => {
  try {
    const offset = (page - 1) * limit;
    const filters = [];

    if (search) {
      filters.push(ilike(questions.question, `%${search}%`));
    }
    if (quizId) {
      filters.push(eq(questions.quizId, quizId));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.questions.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (questions, { desc }) => [desc(questions.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
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
    logger.error("Error fetching paginated questions", { error });

    throw error;
  }
};

export const getQuestionService = async (id: string) => {
  try {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!question) {
      logger.error("Question not found");

      throw new Error("Question not found");
    }

    return question;
  } catch (error) {
    logger.error("Error fetching question", { error });

    throw error;
  }
};

interface CreateQuestionParams {
  quizId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation?: string;
}

export const createQuestionService = async ({
  quizId,
  question,
  optionA,
  optionB,
  optionC,
  optionD,
  correctAnswer,
  explanation,
}: CreateQuestionParams) => {
  try {
    const [row] = await db
      .insert(questions)
      .values({
        quizId,
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation,
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating question", { error });

    throw error;
  }
};

interface UpdateQuestionParams {
  id: string;
  quizId?: string;
  question?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: "A" | "B" | "C" | "D";
  explanation?: string;
}

export const updateQuestionService = async ({
  id,
  quizId,
  question,
  optionA,
  optionB,
  optionC,
  optionD,
  correctAnswer,
  explanation,
}: UpdateQuestionParams) => {
  try {
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!existingQuestion) {
      logger.error("Question not found");

      throw new Error("Question not found");
    }

    const [updated] = await db
      .update(questions)
      .set({
        ...(quizId !== undefined ? { quizId } : {}),
        ...(question !== undefined ? { question } : {}),
        ...(optionA !== undefined ? { optionA } : {}),
        ...(optionB !== undefined ? { optionB } : {}),
        ...(optionC !== undefined ? { optionC } : {}),
        ...(optionD !== undefined ? { optionD } : {}),
        ...(correctAnswer !== undefined ? { correctAnswer } : {}),
        ...(explanation !== undefined ? { explanation } : {}),
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))
      .returning();

    return updated;
  } catch (error) {
    logger.error("Error updating question", { error });

    throw error;
  }
};

export const deleteQuestionService = async (id: string) => {
  try {
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!existingQuestion) {
      logger.error("Question not found");

      throw new Error("Question not found");
    }

    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning();

    return deleted;
  } catch (error) {
    logger.error("Error deleting question", { error });

    throw error;
  }
};
