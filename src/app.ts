import "./instrument";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as Sentry from "@sentry/node";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import corsOptions from "./config/corsOptions";
import securityMiddleware from "./middlewares/security.middleware";
import { clerkWebhookHandler } from "./webhooks/clerk";
import { sentryClerkUserMiddleware } from "./middlewares/sentryClerkUser.middleware";
import userRoutes from "./routes/user.route";
import profileRoutes from "./routes/profile.route";
import categoryRoutes from "./routes/category.route";
import courseRoutes from "./routes/course.route";
import lessonRoutes from "./routes/lesson.route";
import progressRoutes from "./routes/progress.route";
import quizzeRoutes from "./routes/quizze.route";
import questionRoutes from "./routes/question.route";
import quizzeAttemptRoutes from "./routes/quizzeAttempt.route";
import answerSubmissionRoutes from "./routes/answerSubmission.route";
import { inngest } from "./inngest/client";
import { helloWorld } from "./inngest/functions/hello";

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

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [helloWorld],
  })
);

app.use("/api", userRoutes);
app.use("/api", profileRoutes);
app.use("/api", categoryRoutes);
app.use("/api", courseRoutes);
app.use("/api", lessonRoutes);
app.use("/api", progressRoutes);
app.use("/api", quizzeRoutes);
app.use("/api", questionRoutes);
app.use("/api", quizzeAttemptRoutes);
app.use("/api", answerSubmissionRoutes);

app.use((req, res) => {
  Sentry.logger.error("Not Found", {
    success: true,
    reason: "Route not found",
  });

  res.status(404).json({ message: "Route not found!" });
});

Sentry.setupExpressErrorHandler(app);

export default app;
