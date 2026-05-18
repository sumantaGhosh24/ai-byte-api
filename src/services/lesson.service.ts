import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { lessons } from "../db/schema";

interface GetLessonsParams {
  page: number;
  limit: number;
  search?: string;
  courseId: string;
  status?: "pending" | "processing" | "completed" | "failed";
  visibility?: "public" | "private";
}

export const getAllLessonsService = async ({
  page,
  limit,
  search,
  courseId,
  status,
  visibility,
}: GetLessonsParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [eq(lessons.courseId, courseId)];

    if (search) {
      filters.push(ilike(lessons.title, `%${search}%`));
    }
    if (status) {
      filters.push(eq(lessons.status, status));
    }
    if (visibility) {
      filters.push(eq(lessons.visibility, visibility));
    }

    const whereClause = and(...filters);

    const data = await db.query.lessons.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (lessonsTable, { asc }) => [asc(lessonsTable.orderIndex)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessons)
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
    logger.error("Error fetching paginated lessons", { error });

    throw error;
  }
};

export const getAllPublicLessonsService = async ({
  page,
  limit,
  search,
  courseId,
  status,
}: Omit<GetLessonsParams, "visibility">) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [
      eq(lessons.courseId, courseId),
      eq(lessons.visibility, "public"),
    ];

    if (search) {
      filters.push(ilike(lessons.title, `%${search}%`));
    }
    if (status) {
      filters.push(eq(lessons.status, status));
    }

    const whereClause = and(...filters);

    const data = await db.query.lessons.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (lessonsTable, { asc }) => [asc(lessonsTable.orderIndex)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessons)
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
    logger.error("Error fetching public paginated lessons", { error });

    throw error;
  }
};

export const getLessonService = async (id: string) => {
  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
    });

    if (!lesson) {
      logger.error("Lesson not found");

      throw new Error("Lesson not found");
    }

    return lesson;
  } catch (error) {
    logger.error("Error fetching lesson", { error });

    throw error;
  }
};

export const getPublicLessonService = async (id: string) => {
  try {
    const lesson = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, id), eq(lessons.visibility, "public")),
    });

    if (!lesson) {
      logger.error("Lesson not found");

      throw new Error("Lesson not found");
    }

    return lesson;
  } catch (error) {
    logger.error("Error fetching public lesson", { error });

    throw error;
  }
};

interface CreateLessonParams {
  courseId: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  videoUrl?: string;
  videoPublicId?: string;
  duration: string;
  visibility: "public" | "private";
  status: "pending" | "processing" | "completed" | "failed";
  xpReward: number;
  orderIndex: number;
}

export const createLessonService = async ({
  courseId,
  title,
  content,
  thumbnailUrl,
  thumbnailPublicId,
  videoUrl,
  videoPublicId,
  duration,
  visibility,
  status,
  xpReward,
  orderIndex,
}: CreateLessonParams) => {
  try {
    const [row] = await db
      .insert(lessons)
      .values({
        courseId,
        title: title.toLowerCase(),
        content,
        thumbnailUrl,
        thumbnailPublicId,
        videoUrl,
        videoPublicId,
        duration,
        visibility,
        status,
        xpReward,
        orderIndex,
      })
      .returning();
    return row;
  } catch (error) {
    logger.error("Error creating lesson", { error });

    throw error;
  }
};

interface UpdateLessonParams {
  id: string;
  courseId?: string;
  title?: string;
  content?: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  videoUrl?: string;
  videoPublicId?: string;
  duration?: string;
  visibility?: "public" | "private";
  status?: "pending" | "processing" | "completed" | "failed";
  xpReward?: number;
  orderIndex?: number;
}

export const updateLessonService = async ({
  id,
  courseId,
  title,
  content,
  thumbnailUrl,
  thumbnailPublicId,
  videoUrl,
  videoPublicId,
  duration,
  visibility,
  status,
  xpReward,
  orderIndex,
}: UpdateLessonParams) => {
  try {
    const existingLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
    });

    if (!existingLesson) {
      logger.error("Lesson not found");

      throw new Error("Lesson not found");
    }

    if (orderIndex !== undefined) {
      const targetCourseId =
        courseId !== undefined ? courseId : existingLesson.courseId;
      const conflictingLesson = await db.query.lessons.findFirst({
        where: and(
          eq(lessons.courseId, targetCourseId),
          eq(lessons.orderIndex, orderIndex),
          sql`${lessons.id} != ${id}`
        ),
      });

      if (conflictingLesson) {
        logger.error("Conflicting orderIndex for lesson update", {
          courseId: targetCourseId,
          orderIndex,
        });
        throw new Error(
          "Another lesson in this course already has the requested orderIndex."
        );
      }
    }

    const [lesson] = await db
      .update(lessons)
      .set({
        ...(courseId !== undefined ? { courseId } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(thumbnailPublicId !== undefined ? { thumbnailPublicId } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
        ...(videoPublicId !== undefined ? { videoPublicId } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(xpReward !== undefined ? { xpReward } : {}),
        ...(orderIndex !== undefined ? { orderIndex } : {}),
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  } catch (error) {
    logger.error("Error updating lesson", { error });

    throw error;
  }
};

export const deleteLessonService = async (id: string) => {
  try {
    const existingLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
    });

    if (!existingLesson) {
      logger.error("Lesson not found");
      throw new Error("Lesson not found");
    }

    const courseId = existingLesson.courseId;

    const [deletedLesson] = await db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning();

    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
      orderBy: [asc(lessons.orderIndex)],
    });

    for (let i = 0; i < courseLessons.length; i++) {
      const l = courseLessons[i];
      if (l.orderIndex !== i) {
        await db
          .update(lessons)
          .set({ orderIndex: i, updatedAt: new Date() })
          .where(eq(lessons.id, l.id));
      }
    }

    return deletedLesson;
  } catch (error) {
    logger.error("Error deleting lesson", { error });

    throw error;
  }
};
