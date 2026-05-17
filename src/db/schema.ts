import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  streak: one(streaks, {
    fields: [users.id],
    references: [streaks.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));
