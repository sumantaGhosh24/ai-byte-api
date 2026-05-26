import { z } from "zod";

export const questionIdSchema = z.object({
  id: z.string().min(1, { message: "Question id is required" }),
});

export const questionDifficultyEnum = z.enum([
  "beginner",
  "intermediate",
  "expert",
]);

export const questionVisibilityEnum = z.enum(["public", "private"]);

export const questionStatusEnum = z.enum([
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

export const questionsSchema = paginationQuerySchema.extend({
  quizId: z.string().trim().optional(),
  difficulty: questionDifficultyEnum.optional(),
  visibility: questionVisibilityEnum.optional(),
  status: questionStatusEnum.optional(),
});

export type GetQuestionsParams = z.infer<typeof questionsSchema>;

export const questionOptionSchema = z.object({
  text: z.string().min(1, { message: "Option text is required" }),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z.object({
  quizId: z.string().min(1, { message: "Quiz id is required" }),
  question: z
    .string()
    .min(1, { message: "Question must be at least 1 character" })
    .max(200, { message: "Question must not exceed 200 characters" }),
  explanation: z
    .string()
    .max(2000, { message: "Explanation too long" })
    .optional(),
  options: z
    .array(questionOptionSchema)
    .length(4, { message: "There must be exactly 4 options" }),
  difficulty: questionDifficultyEnum.default("beginner"),
  visibility: questionVisibilityEnum.default("private"),
});

export type CreateQuestionParams = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = z.object({
  questionId: z
    .string()
    .min(1, { message: "Question id is required" })
    .optional(),
  quizId: z.string().min(1, { message: "Quiz id is required" }).optional(),
  question: z
    .string()
    .min(1, { message: "Question must be at least 1 character" })
    .max(200, { message: "Question must not exceed 200 characters" })
    .optional(),
  explanation: z
    .string()
    .max(2000, { message: "Explanation too long" })
    .optional(),
  options: z
    .array(questionOptionSchema)
    .length(4, { message: "There must be exactly 4 options" })
    .optional(),
  difficulty: questionDifficultyEnum.optional(),
  visibility: questionVisibilityEnum.optional(),
  status: questionStatusEnum.optional(),
});

export type UpdateQuestionParams = z.infer<typeof updateQuestionSchema>;
