import { Response, NextFunction, Request } from "express";
import { slidingWindow } from "@arcjet/node";
import * as Sentry from "@sentry/node";

import aj from "../config/arcjet";

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = 100;

    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: limit,
      })
    );

    const decision = await client.protect(req, { requested: 5 });

    if (decision.isDenied() && decision.reason.isBot()) {
      Sentry.logger.error("Bot request blocked", {
        reason: "Bot request blocked",
        error: decision.reason,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are not allowed",
      });
      return;
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      Sentry.logger.error("Shield request blocked", {
        reason: "Shield request blocked",
        error: decision.reason,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy",
      });
      return;
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      Sentry.logger.error("Rate limit request blocked", {
        reason: "Rate limit request blocked",
        error: decision.reason,
      });

      res
        .status(403)
        .json({ error: "Forbidden", message: "Too many requests" });
      return;
    }

    next();
  } catch (e) {
    Sentry.logger.error("Security middleware failed", {
      reason: "Security middleware failed",
      error: e,
    });

    res.status(500).json({
      error: "Internal server error",
      message: "Something went wrong with security middleware",
    });
  }
};
export default securityMiddleware;
