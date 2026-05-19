import { Router } from "express";

import {
  getAdminDashboardController,
  getUsersPerMonthTrendController,
  getCompletedLessonsTrendController,
  getQuizAttemptsPerWeekTrendController,
  getAchievementsPerMonthTrendController,
  getActiveStreaksPerDayTrendController,
  getCoursesPerCategoryBreakdownController,
  getNotificationsPerWeekTrendController,
} from "../controllers/dashboard.controller";
import { requireAdmin } from "../middlewares/admin.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get(
  "/dashboard/admin",
  requireAdmin,
  generalRateLimit,
  getAdminDashboardController
);

router.get(
  "/dashboard/users-per-month-trend",
  requireAdmin,
  generalRateLimit,
  getUsersPerMonthTrendController
);

router.get(
  "/dashboard/completed-lessons-trend",
  requireAdmin,
  generalRateLimit,
  getCompletedLessonsTrendController
);

router.get(
  "/dashboard/quiz-attempts-per-week-trend",
  requireAdmin,
  generalRateLimit,
  getQuizAttemptsPerWeekTrendController
);

router.get(
  "/dashboard/achievements-per-month-trend",
  requireAdmin,
  generalRateLimit,
  getAchievementsPerMonthTrendController
);

router.get(
  "/dashboard/active-streaks-per-day-trend",
  requireAdmin,
  generalRateLimit,
  getActiveStreaksPerDayTrendController
);

router.get(
  "/dashboard/courses-per-category-breakdown",
  requireAdmin,
  generalRateLimit,
  getCoursesPerCategoryBreakdownController
);

router.get(
  "/dashboard/notifications-per-week-trend",
  requireAdmin,
  generalRateLimit,
  getNotificationsPerWeekTrendController
);

export default router;
