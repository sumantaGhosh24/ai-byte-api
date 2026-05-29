import { z } from "zod";

export const lessonIdSchema = z.object({
  id: z.string().min(1, { message: "Lesson id is required" }),
});

export const lessonDifficultyEnum = z.enum([
  "beginner",
  "intermediate",
  "expert",
]);

export const lessonVisibilityEnum = z.enum(["public", "private"]);

export const lessonStatusEnum = z.enum([
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

export const lessonsSchema = paginationQuerySchema.extend({
  courseId: z.string().optional(),
  difficulty: lessonDifficultyEnum.optional(),
  visibility: lessonVisibilityEnum.optional(),
  status: lessonStatusEnum.optional(),
});

export type GetLessonsParams = z.infer<typeof lessonsSchema>;

export const createLessonSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  content: z
    .string()
    .min(10, { message: "Content must be at least 10 characters" })
    .max(5000, { message: "Content must not exceed 5000 characters" }),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  videoUrl: z.string().optional(),
  videoPublicId: z.string().optional(),
  duration: z
    .string()
    .min(1, { message: "Duration is required" })
    .max(100, { message: "Duration must not exceed 100 characters" }),
  difficulty: lessonDifficultyEnum,
  visibility: lessonVisibilityEnum,
});

export type CreateLessonParams = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z.object({
  lessonId: z.string().min(1, { message: "Lesson id is required" }),
  courseId: z.string().optional(),
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  content: z
    .string()
    .min(10, { message: "Content must be at least 10 characters" })
    .max(10000, { message: "Content must not exceed 10000 characters" }),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  videoUrl: z.string().optional(),
  videoPublicId: z.string().optional(),
  duration: z
    .string()
    .min(1, { message: "Duration is required" })
    .max(100, { message: "Duration must not exceed 100 characters" }),
  difficulty: lessonDifficultyEnum.optional(),
  visibility: lessonVisibilityEnum.optional(),
  status: lessonStatusEnum.optional(),
});

export type UpdateLesssonParams = z.infer<typeof updateLessonSchema>;

export const fixLessonOrderSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  lessons: z.array(
    z.object({
      id: z.string().min(1, { message: "Lesson id is required" }),
      orderIndex: z
        .number()
        .min(0, { message: "Order index must be at least 0" }),
    })
  ),
});

export type FixLessonOrderParams = z.infer<typeof fixLessonOrderSchema>;

export const generateLessonSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, { message: "Topic must be at least 3 characters" })
    .max(200, { message: "Topic must not exceed 200 characters" }),
  difficulty: z.enum(["beginner", "intermediate", "expert"]),
  courseId: z.string().min(1, { message: "Course id is required" }),
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(200, { message: "Title must not exceed 200 characters" })
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(5000, { message: "Description must not exceed 5000 characters" })
    .optional(),
  thumbnailUrl: z.string().min(1, { message: "Thumbnail URL is required" }),
  thumbnailPublicId: z
    .string()
    .trim()
    .min(1, { message: "Thumbnail public id is required" }),
  videoUrl: z.string().min(1, { message: "Video URL is required" }),
  videoPublicId: z
    .string()
    .trim()
    .min(1, { message: "Video public id is required" }),
});

export type GenerateAILessonParams = z.infer<typeof generateLessonSchema>;

export type GenerateLessonParams = Omit<
  GenerateAILessonParams,
  | "courseId"
  | "thumbnailUrl"
  | "thumbnailPublicId"
  | "videoUrl"
  | "videoPublicId"
>;

export const lessonGenerationSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  duration: z.string(),
});
