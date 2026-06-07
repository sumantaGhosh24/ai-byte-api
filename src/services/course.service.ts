import { logger } from "@sentry/node";
import { generateText } from "ai";

import { prisma } from "../config/db";
import {
  courseGenerationSchema,
  CreateCourseParams,
  GenerateAICourseParams,
  GenerateCourseParams,
  GetCoursesParams,
  GetMyCoursesParams,
  UpdateCourseParams,
} from "../validations/course.validation";
import { Prisma } from "../generated/prisma/client";
import { geminiModel } from "../config/ai";
import { inngest } from "../inngest/client";

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
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(visibility ? { visibility } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              quizzes: true,
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.course.count({ where }),
    ]);

    const formattedItems = items.map(course => {
      const averageReview =
        course.reviews.length > 0
          ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
            course.reviews.length
          : 0;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        quizzesCount: course._count.quizzes,
        enrollsCount: course._count.enrolls,
        bookmarksCount: course._count.bookmarks,
        reviewsCount: course._count.reviews,
        averageReview,
        _count: undefined,
        reviews: undefined,
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
    logger.error("Error fetching paginated courses with relations", { error });

    throw error;
  }
};

export const getPublicCoursesService = async ({
  page,
  limit,
  search,
  userId,
  categoryId,
  difficulty,
}: GetCoursesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      visibility: "public",
      status: "completed",
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              lessons: {
                where: { visibility: "public" },
              },
              quizzes: {
                where: { visibility: "public" },
              },
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
          enrolls: {
            where: { userId },
            select: {
              id: true,
              completed: true,
              finishedLessons: true,
              startedAt: true,
              finishedAt: true,
            },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    const formattedItems = items.map(course => {
      const averageReview =
        course.reviews.length > 0
          ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
            course.reviews.length
          : 0;

      const isEnrolled =
        userId && "enrolls" in course ? course.enrolls.length > 0 : false;

      const isBookmarked =
        userId && "bookmarks" in course ? course.bookmarks.length > 0 : false;

      const enrollment =
        userId && "enrolls" in course ? (course.enrolls[0] ?? null) : null;

      const bookmark =
        userId && "bookmarks" in course ? (course.bookmarks[0] ?? null) : null;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        quizzesCount: course._count.quizzes,
        enrollsCount: course._count.enrolls,
        bookmarksCount: course._count.bookmarks,
        reviewsCount: course._count.reviews,
        averageReview,
        isEnrolled,
        isBookmarked,
        enrollment,
        bookmark,
        _count: undefined,
        reviews: undefined,
        enrolls: undefined,
        bookmarks: undefined,
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
    logger.error("Error fetching paginated public courses", { error });

    throw error;
  }
};

export const getMyCoursesService = async ({
  userId,
  page,
  limit,
  search,
  categoryId,
  difficulty,
}: GetMyCoursesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      visibility: "public",
      status: "completed",
      enrolls: {
        some: { userId },
      },
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              lessons: {
                where: { visibility: "public" },
              },
              quizzes: {
                where: { visibility: "public" },
              },
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
          enrolls: {
            where: { userId },
            select: {
              id: true,
              completed: true,
              finishedLessons: true,
              startedAt: true,
              finishedAt: true,
            },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: {
          enrolls: { _count: "desc" },
        },
        skip,
        take: limit,
      }),

      prisma.course.count({ where }),
    ]);

    const formattedItems = items.map(course => {
      const averageReview =
        course.reviews.length > 0
          ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
            course.reviews.length
          : 0;

      const isEnrolled =
        userId && "enrolls" in course ? course.enrolls.length > 0 : false;

      const isBookmarked =
        userId && "bookmarks" in course ? course.bookmarks.length > 0 : false;

      const enrollment =
        userId && "enrolls" in course ? (course.enrolls[0] ?? null) : null;

      const bookmark =
        userId && "bookmarks" in course ? (course.bookmarks[0] ?? null) : null;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        quizzesCount: course._count.quizzes,
        enrollsCount: course._count.enrolls,
        bookmarksCount: course._count.bookmarks,
        reviewsCount: course._count.reviews,
        averageReview,
        isEnrolled,
        isBookmarked,
        enrollment,
        bookmark,
        _count: undefined,
        reviews: undefined,
        enrolls: undefined,
        bookmarks: undefined,
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
    logger.error("Error fetching my courses", { error });

    throw error;
  }
};

export const getRecommendedCoursesService = async ({
  userId,
  page,
  limit,
  search,
  categoryId,
  difficulty,
}: GetMyCoursesParams) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { interests: true },
    });

    const interests = profile?.interests || [];

    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      visibility: "public",
      status: "completed",
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const courses = await prisma.course.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            imagePublicId: true,
            visibility: true,
          },
        },
        _count: {
          select: {
            enrolls: true,
            bookmarks: true,
            reviews: true,
            lessons: {
              where: { visibility: "public" },
            },
            quizzes: {
              where: { visibility: "public" },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
        enrolls: {
          where: { userId },
          select: {
            id: true,
            completed: true,
            finishedLessons: true,
            startedAt: true,
            finishedAt: true,
          },
        },
        bookmarks: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filteredCourses = courses;

    if (interests.length > 0) {
      const interestsLower = interests.map(i => i.toLowerCase());

      filteredCourses = courses.filter(course =>
        interestsLower.some(interest =>
          course.title.toLowerCase().includes(interest)
        )
      );
    }

    const paginatedCourses = filteredCourses.slice(skip, skip + limit);

    const formattedItems = paginatedCourses.map(course => {
      const averageReview =
        course.reviews.length > 0
          ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
            course.reviews.length
          : 0;

      const isEnrolled =
        userId && "enrolls" in course ? course.enrolls.length > 0 : false;

      const isBookmarked =
        userId && "bookmarks" in course ? course.bookmarks.length > 0 : false;

      const enrollment =
        userId && "enrolls" in course ? (course.enrolls[0] ?? null) : null;

      const bookmark =
        userId && "bookmarks" in course ? (course.bookmarks[0] ?? null) : null;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        quizzesCount: course._count.quizzes,
        enrollsCount: course._count.enrolls,
        bookmarksCount: course._count.bookmarks,
        reviewsCount: course._count.reviews,
        averageReview,
        isEnrolled,
        isBookmarked,
        enrollment,
        bookmark,
        _count: undefined,
        reviews: undefined,
        enrolls: undefined,
        bookmarks: undefined,
      };
    });

    return {
      items: formattedItems,
      paginations: {
        page,
        limit,
        total: filteredCourses.length,
        hasMore: skip + paginatedCourses.length < filteredCourses.length,
        nextPage:
          skip + paginatedCourses.length < filteredCourses.length
            ? page + 1
            : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages: Math.ceil(filteredCourses.length / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching recommended courses", { error });

    throw error;
  }
};

export const getBookmarkCoursesService = async ({
  userId,
  page,
  limit,
  search,
  categoryId,
  difficulty,
}: GetMyCoursesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      visibility: "public",
      status: "completed",
      bookmarks: {
        some: { userId },
      },
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              lessons: {
                where: { visibility: "public" },
              },
              quizzes: {
                where: { visibility: "public" },
              },
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
          enrolls: {
            where: { userId },
            select: {
              id: true,
              completed: true,
              finishedLessons: true,
              startedAt: true,
              finishedAt: true,
            },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.course.count({ where }),
    ]);

    const formattedItems = items.map(course => {
      const averageReview =
        course.reviews.length > 0
          ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
            course.reviews.length
          : 0;

      const isEnrolled =
        userId && "enrolls" in course ? course.enrolls.length > 0 : false;

      const isBookmarked =
        userId && "bookmarks" in course ? course.bookmarks.length > 0 : false;

      const enrollment =
        userId && "enrolls" in course ? (course.enrolls[0] ?? null) : null;

      const bookmark =
        userId && "bookmarks" in course ? (course.bookmarks[0] ?? null) : null;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        quizzesCount: course._count.quizzes,
        enrollsCount: course._count.enrolls,
        bookmarksCount: course._count.bookmarks,
        reviewsCount: course._count.reviews,
        averageReview,
        isEnrolled,
        isBookmarked,
        enrollment,
        bookmark,
        _count: undefined,
        reviews: undefined,
        enrolls: undefined,
        bookmarks: undefined,
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
    logger.error("Error fetching my bookmarks", { error });

    throw error;
  }
};

export const getTrendingCoursesService = async ({
  page,
  limit,
  search,
  userId,
  categoryId,
  difficulty,
}: GetMyCoursesParams) => {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      visibility: "public",
      status: "completed",
      ...(search
        ? { title: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              lessons: {
                where: { visibility: "public" },
              },
              quizzes: {
                where: { visibility: "public" },
              },
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
          enrolls: {
            where: { userId },
            select: {
              id: true,
              completed: true,
              finishedLessons: true,
              startedAt: true,
              finishedAt: true,
            },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: {
          enrolls: { _count: "desc" },
        },
        skip,
        take: limit,
      }),

      prisma.course.count({ where }),
    ]);

    const formattedItems = items.map(course => {
      const averageReview =
        course.reviews.length > 0
          ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
            course.reviews.length
          : 0;

      const isEnrolled =
        userId && "enrolls" in course ? course.enrolls.length > 0 : false;

      const isBookmarked =
        userId && "bookmarks" in course ? course.bookmarks.length > 0 : false;

      const enrollment =
        userId && "enrolls" in course ? (course.enrolls[0] ?? null) : null;

      const bookmark =
        userId && "bookmarks" in course ? (course.bookmarks[0] ?? null) : null;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        quizzesCount: course._count.quizzes,
        enrollsCount: course._count.enrolls,
        bookmarksCount: course._count.bookmarks,
        reviewsCount: course._count.reviews,
        averageReview,
        isEnrolled,
        isBookmarked,
        enrollment,
        bookmark,
        _count: undefined,
        reviews: undefined,
        enrolls: undefined,
        bookmarks: undefined,
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
    logger.error("Error fetching trending courses", { error });

    throw error;
  }
};

export const getCourseService = async (courseId: string) => {
  try {
    const [course, averageReview] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              quizzes: true,
              enrolls: true,
              bookmarks: true,
              reviews: true,
            },
          },
        },
      }),

      prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
      }),
    ]);

    if (!course) {
      logger.error("Course not found");

      throw new Error("NOT_FOUND");
    }

    return {
      ...course,
      lessonsCount: course._count.lessons,
      quizzesCount: course._count.quizzes,
      enrollsCount: course._count.enrolls,
      bookmarksCount: course._count.bookmarks,
      reviewsCount: course._count.reviews,
      averageReview: averageReview._avg.rating || 0,
    };
  } catch (error) {
    logger.error("Error fetching course", { error });

    throw error;
  }
};

export const getMyCourseService = async (courseId: string, userId: string) => {
  try {
    const [course, averageReview] = await Promise.all([
      prisma.course.findFirst({
        where: {
          id: courseId,
          visibility: "public",
          status: "completed",
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              imagePublicId: true,
              visibility: true,
            },
          },
          _count: {
            select: {
              enrolls: true,
              bookmarks: true,
              reviews: true,
              lessons: {
                where: { visibility: "public" },
              },
              quizzes: {
                where: { visibility: "public" },
              },
            },
          },
          enrolls: {
            where: { userId },
            select: {
              id: true,
              completed: true,
              finishedLessons: true,
              startedAt: true,
              finishedAt: true,
            },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
      }),

      prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
      }),
    ]);

    if (!course) {
      logger.error("Course not found");

      throw new Error("NOT_FOUND");
    }

    const isEnrolled =
      userId && "enrolls" in course ? course.enrolls.length > 0 : false;

    const isBookmarked =
      userId && "bookmarks" in course ? course.bookmarks.length > 0 : false;

    const enrollment =
      userId && "enrolls" in course ? (course.enrolls[0] ?? null) : null;

    const bookmark =
      userId && "bookmarks" in course ? (course.bookmarks[0] ?? null) : null;

    return {
      ...course,
      lessonsCount: course._count.lessons,
      quizzesCount: course._count.quizzes,
      enrollsCount: course._count.enrolls,
      bookmarksCount: course._count.bookmarks,
      reviewsCount: course._count.reviews,
      averageReview: averageReview._avg.rating || 0,
      isEnrolled,
      isBookmarked,
      enrollment,
      bookmark,
    };
  } catch (error) {
    logger.error("Error fetching my course", { error });

    throw error;
  }
};

export const createCourseService = async ({
  categoryId,
  title,
  description,
  thumbnailUrl,
  thumbnailPublicId,
  difficulty,
  duration,
  visibility,
}: CreateCourseParams) => {
  try {
    const course = await prisma.course.create({
      data: {
        categoryId,
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        thumbnailUrl,
        thumbnailPublicId,
        difficulty,
        duration,
        visibility,
        status: "completed",
      },
    });

    if (visibility === "public") {
      await inngest.send({
        name: "course/published",
        data: {
          courseId: course.id,
          title: course.title,
        },
      });
    }

    return course;
  } catch (error) {
    logger.error("Error creating course", { error });

    throw error;
  }
};

export const updateCourseService = async ({
  courseId,
  categoryId,
  title,
  description,
  thumbnailUrl,
  thumbnailPublicId,
  difficulty,
  duration,
  visibility,
  status,
}: UpdateCourseParams) => {
  try {
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      logger.error("Course not found");

      throw new Error("NOT_FOUND");
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        categoryId,
        difficulty,
        visibility,
        status,
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(thumbnailPublicId !== undefined ? { thumbnailPublicId } : {}),
        duration,
      },
    });

    if (existingCourse.visibility === "private" && visibility === "public") {
      await inngest.send({
        name: "course/published",
        data: {
          courseId: course.id,
          title: course.title,
        },
      });
    }

    return course;
  } catch (error) {
    logger.error("Error updating course", { error });

    throw error;
  }
};

export const deleteCourseService = async (id: string) => {
  try {
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      logger.error("Course not found");

      throw new Error("NOT_FOUND");
    }

    const course = await prisma.course.delete({
      where: { id },
    });

    return course;
  } catch (error) {
    logger.error("Error deleting course", { error });

    throw error;
  }
};

export const generateCourseWithAIService = async ({
  topic,
  difficulty,
  lessonCount,
}: GenerateCourseParams) => {
  try {
    const prompt = `
      Generate a complete production-grade learning course.

      Topic: ${topic}

      Difficulty: ${difficulty}

      Number of lessons: ${lessonCount}

      Return STRICT VALID JSON ONLY.

      JSON Structure:

      {
        "title": "string",
        "description": "string",

        "lessons": [
          {
            "title": "string",
            "summary": "string",
            "content": "string",
            "duration": "string"
          }
        ],

        "quiz": {
          "title": "string",
          "description": "string",

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
      }

      Rules:
      - STRICT JSON ONLY
      - No markdown
      - No code blocks
      - No explanations
      - Every question must have exactly 4 options
      - Only ONE option can be correct
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

    const validated = courseGenerationSchema.safeParse(parsed);

    if (!validated.success) {
      logger.error("AI schema validation failed", {
        errors: validated.error,
      });

      throw new Error("INVALID_AI_SCHEMA");
    }

    return validated.data;
  } catch (error) {
    logger.error("Generate course AI failed", { error });

    throw error;
  }
};

export const generateCourseService = async ({
  topic,
  difficulty,
  lessonCount,
  categoryId,
  thumbnailUrl,
  thumbnailPublicId,
}: GenerateAICourseParams) => {
  try {
    const course = await prisma.course.create({
      data: {
        categoryId,
        title: `Generating course: ${topic}`,
        description: "AI is generating this course.",
        difficulty,
        duration: `${lessonCount * 10} mins`,
        visibility: "private",
        status: "processing",
        aiGenerated: true,
        thumbnailUrl,
        thumbnailPublicId,
      },
    });

    return course;
  } catch (error) {
    logger.error("Generate course service failed", {
      error,
    });

    throw error;
  }
};
