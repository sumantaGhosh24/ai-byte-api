import { z } from "zod";

export const quizIdSchema = z.object({
  id: z.string().min(1, { message: "Quiz id is required" }),
});

export const quizDifficultyEnum = z.enum([
  "beginner",
  "intermediate",
  "expert",
]);

export const quizVisibilityEnum = z.enum(["public", "private"]);

export const quizStatusEnum = z.enum([
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

export const quizzesSchema = paginationQuerySchema.extend({
  courseId: z.string().optional(),
  difficulty: quizDifficultyEnum.optional(),
  visibility: quizVisibilityEnum.optional(),
  status: quizStatusEnum.optional(),
});

export type GetQuizzesParams = z.infer<typeof quizzesSchema>;

export const createQuizSchema = z.object({
  courseId: z.string().min(1, { message: "Course id is required" }),
  title: z
    .string()
    .min(1, { message: "Title must be at least 1 character" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  description: z
    .string()
    .min(1, { message: "Description must be at least 1 character" })
    .max(500, { message: "Description must not exceed 500 characters" }),
  difficulty: quizDifficultyEnum,
  visibility: quizVisibilityEnum,
  passingScore: z
    .number()
    .min(1, { message: "Passing score should be a positive number" }),
});

export type CreateQuizParams = z.infer<typeof createQuizSchema>;

export const updateQuizSchema = z.object({
  quizId: z.string().min(1, { message: "Quiz id is required" }).optional(),
  courseId: z.string().min(1, { message: "Course id is required" }).optional(),
  title: z
    .string()
    .min(1, { message: "Title must be at least 1 character" })
    .max(200, { message: "Title must not exceed 200 characters" })
    .optional(),
  description: z
    .string()
    .min(1, { message: "Description must be at least 1 character" })
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  difficulty: quizDifficultyEnum,
  visibility: quizVisibilityEnum,
  passingScore: z
    .number()
    .min(1, { message: "Passing score should be a positive number" }),
});

export type UpdateQuizParams = z.infer<typeof updateQuizSchema>;

export const generateQuizSchema = z.object({
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
    .max(10000, { message: "Description must not exceed 10000 characters" })
    .optional(),
  numberOfQuestions: z
    .number()
    .min(1, { message: "Number of questions must be at least 1" })
    .max(50, { message: "Number of questions must not exceed 50" }),
});

export type GenerateAIQuizParams = z.infer<typeof generateQuizSchema>;

export type GenerateQuizParams = Omit<GenerateAIQuizParams, "courseId">;

export const quizGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  passingScore: z.number(),
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
});
