import { logger } from "@sentry/node";
import { generateText } from "ai";

import { geminiModel } from "../config/ai";
import { prisma } from "../config/db";
import {
  CreateLessonParams,
  FixLessonOrderParams,
  GenerateAILessonParams,
  GenerateLessonParams,
  GetLessonsParams,
  lessonGenerationSchema,
  UpdateLesssonParams,
} from "../validations/lesson.validation";
import { Prisma } from "../generated/prisma/client";
import { inngest } from "../inngest/client";

export const getAllLessonsService = async ({
  page,
  limit,
  search,
  difficulty,
  visibility,
  status,
  courseId,
}: GetLessonsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {
      courseId,
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(visibility ? { visibility } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          _count: {
            select: {
              progress: true,
            },
          },
        },
        orderBy: { orderIndex: "asc" },
        skip,
        take: limit,
      }),

      prisma.lesson.count({ where }),
    ]);

    const formattedItems = items.map(lesson => {
      return {
        ...lesson,
        progressCount: lesson._count.progress,
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
    logger.error("Error fetching paginated lessons with relations", { error });

    throw error;
  }
};

export const getPublicLessonsService = async ({
  page,
  limit,
  search,
  userId,
  difficulty,
  courseId,
}: GetLessonsParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {
      visibility: "public",
      status: "completed",
      courseId,
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          _count: {
            select: {
              progress: true,
            },
          },
          progress: {
            where: { userId },
            select: {
              id: true,
              completed: true,
              startedAt: true,
              finishedAt: true,
            },
          },
        },
        orderBy: { orderIndex: "asc" },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ]);

    const formattedItems = items.map(lesson => {
      const userProgress =
        userId && "progress" in lesson ? (lesson.progress[0] ?? null) : null;

      return {
        ...lesson,
        progressCount: lesson._count.progress,
        isCompleted: userProgress?.completed ?? false,
        progress: userProgress,
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
    logger.error("Error fetching paginated public lessons", { error });

    throw error;
  }
};

export const getLessonService = async (lessonId: string) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            visibility: true,
            status: true,
          },
        },
        _count: {
          select: { progress: true },
        },
      },
    });

    if (!lesson) {
      logger.error("Lesson not found");

      throw new Error("NOT_FOUND");
    }

    return lesson;
  } catch (error) {
    logger.error("Error fetching lesson", { error });

    throw error;
  }
};

export const getPublicLessonService = async (
  lessonId: string,
  userId: string
) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        visibility: "public",
        status: "completed",
        course: {
          visibility: "public",
          status: "completed",
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        progress: {
          where: { userId },
          select: {
            id: true,
            completed: true,
            startedAt: true,
            finishedAt: true,
          },
        },
        _count: {
          select: { progress: true },
        },
      },
    });

    if (!lesson) {
      logger.error("Lesson not found");

      throw new Error("NOT_FOUND");
    }

    const userProgress =
      userId && "progress" in lesson ? (lesson.progress[0] ?? null) : null;

    return {
      ...lesson,
      isCompleted: userProgress?.completed ?? false,
      progress: userProgress,
    };
  } catch (error) {
    logger.error("Error fetching public lesson", { error });

    throw error;
  }
};

export const createLessonService = async ({
  courseId,
  title,
  content,
  thumbnailUrl,
  thumbnailPublicId,
  videoUrl,
  videoPublicId,
  duration,
  difficulty,
  visibility,
}: CreateLessonParams) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { lessons: true } } },
    });

    if (!course) {
      logger.error("Course not found");

      throw new Error("COURSE_NOT_FOUND");
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: title.toLowerCase(),
        content,
        thumbnailUrl,
        thumbnailPublicId,
        videoUrl,
        videoPublicId,
        duration,
        difficulty,
        visibility,
        orderIndex: course._count.lessons + 1,
        status: "completed",
      },
    });

    if (visibility === "public") {
      await inngest.send({
        name: "lesson/published",
        data: {
          lessonId: lesson.id,
          courseId: lesson.courseId,
        },
      });
    }

    return lesson;
  } catch (error) {
    logger.error("Error creating lesson", { error });

    throw error;
  }
};

export const updateLessonService = async ({
  lessonId,
  courseId,
  content,
  duration,
  title,
  difficulty,
  status,
  thumbnailPublicId,
  thumbnailUrl,
  videoPublicId,
  videoUrl,
  visibility,
}: UpdateLesssonParams) => {
  try {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson) {
      logger.error("Lesson not found");

      throw new Error("NOT_FOUND");
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: title.toLowerCase(),
        ...(courseId !== undefined ? { courseId } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(thumbnailPublicId !== undefined ? { thumbnailPublicId } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
        ...(videoPublicId !== undefined ? { videoPublicId } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    if (existingLesson.visibility === "private" && visibility === "public") {
      await inngest.send({
        name: "lesson/published",
        data: {
          lessonId: lesson.id,
          courseId: lesson.courseId,
        },
      });
    }

    return lesson;
  } catch (error) {
    logger.error("Error updating lesson", { error });

    throw error;
  }
};

export const deleteLessonService = async (lessonId: string) => {
  try {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson) {
      logger.error("Lesson not found");

      throw new Error("NOT_FOUND");
    }

    const lesson = await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return lesson;
  } catch (error) {
    logger.error("Error deleting lesson", { error });

    throw error;
  }
};

export const fixLessonOrderService = async ({
  courseId,
  lessons,
}: FixLessonOrderParams) => {
  try {
    const updatedLessons = await prisma.$transaction(
      lessons.map(lesson =>
        prisma.lesson.update({
          where: {
            id: lesson.id,
            courseId,
          },
          data: {
            orderIndex: lesson.orderIndex,
          },
        })
      )
    );

    return updatedLessons;
  } catch (error) {
    logger.error("Error fixing lesson order", { error });

    throw error;
  }
};

export const generateLessonWithAIService = async ({
  topic,
  difficulty,
  title,
  description,
}: GenerateLessonParams) => {
  try {
    const prompt = `
      Generate a production-grade lesson.
  
      Topic: ${topic}
  
      Difficulty: ${difficulty}
  
      Course Title: ${title}
  
      Course Description: ${description}
  
      STRICT JSON ONLY.
  
      {
        "title": "string",
        "content": "string",
        "summary": "string",
        "duration": "string"
      }
  
      Rules:
      - STRICT JSON ONLY
      - No markdown
      - No code blocks
      - No explanations
      - Generate educational content
      - Make lesson content detailed
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

    const validated = lessonGenerationSchema.safeParse(parsed);

    if (!validated.success) {
      logger.error("AI schema validation failed", {
        errors: validated.error,
      });

      throw new Error("INVALID_AI_SCHEMA");
    }

    return validated.data;
  } catch (error) {
    logger.error("Generate lesson AI failed", { error });

    throw error;
  }
};

export const generateLessonService = async ({
  topic,
  difficulty,
  courseId,
  thumbnailUrl,
  thumbnailPublicId,
  videoUrl,
  videoPublicId,
}: Partial<GenerateAILessonParams>) => {
  try {
    const lesson = await prisma.lesson.create({
      data: {
        title: `Generating lesson: ${topic}`,
        content: "AI is generating this lesson.",
        courseId: courseId as string,
        difficulty,
        duration: "10 mins",
        visibility: "private",
        status: "processing",
        aiGenerated: true,
        orderIndex: 1,
        thumbnailUrl,
        thumbnailPublicId,
        videoUrl,
        videoPublicId,
      },
    });

    return lesson;
  } catch (error) {
    logger.error("Generate lesson service failed", {
      error,
    });

    throw error;
  }
};
