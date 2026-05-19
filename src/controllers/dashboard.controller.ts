import { Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  getAdminDashboardService,
  getUsersPerMonthTrendService,
  getCompletedLessonsTrendService,
  getQuizAttemptsPerWeekTrendService,
  getAchievementsPerMonthTrendService,
  getActiveStreaksPerDayTrendService,
  getCoursesPerCategoryBreakdownService,
  getNotificationsPerWeekTrendService,
} from "../services/dashboard.service";

export const getAdminDashboardController = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started fetching admin dashboard data");

    const result = await getAdminDashboardService();

    logger.info("Successfully fetched admin dashboard data");

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getUsersPerMonthTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const months = Number(req.query.months || 6);

    logger.info(
      `Started fetching users per month trend for last ${months} months`
    );

    const trend = await getUsersPerMonthTrendService(months);

    logger.info(
      `Successfully fetched users per month trend for last ${months} months`
    );

    res.json({ success: true, trend });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getCompletedLessonsTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const days = Number(req.query.days || 14);

    logger.info(
      `Started fetching completed lessons trend for last ${days} days`
    );

    const trend = await getCompletedLessonsTrendService(days);

    logger.info(
      `Successfully fetched completed lessons trend for last ${days} days`
    );

    res.json({ success: true, trend });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getQuizAttemptsPerWeekTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const weeks = Number(req.query.weeks || 8);

    logger.info(
      `Started fetching quiz attempts per week trend for last ${weeks} weeks`
    );

    const trend = await getQuizAttemptsPerWeekTrendService(weeks);

    logger.info(
      `Successfully fetched quiz attempts per week trend for last ${weeks} weeks`
    );

    res.json({ success: true, trend });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getAchievementsPerMonthTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const months = Number(req.query.months || 6);

    logger.info(
      `Started fetching achievements per month trend for last ${months} months`
    );

    const trend = await getAchievementsPerMonthTrendService(months);

    logger.info(
      `Successfully fetched achievements per month trend for last ${months} months`
    );

    res.json({ success: true, trend });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getActiveStreaksPerDayTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const days = Number(req.query.days || 14);

    logger.info(
      `Started fetching active streaks per day trend for last ${days} days`
    );

    const trend = await getActiveStreaksPerDayTrendService(days);

    logger.info(
      `Successfully fetched active streaks per day trend for last ${days} days`
    );

    res.json({ success: true, trend });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getCoursesPerCategoryBreakdownController = async (
  req: Request,
  res: Response
) => {
  try {
    const limit = Number(req.query.limit || 10);

    logger.info(
      `Started fetching courses per category breakdown with limit ${limit}`
    );

    const breakdown = await getCoursesPerCategoryBreakdownService(limit);

    logger.info(
      `Successfully fetched courses per category breakdown with limit ${limit}`
    );

    res.json({ success: true, breakdown });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getNotificationsPerWeekTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const weeks = req.query.weeks ? Number(req.query.weeks) : 8;

    logger.info(
      `Started fetching notifications per week trend for last ${weeks} weeks`
    );

    const trend = await getNotificationsPerWeekTrendService(weeks);

    logger.info(
      `Successfully fetched notifications per week trend for last ${weeks} weeks`
    );

    res.json({ success: true, trend });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
