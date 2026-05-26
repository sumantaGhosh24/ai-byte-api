import { NextFunction, Request, Response } from "express";
import { logger } from "@sentry/node";

import { getUsersService } from "../services/user.service";
import { setCache } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";
import { formatValidationError } from "../utils/format";
import { usersSchema } from "../validations/user.validation";

export const getUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Started fetching users");

    const validationResult = usersSchema.safeParse({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    if (!validationResult.success) {
      logger.error("Validation failed to get users", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { page, limit, search } = validationResult.data;

    const users = await getUsersService({
      page,
      limit,
      search,
    });

    logger.info("Successfully fetched users");

    await setCache(
      redisKeys.users(JSON.stringify(req.query)).replace(/"/g, ""),
      {
        success: true,
        users,
      }
    );

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};
