import express from "express";

import {
  uploadImageController,
  deleteImageController,
} from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { generalRateLimit } from "../middlewares/rateLimit.middleware";

const router = express.Router();

router.post("/upload", requireAuth, generalRateLimit, uploadImageController);

router.post("/destroy", requireAuth, generalRateLimit, deleteImageController);

export default router;
