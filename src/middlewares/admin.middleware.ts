import { Response, NextFunction, Request } from "express";
import { logger } from "@sentry/node";
import { getAuth } from "@clerk/express";

import { prisma } from "../config/db";

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

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!user) {
      logger.error("Unauthenticated", {
        reason: "User not found",
      });

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      logger.error("Unauthorized", {
        reason: "User not authenticated",
      });

      return res.status(403).json({
        success: false,
        message: "Forbidden admin only",
      });
    }

    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
    };

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
