import { and, eq, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";
import { generateText } from "ai";
import { z } from "zod";

import { db } from "../db";
import { courses } from "../db/schema";
import { geminiModel } from "../config/ai";

interface GetCoursesParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  visibility?: "public" | "private";
  status?: "pending" | "processing" | "completed" | "failed";
}

export const getAllCoursesService = async ({
  page,
  limit,
  search,
  categoryId,
  difficulty,
  visibility,
  status,
}: GetCoursesParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [];

    if (search) {
      filters.push(ilike(courses.title, `%${search}%`));
    }
    if (categoryId) {
      filters.push(eq(courses.categoryId, categoryId));
    }
    if (difficulty) {
      filters.push(eq(courses.difficulty, difficulty));
    }
    if (visibility) {
      filters.push(eq(courses.visibility, visibility));
    }
    if (status) {
      filters.push(eq(courses.status, status));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.courses.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (courses, { desc }) => [desc(courses.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
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
    logger.error("Error fetching paginated courses", { error });

    throw error;
  }
};

export const getPublicCoursesService = async ({
  page,
  limit,
  search,
  categoryId,
  difficulty,
  status,
}: GetCoursesParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [eq(courses.visibility, "public")];

    if (search) {
      filters.push(ilike(courses.title, `%${search}%`));
    }
    if (categoryId) {
      filters.push(eq(courses.categoryId, categoryId));
    }
    if (difficulty) {
      filters.push(eq(courses.difficulty, difficulty));
    }
    if (status) {
      filters.push(eq(courses.status, status));
    }

    const whereClause = and(...filters);

    const data = await db.query.courses.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (courses, { desc }) => [desc(courses.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
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
    logger.error("Error fetching public paginated courses", { error });

    throw error;
  }
};

export const getCourseService = async (id: string) => {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
    });

    if (!course) {
      logger.error("Course not found");

      throw new Error("Course not found");
    }

    return course;
  } catch (error) {
    logger.error("Error fetching course", { error });

    throw error;
  }
};

export const getPublicCourseService = async (id: string) => {
  try {
    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, id), eq(courses.visibility, "public")),
    });

    if (!course) {
      logger.error("Course not found");

      throw new Error("Course not found");
    }

    return course;
  } catch (error) {
    logger.error("Error fetching public course", { error });

    throw error;
  }
};

interface CreateCourseParams {
  categoryId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  visibility: "public" | "private";
  status: "pending" | "processing" | "completed" | "failed";
  xpReward: number;
}

export const createCourseService = async ({
  categoryId,
  title,
  description,
  thumbnailUrl,
  thumbnailPublicId,
  difficulty,
  duration,
  visibility,
  status,
  xpReward,
}: CreateCourseParams) => {
  try {
    const [row] = await db
      .insert(courses)
      .values({
        categoryId,
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        thumbnailUrl,
        thumbnailPublicId,
        difficulty,
        duration,
        visibility,
        status,
        xpReward,
      })
      .returning();

    return row;
  } catch (error) {
    logger.error("Error creating course", { error });

    throw error;
  }
};

const courseSchema = z.object({
  title: z.string(),
  description: z.string(),
  lessons: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      quizQuestion: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
      explanation: z.string(),
    })
  ),
});

type GenerateCourseInput = {
  topic: string;
  difficulty: string;
  lessonCount: number;
};

export const generateCourseWithAI = async ({
  topic,
  difficulty,
  lessonCount,
}: GenerateCourseInput) => {
  const prompt = `
Generate a complete learning course as STRICT JSON only.

Topic: ${topic}
Difficulty: ${difficulty}
Lessons: ${lessonCount}

Return this exact structure:

{
  "title": "string",
  "description": "string",
  "lessons": [
    {
      "title": "string",
      "summary": "string",
      "quizQuestion": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Rules:
- No markdown
- No code blocks
- No explanations
- JSON only
- Valid parsable JSON only
`;

  const result = await generateText({
    model: geminiModel,
    prompt,
  });

  let parsed;

  try {
    parsed = JSON.parse(result.text);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const validated = courseSchema.parse(parsed);

  return validated;
};

interface UpdateCourseParams {
  id: string;
  categoryId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: string;
  visibility?: "public" | "private";
  status?: "pending" | "processing" | "completed" | "failed";
  xpReward?: number;
}

export const updateCourseService = async ({
  id,
  categoryId,
  title,
  description,
  thumbnailUrl,
  thumbnailPublicId,
  difficulty,
  duration,
  visibility,
  status,
  xpReward,
}: UpdateCourseParams) => {
  try {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, id),
    });

    if (!existingCourse) {
      logger.error("Course not found");

      throw new Error("Course not found");
    }

    const [course] = await db
      .update(courses)
      .set({
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(title !== undefined ? { title: title.toLowerCase() } : {}),
        ...(description !== undefined
          ? { description: description.toLowerCase() }
          : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(thumbnailPublicId !== undefined ? { thumbnailPublicId } : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(xpReward !== undefined ? { xpReward } : {}),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    return course;
  } catch (error) {
    logger.error("Error updating course", { error });

    throw error;
  }
};

export const deleteCourseService = async (id: string) => {
  try {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, id),
    });

    if (!existingCourse) {
      logger.error("Course not found");

      throw new Error("Course not found");
    }

    const [course] = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning();

    return course;
  } catch (error) {
    logger.error("Error deleting course", { error });

    throw error;
  }
};
