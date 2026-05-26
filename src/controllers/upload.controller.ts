import { Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  deleteFileService,
  uploadFileService,
} from "../services/upload.service";
import { deleteFileSchema } from "../validations/upload.validation";
import { formatValidationError } from "../utils/format";

export const uploadFileController = async (req: Request, res: Response) => {
  try {
    logger.info("Started uploading file");

    const file = await uploadFileService(req);

    logger.info(`File ${file.public_id} uploaded successfully`);

    res.json({ file, success: true });
  } catch (error: unknown) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteFileController = async (req: Request, res: Response) => {
  try {
    logger.info(`File ${req.body.public_id} started deleting`);

    const validationResult = deleteFileSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to delete file", {
        error: formatValidationError(validationResult.error),
      });

      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { public_id } = validationResult.data;

    const { message } = await deleteFileService(public_id);

    logger.info(`File ${public_id} deleted successfully`);

    res.json({ message, success: true });
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
