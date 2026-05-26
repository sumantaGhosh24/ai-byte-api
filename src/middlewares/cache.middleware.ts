/* eslint-disable indent */
import { Request, Response, NextFunction } from "express";

import { getCache } from "../utils/cache";

export const cacheMiddleware =
  (keyBuilder: (_req: Request) => string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key = keyBuilder(req);

    const cachedData = await getCache(key.replace(/"/g, ""));

    if (cachedData) {
      return res.status(200).json({
        source: "cache",
        ...cachedData,
      });
    }

    next();
  };
