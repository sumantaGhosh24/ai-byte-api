import { and, eq } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { bookmarks } from "../db/schema";

interface BookmarkParams {
  userId: string;
  lessonId: string;
}

export const createBookmark = async ({ userId, lessonId }: BookmarkParams) => {
  try {
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        userId,
        lessonId,
      })
      .onConflictDoNothing()
      .returning();

    return bookmark;
  } catch (error) {
    logger.error("Error creating bookmark", { error });

    throw error;
  }
};

export const deleteBookmark = async ({ userId, lessonId }: BookmarkParams) => {
  try {
    const [deleted] = await db
      .delete(bookmarks)
      .where(
        and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId))
      )
      .returning();

    return deleted;
  } catch (error) {
    logger.error("Error deleting bookmark", { error });

    throw error;
  }
};

export const getBookmarks = async (userId: string) => {
  try {
    const userBookmarks = await db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, userId),
      with: {
        lesson: true,
      },
      orderBy: (bookmarks, { desc }) => [desc(bookmarks.createdAt)],
    });

    return userBookmarks;
  } catch (error) {
    logger.error("Error fetching user's bookmarks", { error });

    throw error;
  }
};
