import { Response, NextFunction, Request } from "express";
import { logger } from "@sentry/node";

import aj from "../config/arcjet";

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decision = await aj.protect(req);

    const bypassRoutes = ["/api/inngest"];

    if (bypassRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.error("Bot request blocked", {
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
      logger.error("Shield request blocked", {
        reason: "Shield request blocked",
        error: decision.reason,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy",
      });
      return;
    }

    next();
  } catch (e) {
    logger.error("Security middleware failed", {
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
