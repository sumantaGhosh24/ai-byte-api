import { Request, Response, NextFunction } from "express";

import { apiRateLimit, authRateLimit } from "../config/rateLimit";

export const generalRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const identifier =
    req.ip || req.headers["x-forwarded-for"]?.toString() || "anonymous";

  const { success, remaining, reset } = await apiRateLimit.limit(
    `user:${identifier}`
  );

  if (!success) {
    return res.status(429).json({
      success: false,
      message: "Too many requests",
      remaining,
      reset,
    });
  }

  next();
};

export const loginRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const identifier =
    req.ip || req.headers["x-forwarded-for"]?.toString() || "anonymous";

  const { success } = await authRateLimit.limit(`user:${identifier}`);

  if (!success) {
    return res.status(429).json({
      success: false,
      message: "Too many auth attempts",
    });
  }

  next();
};
