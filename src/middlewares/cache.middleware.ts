import {Request, Response, NextFunction} from "express";

import {getCache} from "../utils/cache";

export const cacheMiddleware =
  (keyBuilder: (req: Request) => string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key = keyBuilder(req);

    const cachedData = await getCache(key);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        source: "cache",
        data: cachedData,
      });
    }

    next();
  };
