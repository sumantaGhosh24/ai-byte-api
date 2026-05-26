import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { getAdminDashboardService } from "../services/dashboard.service";
import { setCache } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export const getAdminDashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching admin dashboard");

    const dashboard = await getAdminDashboardService();

    logger.info("Successfully fetched admin dashboard");

    await setCache(redisKeys.notificationTokens(JSON.stringify(req.user.id)), {
      success: true,
      dashboard,
    });

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};
