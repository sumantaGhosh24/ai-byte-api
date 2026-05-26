import { Request } from "express";
import cloudinary from "cloudinary";
import fs from "fs";
import { UploadedFile } from "express-fileupload";
import { logger } from "@sentry/node";

import { env } from "../config/env";

cloudinary.v2.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.CLOUD_API_KEY,
  api_secret: env.CLOUD_API_SECRET,
});

type CloudinaryFile = UploadedFile;

export const removeTmp = (path: string) => {
  fs.unlink(path, (error: unknown) => {
    if (error) throw error;
  });
};

export const uploadFileService = async (req: Request) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw {
        status: 400,
        message: "No file was selected, please select a file.",
      };
    }
    const file = req.files.file as CloudinaryFile;
    if (file.size > 5 * 1024 * 1024) {
      removeTmp(file.tempFilePath);
      throw {
        status: 400,
        message: "File size is too large. (required within 2mb)",
      };
    }
    if (
      file.mimetype !== "image/jpeg" &&
      file.mimetype !== "image/jpg" &&
      file.mimetype !== "image/png" &&
      file.mimetype !== "video/mp4" &&
      file.mimetype !== "video/webm" &&
      file.mimetype !== "video/ogg"
    ) {
      removeTmp(file.tempFilePath);
      throw {
        status: 400,
        message: "File format is incorrect. (required jpeg or png)",
      };
    }

    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        cloudinary.v2.uploader.upload(
          file.tempFilePath,
          {
            folder: "ai-byte",
            resource_type: "auto",
            upload_preset: "ml_default",
          },
          (error, result) => {
            removeTmp(file.tempFilePath);
            if (error) return reject({ status: 400, message: error.message });
            if (!result)
              return reject({ status: 400, message: "Something went wrong!" });
            resolve({
              public_id: result.public_id,
              url: result.secure_url,
            });
          }
        );
      }
    );
  } catch (error) {
    logger.error("Error to upload file", { error });

    throw error;
  }
};

export const deleteFileService = async (public_id: string) => {
  try {
    return new Promise<{ message: string }>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloudinary.v2.uploader.destroy(public_id, (error: any) => {
        if (error) return reject({ status: 500, message: error.message });
        resolve({ message: "File Deleted Successfully." });
      });
    });
  } catch (error) {
    logger.error("Error to delete file", { error });

    throw error;
  }
};
