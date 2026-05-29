import { generateText } from "ai";
import { logger } from "@sentry/node";

import { prisma } from "../config/db";
import {
  CreateQuizParams,
  GenerateAIQuizParams,
  GenerateQuizParams,
  GetQuizzesParams,
  quizGenerationSchema,
  UpdateQuizParams,
} from "../validations/quiz.validation";
import { Prisma } from "../generated/prisma/client";
import { geminiModel } from "../config/ai";

export const getAllQuizzesService = async ({
  page,
  limit,
  search,
  courseId,
  difficulty,
  status,
  visibility,
}: GetQuizzesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {
      courseId,
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(visibility ? { visibility } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.quiz.count({ where }),
    ]);

    const formattedItems = items.map(quiz => {
      return {
        ...quiz,
        questionsCount: quiz._count.questions,
        attemptsCount: quiz._count.attempts,
      };
    });

    return {
      items: formattedItems,
      paginations: {
        page,
        limit,
        total,
        hasMore: skip + formattedItems.length < total,
        nextPage: skip + formattedItems.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching paginated quizzes", { error });

    throw error;
  }
};

export const getPublicQuizzesService = async ({
  page,
  limit,
  search,
  courseId,
  difficulty,
}: GetQuizzesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {
      visibility: "public",
      status: "completed",
      courseId,
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.quiz.count({ where }),
    ]);

    const formattedItems = items.map(quiz => {
      return {
        ...quiz,
        questionsCount: quiz._count.questions,
        attemptsCount: quiz._count.attempts,
      };
    });

    return {
      items,
      paginations: {
        page,
        limit,
        total,
        hasMore: skip + formattedItems.length < total,
        nextPage: skip + formattedItems.length < total ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching paginated public quizzes", { error });

    throw error;
  }
};

export const getQuizService = async (quizId: string) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      logger.error("Quiz not found");

      throw new Error("NOT_FOUND");
    }

    return quiz;
  } catch (error) {
    logger.error("Error fetching quiz", { error });

    throw error;
  }
};

export const getPublicQuizService = async (quizId: string) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        visibility: "public",
        status: "completed",
      },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      logger.error("Quiz not found");

      throw new Error("NOT_FOUND");
    }

    return quiz;
  } catch (error) {
    logger.error("Error fetching public quiz", { error });

    throw error;
  }
};

export const createQuizService = async ({
  courseId,
  title,
  description,
  difficulty,
  passingScore,
  visibility,
}: CreateQuizParams) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      logger.error("Course not found");

      throw new Error("COURSE_NOT_FOUND");
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        difficulty,
        passingScore,
        visibility,
        status: "completed",
      },
    });

    if (visibility === "public") {
      const course = await prisma.course.findUnique({
        where: { id: quiz.courseId },
        select: { id: true, title: true },
      });

      const enrolledUsers = await prisma.enroll.findMany({
        where: { courseId: quiz.courseId },
        select: { userId: true },
      });

      if (enrolledUsers.length > 0) {
        await prisma.notification.createMany({
          data: enrolledUsers.map(enroll => ({
            userId: enroll.userId,
            title: "A new quiz has been published!",
            message: `A new quiz has been published in the course "${course?.title}". Check it out!`,
            type: "quiz",
            relatedQuizId: quiz?.id,
            quizId: quiz?.id,
            read: false,
            sentAt: new Date(),
          })),
        });
      }
    }

    return quiz;
  } catch (error) {
    logger.error("Error creating quiz", { error });

    throw error;
  }
};

export const updateQuizService = async ({
  quizId,
  courseId,
  title,
  description,
  difficulty,
  passingScore,
  visibility,
}: UpdateQuizParams) => {
  try {
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!existingQuiz) {
      logger.error("Quiz not found");

      throw new Error("NOT_FOUND");
    }

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(courseId !== undefined ? { courseId } : {}),
        ...(title !== undefined ? { title: title.toLowerCase() } : {}),
        ...(description !== undefined
          ? { description: description.toLowerCase() }
          : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(passingScore !== undefined ? { passingScore } : {}),
      },
    });

    if (existingQuiz.visibility === "private" && visibility === "public") {
      const course = await prisma.course.findUnique({
        where: { id: quiz.courseId },
        select: { id: true, title: true },
      });

      const enrolledUsers = await prisma.enroll.findMany({
        where: { courseId: quiz.courseId },
        select: { userId: true },
      });

      if (enrolledUsers.length > 0) {
        await prisma.notification.createMany({
          data: enrolledUsers.map(enroll => ({
            userId: enroll.userId,
            title: "A new quiz has been published!",
            message: `A new quiz has been published in the course "${course?.title}". Check it out!`,
            type: "quiz",
            relatedQuizId: quiz?.id,
            quizId: quiz?.id,
            read: false,
            sentAt: new Date(),
          })),
        });
      }
    }

    return quiz;
  } catch (error) {
    logger.error("Error updating quiz", { error });

    throw error;
  }
};

export const deleteQuizService = async (quizId: string) => {
  try {
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!existingQuiz) {
      logger.error("Quiz not found");

      throw new Error("NOT_FOUND");
    }

    const quiz = await prisma.quiz.delete({
      where: { id: quizId },
    });

    return quiz;
  } catch (error) {
    logger.error("Error deleting quiz", { error });

    throw error;
  }
};

export const generateQuizWithAIService = async ({
  topic,
  difficulty,
  title,
  description,
  numberOfQuestions,
}: GenerateQuizParams) => {
  try {
    const prompt = `
      Generate a production-grade quiz questions.
  
      Topic: ${topic}
  
      Difficulty: ${difficulty}
  
      Course Title: ${title}
  
      Course Description: ${description}

      Number of questions: ${numberOfQuestions}
  
      STRICT JSON ONLY.
  
      {
        "title": "string",
        "description": "string",
        "passingScore": "number"

        "questions": [
          {
            "question": "string",
            "explanation": "string",

            "options": [
              {
                "text": "string",
                "isCorrect": true
              }
            ]
          }
        ]
      }
  
      Rules:
      - Passing score should be 1 to 100
      - STRICT JSON ONLY
      - No markdown
      - No code blocks
      - No explanations
      - Every question must have exactly 4 options
      - Only ONE option can be correct
      - Generate educational content
      - JSON must be parsable
    `;

    const result = await generateText({
      model: geminiModel,
      prompt,
      temperature: 0.7,
    });

    const cleaned = result.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      logger.error("Invalid AI JSON", {
        error,
      });

      throw new Error("INVALID_AI_JSON", { cause: error });
    }

    const validated = quizGenerationSchema.safeParse(parsed);

    if (!validated.success) {
      logger.error("AI schema validation failed", {
        errors: validated.error,
      });

      throw new Error("INVALID_AI_SCHEMA");
    }

    return validated.data;
  } catch (error) {
    logger.error("Generate quiz AI failed", { error });

    throw error;
  }
};

export const generateQuizService = async ({
  topic,
  difficulty,
  courseId,
}: Partial<GenerateAIQuizParams>) => {
  try {
    const quiz = await prisma.quiz.create({
      data: {
        title: `Generating quiz: ${topic}`,
        description: "AI is generating this quiz.",
        difficulty,
        visibility: "private",
        status: "processing",
        aiGenerated: true,
        courseId: courseId as string,
        passingScore: 1,
      },
    });

    return quiz;
  } catch (error) {
    logger.error("Generate quiz service failed", {
      error,
    });

    throw error;
  }
};
