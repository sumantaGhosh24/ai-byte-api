import { Request, Response } from "express";
import { logger } from "@sentry/node";

import { updateProgressService } from "../services/progress.service";
import { updateProgressSchema } from "../validations/progress.validation";
import { formatValidationError } from "../utils/format";

export const updateProgressController = async (req: Request, res: Response) => {
  try {
    logger.info("Started updating lesson progress");

    const validationResult = updateProgressSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to update lesson progress", {
        error: formatValidationError(validationResult.error),
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
    }

    const { userId, lessonId, watchPercentage, completed, lastTimestamp } =
      validationResult.data;

    const parsedLastTimestamp =
      typeof lastTimestamp === "string"
        ? Number(lastTimestamp)
        : typeof lastTimestamp === "number"
          ? lastTimestamp
          : 0;

    const result = await updateProgressService({
      userId,
      lessonId,
      watchPercentage:
        typeof watchPercentage === "number" ? watchPercentage : 0,
      lastTimestamp: parsedLastTimestamp,
      completed: typeof completed === "boolean" ? completed : false,
    });

    logger.info("Successfully updated lesson progress", { lessonId });

    res.json({ success: true, result });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
