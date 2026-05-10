import {pgTable, uuid, text, timestamp, boolean} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().default(""),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
});
