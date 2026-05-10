import {Response, NextFunction, Request} from "express";
import {slidingWindow} from "@arcjet/node";

import aj from "../config/arcjet";

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let limit = 100;

    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: limit,
      }),
    );

    const decision = await client.protect(req, {requested: 5});

    if (decision.isDenied() && decision.reason.isBot()) {
      res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are not allowed",
      });
      return;
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy",
      });
      return;
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      res.status(403).json({error: "Forbidden", message: "Too many requests"});
      return;
    }

    next();
  } catch (e) {
    res.status(500).json({
      error: "Internal server error",
      message: "Something went wrong with security middleware",
    });
  }
};
export default securityMiddleware;
