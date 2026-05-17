import { Response, NextFunction, Request } from "express";
import { logger } from "@sentry/node";
import { getAuth } from "@clerk/express";

import { getLocalUser } from "../utils/users";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      logger.error("Unauthenticated", {
        reason: "User not authenticated",
      });

      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await getLocalUser(userId);

    if (!user?.isAdmin) {
      logger.error("Unauthorized", {
        reason: "User not authenticated",
      });

      return res.status(403).json({
        success: false,
        message: "Forbidden admin only",
      });
    }

    next();
  } catch (error) {
    logger.error("Clerk user not authenticated", {
      reason: "User not authenticated",
      error,
    });

    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated",
    });
  }
};
