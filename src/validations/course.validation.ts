import { z } from "zod";

export const courseIdSchema = z.object({
  id: z.string().min(1, { message: "course id is required" }),
});

export const courseDifficultyEnum = z.enum([
  "beginner",
  "intermediate",
  "expert",
]);

export const courseVisibilityEnum = z.enum(["public", "private"]);

export const courseStatusEnum = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .min(1, { message: "Page must be at least 1" })
    .default(1),
  limit: z.coerce
    .number()
    .min(1, { message: "Limit must be at least 1" })
    .max(100, { message: "Limit must not exceed 100" })
    .default(10),
  search: z.string().trim().optional(),
});

export const courseSchema = paginationQuerySchema.extend({
  categoryId: z.string().optional(),
  difficulty: courseDifficultyEnum.optional(),
  visibility: courseVisibilityEnum.optional(),
  status: courseStatusEnum.optional(),
});

export type GetCoursesParams = z.infer<typeof courseSchema>;

export const myCourseSchema = paginationQuerySchema.extend({
  userId: z.string().min(1, { message: "User id is requiired" }),
  categoryId: z.string().optional(),
  difficulty: courseDifficultyEnum.optional(),
});

export type GetMyCoursesParams = z.infer<typeof myCourseSchema>;

export const createCourseSchema = z.object({
  categoryId: z.string().min(1, { message: "Category id is required" }),
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(5000, { message: "Description must not exceed 5000 characters" }),
  thumbnailUrl: z.string().min(1, { message: "Thumbnail URL is required" }),
  thumbnailPublicId: z
    .string()
    .trim()
    .min(1, { message: "Thumbnail public id is required" }),
  difficulty: courseDifficultyEnum,
  duration: z.string().min(1, { message: "Duration is required" }),
  visibility: courseVisibilityEnum,
});

export type CreateCourseParams = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  categoryId: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(5000, { message: "Description must not exceed 5000 characters" }),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z
    .string()
    .trim()
    .min(1, { message: "Thumbnail public id is required" })
    .optional(),
  difficulty: courseDifficultyEnum.optional(),
  duration: z.string().optional(),
  visibility: courseVisibilityEnum.optional(),
  status: courseStatusEnum.optional(),
});

export type UpdateCourseParams = z.infer<typeof updateCourseSchema>;

export const generateAICourseSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, { message: "Topic must be at least 3 characters" })
    .max(200, { message: "Topic must not exceed 200 characters" }),
  categoryId: z.string().min(1, { message: "Category id is required" }),
  thumbnailUrl: z.string().min(1, { message: "Thumbnail URL is required" }),
  thumbnailPublicId: z
    .string()
    .trim()
    .min(1, { message: "Thumbnail public id is required" }),
  difficulty: z.enum(["beginner", "intermediate", "expert"]),
  lessonCount: z
    .number()
    .min(1, { message: "Lesson count must be at least 1" })
    .max(50, { message: "Lesson count must not exceed 50" }),
});

export type GenerateAICourseParams = z.infer<typeof generateAICourseSchema>;

export type GenerateCourseParams = Omit<
  GenerateAICourseParams,
  "categoryId" | "thumbnailUrl" | "thumbnailPublicId"
>;

export const courseGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  lessons: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      content: z.string(),
      duration: z.string(),
    })
  ),
  quiz: z.object({
    title: z.string(),
    description: z.string(),
    questions: z.array(
      z.object({
        question: z.string(),
        explanation: z.string(),
        options: z
          .array(
            z.object({
              text: z.string(),
              isCorrect: z.boolean(),
            })
          )
          .length(4),
      })
    ),
  }),
});
