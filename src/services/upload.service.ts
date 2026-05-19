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

export const uploadImageService = async (req: Request) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw {
        status: 400,
        message: "No image was selected, please select a image.",
      };
    }
    const file = req.files.file as CloudinaryFile;
    if (file.size > 2 * 1024 * 1024) {
      removeTmp(file.tempFilePath);
      throw {
        status: 400,
        message: "Image size is too large. (required within 2mb)",
      };
    }
    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      removeTmp(file.tempFilePath);
      throw {
        status: 400,
        message: "Image format is incorrect. (required jpeg or png)",
      };
    }

    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        cloudinary.v2.uploader.upload(
          file.tempFilePath,
          { folder: "e-commerce" },
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
    logger.error("Error to upload image", { error });

    throw error;
  }
};

export const deleteImageService = async (public_id: string) => {
  try {
    return new Promise<{ message: string }>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloudinary.v2.uploader.destroy(public_id, (error: any) => {
        if (error) return reject({ status: 500, message: error.message });
        resolve({ message: "Image Deleted Successfully." });
      });
    });
  } catch (error) {
    logger.error("Error to delete image", { error });

    throw error;
  }
};
