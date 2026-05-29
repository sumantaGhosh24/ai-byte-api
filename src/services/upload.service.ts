import { Request } from "express";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import { logger } from "@sentry/node";
import { Readable } from "stream";

import { env } from "../config/env";

cloudinary.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.CLOUD_API_KEY,
  api_secret: env.CLOUD_API_SECRET,
});

export const removeTmp = (path: string) => {
  fs.unlink(path, (error: unknown) => {
    if (error) throw error;
  });
};

export const uploadImageService = async (req: Request) => {
  try {
    if (!req.file) {
      throw {
        status: 400,
        message: "No image was selected, please select a image.",
      };
    }

    const file = req.file;
    if (file.size > 5 * 1024 * 1024) {
      throw {
        status: 400,
        message: "Image size is too large. (required within 5mb)",
      };
    }

    if (
      file.mimetype !== "image/jpeg" &&
      file.mimetype !== "image/jpg" &&
      file.mimetype !== "image/png"
    ) {
      throw {
        status: 400,
        message: "Image format is incorrect. (required jpeg, jpg or png)",
      };
    }

    const bufferStream = Readable.from(req.file.buffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "ai-byte" },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          if (!result) {
            return reject(new Error("No upload result returned"));
          }

          resolve(result);
        }
      );
      bufferStream.pipe(stream);
    });

    return {
      public_id: result?.public_id,
      url: result?.secure_url,
    };
  } catch (error) {
    logger.error("Error to upload image", { error });

    throw error;
  }
};

export const uploadVideoService = async (req: Request) => {
  try {
    if (!req.file) {
      throw {
        status: 400,
        message: "No video was selected, please select a video.",
      };
    }

    const file = req.file;
    if (file.size > 100 * 1024 * 1024) {
      throw {
        status: 400,
        message: "Video size is too large. (required within 100mb)",
      };
    }

    if (
      file.mimetype !== "video/mp4" &&
      file.mimetype !== "video/webm" &&
      file.mimetype !== "video/ogg"
    ) {
      throw {
        status: 400,
        message: "Video format is incorrect. (required mp4, webm or ogg)",
      };
    }

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(fileBase64, {
      resource_type: "video",
      folder: "ai-byte",
      api_key: env.CLOUD_API_KEY,
      api_secret: env.CLOUD_API_SECRET,
      cloud_name: env.CLOUD_NAME,
    });

    return {
      public_id: result?.public_id,
      url: result?.secure_url,
    };
  } catch (error) {
    logger.error("Error to upload video", { error });

    throw error;
  }
};

export const deleteFileService = async (public_id: string) => {
  try {
    await cloudinary.uploader.destroy(public_id);

    return true;
  } catch (error) {
    logger.error("Error to delete file", { error });

    throw error;
  }
};
