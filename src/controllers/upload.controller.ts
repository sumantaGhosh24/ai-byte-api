import { Request, Response } from "express";
import { logger } from "@sentry/node";

import {
  deleteImageService,
  uploadImageService,
} from "../services/upload.service";
import { deleteImageSchema } from "../validations/upload.validation";
import { formatValidationError } from "../utils/format";

export const uploadImageController = async (req: Request, res: Response) => {
  try {
    logger.info("Started uploading image");

    const image = await uploadImageService(req);

    logger.info(`Image ${image.public_id} uploaded successfully`);

    res.json({ image, success: true });
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteImageController = async (req: Request, res: Response) => {
  try {
    logger.info(`Image ${req.body.public_id} started deleting`);

    const validationResult = deleteImageSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.error("Validation failed to delete image", {
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

    const { message } = await deleteImageService(public_id);

    logger.info(`Image ${public_id} deleted successfully`);

    res.json({ message, success: true });
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
