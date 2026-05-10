import {verifyToken} from "@clerk/backend";
import {Request, Response, NextFunction} from "express";
import * as Sentry from "@sentry/node";

import {env} from "../config/env";

export const verifyClerkToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      Sentry.logger.error("Clerk token missing", {
        reason: "Missing token",
      });

      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing token",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      Sentry.logger.error("Clerk token invalid", {
        reason: "Invalid token",
      });

      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }

    next();
  } catch (error) {
    Sentry.logger.error("Clerk token verification failed", {
      reason: "Token verification failed",
    });

    return res.status(401).json({
      success: false,
      message: "Unauthorized: Token verification failed",
    });
  }
};
