import express from "express";
import multer from "multer";

import {
  deleteFileController,
  uploadImageController,
  uploadVideoController,
} from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/upload/image",
  requireAuth,
  generalRateLimit,
  upload.single("file"),
  uploadImageController
);

router.post(
  "/upload/video",
  requireAuth,
  generalRateLimit,
  upload.single("file"),
  uploadVideoController
);

router.post("/destroy", requireAuth, generalRateLimit, deleteFileController);

export default router;
