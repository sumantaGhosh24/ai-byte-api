import express from "express";

import {
  uploadFileController,
  deleteFileController,
} from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = express.Router();

router.post("/upload", requireAuth, generalRateLimit, uploadFileController);

router.post("/destroy", requireAuth, generalRateLimit, deleteFileController);

export default router;
