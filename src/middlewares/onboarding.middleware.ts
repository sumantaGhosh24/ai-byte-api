import { Response, NextFunction, Request } from "express";
import { logger } from "@sentry/node";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";

import { getLocalUser } from "../utils/users";
import { db } from "../db";
import { profiles } from "../db/schema";

export const requireOnboarding = async (
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

    if (!user) {
      logger.error("Unauthenticated", {
        reason: "User not authenticated",
      });

      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile?.onboardingCompleted) {
      return res.status(403).json({
        success: false,
        message: "Complete onboarding first",
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
