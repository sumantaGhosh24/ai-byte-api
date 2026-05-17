import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { getUsersService } from "../services/user.service";
import { setCache } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getUsersController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search as string;

    logger.info("Started fetching users");

    const users = await getUsersService({
      page,
      limit,
      search,
    });

    logger.info("Successfully fetched users");

    await setCache(redisKeys.users(JSON.stringify(req.query)), {
      success: true,
      users,
    });

    res.json({ success: true, users });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
