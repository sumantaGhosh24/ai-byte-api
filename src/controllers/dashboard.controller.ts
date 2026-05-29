import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { getAdminDashboardService } from "../services/dashboard.service";

export const getAdminDashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching admin dashboard");

    const dashboard = await getAdminDashboardService();

    logger.info("Successfully fetched admin dashboard");

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};
