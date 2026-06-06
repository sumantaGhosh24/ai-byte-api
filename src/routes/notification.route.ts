import { Router } from "express";
import {
  registerNotificationTokenController,
  markNotificationReadController,
  markAllNotificationsReadController,
  getUserNotificationsController,
} from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/notifications/token",
  requireAuth,
  generalRateLimit,
  registerNotificationTokenController
);

router.get(
  "/notifications",
  requireAuth,
  generalRateLimit,
  getUserNotificationsController
);

router.patch(
  "/notifications/read-all",
  requireAuth,
  generalRateLimit,
  markAllNotificationsReadController
);

router.patch(
  "/notifications/:id/read",
  requireAuth,
  generalRateLimit,
  markNotificationReadController
);

export default router;
