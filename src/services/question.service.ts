import { logger } from "@sentry/node";

import {
  GetQuestionsParams,
  CreateQuestionParams,
  UpdateQuestionParams,
} from "../validations/question.validation";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/db";

export const getAllQuestionsService = async ({
  page,
  limit,
  search,
  quizId,
  difficulty,
  visibility,
  status,
}: GetQuestionsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {
      quizId,
      ...(search
        ? { question: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(visibility ? { visibility } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          options: true,
          _count: {
            select: {
              answers: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.question.count({ where }),
    ]);

    const formattedItems = items.map(question => {
      return {
        ...question,
        answersCount: question._count.answers,
      };
    });

    return {
      items: formattedItems,
      paginations: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
        nextPage: skip + items.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    logger.error("Error fetching paginated questions", { error });

    throw error;
  }
};

export const getPublicQuestionsService = async ({
  page,
  limit,
  search,
  quizId,
  difficulty,
}: GetQuestionsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {
      visibility: "public",
      status: "completed",
      quizId,
      ...(search
        ? { question: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          options: true,
          _count: {
            select: {
              answers: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.question.count({ where }),
    ]);

    const formattedItems = items.map(question => {
      return {
        ...question,
        answersCount: question._count.answers,
      };
    });

    return {
      items: formattedItems,
      paginations: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
        nextPage: skip + items.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    logger.error("Error fetching paginated public questions", { error });

    throw error;
  }
};

export const getQuestionService = async (questionId: string) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    if (!question) {
      logger.error("Question not found");

      throw new Error("NOT_FOUND");
    }

    return question;
  } catch (error) {
    logger.error("Error fetching question", { error });

    throw error;
  }
};

export const getPublicQuestionService = async (questionId: string) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId, visibility: "public", status: "completed" },
      include: {
        options: true,
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    if (!question) {
      logger.error("Question not found");

      throw new Error("NOT_FOUND");
    }

    return question;
  } catch (error) {
    logger.error("Error fetching public question", { error });

    throw error;
  }
};

export const createQuestionService = async ({
  quizId,
  question,
  explanation,
  options,
  difficulty,
  visibility,
}: CreateQuestionParams) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      logger.error("Quiz not found");

      throw new Error("QUIZ_NOT_FOUND");
    }

    const correctOptionIndex = options.findIndex(opt => opt.isCorrect);
    if (correctOptionIndex === -1) {
      throw new Error("At least one option must be marked as correct");
    }

    const correctAnswerText = options?.[correctOptionIndex]?.text ?? "N/A";

    const questionRow = await prisma.question.create({
      data: {
        quizId,
        question,
        explanation,
        difficulty,
        visibility,
        status: "completed",
        aiGenerated: false,
        correctAnswer: correctAnswerText,
        options: {
          create: options.map(opt => ({
            text: opt.text,
            isCorrect: !!opt.isCorrect,
          })),
        },
      },
      include: { options: true },
    });

    return questionRow;
  } catch (error) {
    logger.error("Error creating question", { error });

    throw error;
  }
};

export const updateQuestionService = async ({
  questionId,
  quizId,
  question,
  explanation,
  options,
  difficulty,
  visibility,
  status,
}: UpdateQuestionParams) => {
  try {
    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!existing) {
      logger.error("Question not found");

      throw new Error("NOT_FOUND");
    }

    let updateData: Prisma.QuestionUpdateInput = {
      ...(quizId !== undefined ? { quizId } : {}),
      ...(question !== undefined ? { question } : {}),
      ...(explanation !== undefined ? { explanation } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(visibility !== undefined ? { visibility } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    let optionsUpdate:
      | Prisma.QuestionOptionUpdateManyWithoutQuestionNestedInput
      | undefined = undefined;

    if (options !== undefined) {
      await prisma.questionOption.deleteMany({
        where: { questionId },
      });
      optionsUpdate = {
        create: options.map(opt => ({
          text: opt.text,
          isCorrect: !!opt.isCorrect,
        })),
      };

      const correctOptionIndex = options.findIndex(opt => opt.isCorrect);
      if (correctOptionIndex === -1) {
        throw new Error("At least one option must be marked as correct");
      }
      updateData = {
        ...updateData,
        correctAnswer: options?.[correctOptionIndex]?.text ?? "N/A",
      };
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...updateData,
        ...(optionsUpdate ? { options: optionsUpdate } : {}),
      },
      include: { options: true },
    });

    return updated;
  } catch (error) {
    logger.error("Error updating question", { error });

    throw error;
  }
};

export const deleteQuestionService = async (questionId: string) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      logger.error("Question not found");

      throw new Error("NOT_FOUND");
    }

    const deleted = await prisma.question.delete({
      where: { id: questionId },
    });

    return deleted;
  } catch (error) {
    logger.error("Error deleting question", { error });

    throw error;
  }
};
