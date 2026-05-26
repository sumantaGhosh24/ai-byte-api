import { generateText } from "ai";
import { logger } from "@sentry/node";

import {
  CreateQuizAttemptParams,
  GenerateAISummaryParams,
  GetQuizAttemptsParams,
  quizAttemptSummaryGenerationSchema,
} from "../validations/quizAttempt.validation";
import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/client";
import { geminiModel } from "../config/ai";

export const getAllQuizAttemptsService = async ({
  page,
  limit,
  search,
  userId,
  quizId,
}: GetQuizAttemptsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.QuizAttemptWhereInput = {
      ...(userId && { userId }),
      ...(quizId && { quizId }),
      ...(search && {
        OR: [
          {
            user: {
              profile: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            quiz: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
          quiz: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: { answers: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.quizAttempt.count({ where }),
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
      },
    };
  } catch (error) {
    logger.error("Error fetching quiz attempts", { error });

    throw error;
  }
};

export const getUserQuizAttemptsService = async ({
  userId,
  page,
  limit,
}: GetQuizAttemptsParams) => {
  try {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
          summary: true,
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.quizAttempt.count({ where: { userId } }),
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
      },
    };
  } catch (error) {
    logger.error("Error fetching user attempts", { error });

    throw error;
  }
};

export const getQuizAttemptsService = async ({
  quizId,
  page,
  limit,
}: GetQuizAttemptsParams) => {
  try {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { quizId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.quizAttempt.count({ where: { quizId } }),
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
      },
    };
  } catch (error) {
    logger.error("Error fetching quiz attempts", { error });

    throw error;
  }
};

export const getQuizAttemptService = async (id: string) => {
  try {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        summary: true,
        answers: {
          include: {
            selectedOption: true,
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new Error("NOT_FOUND");
    }

    return attempt;
  } catch (error) {
    logger.error("Error fetching attempt", { error });

    throw error;
  }
};

export const generateQuizSummaryAIService = async ({
  quizTitle,
  score,
  correctAnswers,
  wrongAnswers,
  answers,
}: GenerateAISummaryParams) => {
  const prompt = `
    Analyze this quiz attempt.

    Quiz:
    ${quizTitle}

    Score:
    ${score}

    Correct Answers:
    ${correctAnswers}

    Wrong Answers:
    ${wrongAnswers}

    Questions:

    ${JSON.stringify(answers)}

    Return STRICT JSON ONLY.

    {
      "strength":"string",
      "weaknesses":"string"
    }

    Rules:

    - concise
    - educational
    - no markdown
    - valid json only
  `;

  const result = await generateText({
    model: geminiModel,
    prompt,
    temperature: 0.5,
  });

  const cleaned = result.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  const validated = quizAttemptSummaryGenerationSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("INVALID_AI_SCHEMA");
  }

  return validated.data;
};

export const createQuizAttemptService = async ({
  userId,
  quizId,
  answers,
}: CreateQuizAttemptParams) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) {
      throw new Error("NOT_FOUND");
    }

    let correctAnswers = 0;
    let wrongAnswers = 0;

    const answerSubmissions = [];

    for (const answer of answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId);

      if (!question) {
        continue;
      }

      const selectedOption = question.options.find(
        option => option.id === answer.selectedOptionId
      );

      if (!selectedOption) {
        continue;
      }

      const isCorrect = selectedOption.isCorrect;

      if (isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      answerSubmissions.push({
        questionId: question.id,
        selectedOptionId: selectedOption.id,
        isCorrect,
        result: isCorrect ? "correct" : "wrong",
      });
    }

    const percentage = Math.round(
      (correctAnswers / quiz.questions.length) * 100
    );

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score: percentage,
        correctAnswers,
        wrongAnswers,
        status: "processing",
        answers: {
          create: answerSubmissions,
        },
      },
      include: {
        answers: true,
      },
    });

    return attempt;
  } catch (error) {
    logger.error("Create quiz attempt failed", {
      error,
    });

    throw error;
  }
};
