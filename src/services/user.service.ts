import { and, ilike, sql } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { users } from "../db/schema";

interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
}

export const getUsersService = async ({
  page,
  limit,
  search,
}: GetUsersParams) => {
  try {
    const offset = (page - 1) * limit;

    const filters = [];

    if (search) {
      filters.push(ilike(users.email, `%${search}%`));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.query.users.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    return {
      items: data,
      paginations: {
        page,
        limit,
        total: Number(total[0]?.count),
        hasMore: offset + data.length < Number(total[0]?.count),
      },
    };
  } catch (error) {
    logger.error("Error to get users", { error });

    throw error;
  }
};
