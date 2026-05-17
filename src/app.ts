import "./instrument";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as Sentry from "@sentry/node";
import { clerkMiddleware } from "@clerk/express";

import corsOptions from "./config/corsOptions";
import securityMiddleware from "./middlewares/security.middleware";
import { clerkWebhookHandler } from "./webhooks/clerk";
import { sentryClerkUserMiddleware } from "./middlewares/sentryClerkUser.middleware";
import userRoutes from "./routes/user.route";
import profileRoutes from "./routes/profile.route";

const app = express();

app.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhookHandler
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);

app.use(
  morgan("combined", {
    stream: { write: message => Sentry.logger.info(message.trim()) },
  })
);

app.use(securityMiddleware);

app.get("/", (req, res) => {
  res.status(200).send("AIByte Website API!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/api", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "AIByte Website API is working!" });
});

app.use("/api", userRoutes);
app.use("/api", profileRoutes);

app.use((req, res) => {
  Sentry.logger.error("Not Found", {
    success: true,
    reason: "Route not found",
  });

  res.status(404).json({ message: "Route not found!" });
});

Sentry.setupExpressErrorHandler(app);

export default app;
