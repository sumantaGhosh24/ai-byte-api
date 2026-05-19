import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().default(""),
  xp: integer("xp").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  name: text("name"),
  username: text("username"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  avatarPublicId: text("avatar_public_id"),
  interests: text("interests"),
  goals: text("goals"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  learningPreference: text("learning_preference"),
  videoPreference: text("video_preference"),
  dailyReminderEnabled: boolean("daily_reminder_enabled")
    .default(true)
    .notNull(),
  dailyReminderTime: text("daily_reminder_time"),
  streakReminderEnabled: boolean("streak_reminder_enabled")
    .default(true)
    .notNull(),
  lessonReminderEnabled: boolean("lesson_reminder_enabled")
    .default(true)
    .notNull(),
  pushNotificationsEnabled: boolean("push_notifications_enabled")
    .default(true)
    .notNull(),
  emailNotificationsEnabled: boolean("email_notifications_enabled")
    .default(false)
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationTokens = pgTable(
  "notification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    token: text("token").notNull(),
    platform: text("platform").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => [unique("user_token_unique").on(table.userId, table.token)]
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false).notNull(),
  relatedCourseId: uuid("related_course_id"),
  relatedLessonId: uuid("related_lesson_id"),
  relatedQuizId: uuid("related_quiz_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

export const streaks = pgTable("streaks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  imagePublicId: text("image_public_id"),
  visibility: text("visibility").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailPublicId: text("thumbnail_public_id"),
  difficulty: text("difficulty").notNull(),
  duration: text("duration").notNull(),
  visibility: text("visibility").notNull(),
  status: text("status").notNull(),
  xpReward: integer("xp_reward").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailPublicId: text("thumbnail_public_id"),
  videoUrl: text("video_url"),
  videoPublicId: text("video_public_id"),
  duration: text("duration").notNull(),
  visibility: text("visibility").notNull(),
  status: text("status").notNull(),
  xpReward: integer("xp_reward").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    lessonId: uuid("lesson_id").notNull(),
    watchPercentage: integer("watch_percentage").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    lastTimestamp: text("last_timestamp"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => [unique("user_lesson_unique").on(table.userId, table.lessonId)]
);

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id").notNull(),
  question: text("question").notNull(),
  optionA: text("optiona").notNull(),
  optionB: text("optionb").notNull(),
  optionC: text("optionc").notNull(),
  optionD: text("optiond").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  quizId: uuid("quiz_id").notNull(),
  score: integer("score").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const answerSubmissions = pgTable("answer_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizAttemptId: uuid("quiz_attempt_id").notNull(),
  userAnswer: text("user_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  streak: one(streaks, {
    fields: [users.id],
    references: [streaks.userId],
  }),
  quizAttempts: many(quizAttempts),
  notificationTokens: many(notificationTokens),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const notificationTokensRelations = relations(
  notificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationTokens.userId],
      references: [users.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedCourse: one(courses, {
    fields: [notifications.relatedCourseId],
    references: [courses.id],
    relationName: "notification_related_course",
  }),
  relatedLesson: one(lessons, {
    fields: [notifications.relatedLessonId],
    references: [lessons.id],
    relationName: "notification_related_lesson",
  }),
  relatedQuiz: one(quizzes, {
    fields: [notifications.relatedQuizId],
    references: [quizzes.id],
    relationName: "notification_related_quiz",
  }),
}));

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  lessons: many(lessons),
  quizzes: many(quizzes),
  notifications: many(notifications, {
    relationName: "notification_related_course",
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  progress: many(progress),
  notifications: many(notifications, {
    relationName: "notification_related_lesson",
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [progress.lessonId],
    references: [lessons.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
  notifications: many(notifications, {
    relationName: "notification_related_quiz",
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizAttemptsRelations = relations(
  quizAttempts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [quizAttempts.userId],
      references: [users.id],
    }),
    quiz: one(quizzes, {
      fields: [quizAttempts.quizId],
      references: [quizzes.id],
    }),
    answerSubmissions: many(answerSubmissions),
  })
);

export const answerSubmissionsRelations = relations(
  answerSubmissions,
  ({ one }) => ({
    quizAttempt: one(quizAttempts, {
      fields: [answerSubmissions.quizAttemptId],
      references: [quizAttempts.id],
    }),
  })
);
