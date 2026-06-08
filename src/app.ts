import "./instrument";

import express, { NextFunction, Request, Response } from "express";
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
import { inngest } from "./inngest/client";
import uploadRoutes from "./routes/upload.route";
import userRoutes from "./routes/user.route";
import profileRoutes from "./routes/profile.route";
import categoryRoutes from "./routes/category.route";
import courseRoutes from "./routes/course.route";
import enrollRoutes from "./routes/enroll.route";
import bookmarkRoutes from "./routes/bookmark.route";
import reviewRoutes from "./routes/review.route";
import lessonRoutes from "./routes/lesson.route";
import progressRoutes from "./routes/progress.route";
import quizRoutes from "./routes/quiz.route";
import questionRoutes from "./routes/question.route";
import quizAttemptRoutes from "./routes/quizAttempt.route";
import achievementRoutes from "./routes/achievement.route";
import notificationRoutes from "./routes/notification.route";
import dashboardRoutes from "./routes/dashboard.route";
import generateCourse from "./inngest/functions/generateCourse";
import generateLesson from "./inngest/functions/generateLesson";
import generateQuiz from "./inngest/functions/generateQuiz";
import generateQuizAttemptSummary from "./inngest/functions/generateQuizAttemptSummary";
import quizPublishedNotification from "./inngest/functions/quizPublishedNotification";
import lessonPublishedNotification from "./inngest/functions/lessonPublishedNotification";
import coursePublishedNotification from "./inngest/functions/coursePublishedNotification";
import achievementUnlockedNotification from "./inngest/functions/achievementUnlockedNotification";
import quizSummaryNotification from "./inngest/functions/quizSummaryNotification";
import welcomeUserNotification from "./inngest/functions/welcomeUserNotification";
import dailyReminder from "./inngest/functions/dailyReminder";
import streakReminder from "./inngest/functions/streakReminder";
import lessonReminder from "./inngest/functions/lessonReminder";
import weeklyReminder from "./inngest/functions/weeklyReminder";
import monthlyReminder from "./inngest/functions/monthlyReminder";
import { keepAlive } from "./inngest/functions/keepAlive";

const app = express();

app.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhookHandler
);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);
app.use(securityMiddleware);

app.use(
  morgan("combined", {
    stream: { write: message => Sentry.logger.info(message.trim()) },
  })
);

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
    functions: [
      generateCourse,
      generateLesson,
      generateQuiz,
      generateQuizAttemptSummary,
      welcomeUserNotification,
      achievementUnlockedNotification,
      coursePublishedNotification,
      lessonPublishedNotification,
      quizPublishedNotification,
      quizSummaryNotification,
      dailyReminder,
      streakReminder,
      lessonReminder,
      weeklyReminder,
      monthlyReminder,
      keepAlive,
    ],
  })
);

app.use("/api", uploadRoutes);
app.use("/api", userRoutes);
app.use("/api", profileRoutes);
app.use("/api", categoryRoutes);
app.use("/api", courseRoutes);
app.use("/api", enrollRoutes);
app.use("/api", bookmarkRoutes);
app.use("/api", reviewRoutes);
app.use("/api", lessonRoutes);
app.use("/api", progressRoutes);
app.use("/api", quizRoutes);
app.use("/api", questionRoutes);
app.use("/api", quizAttemptRoutes);
app.use("/api", achievementRoutes);
app.use("/api", notificationRoutes);
app.use("/api", dashboardRoutes);

app.use((req, res) => {
  Sentry.logger.error("Not Found", {
    success: true,
    reason: "Route not found",
  });

  res.status(404).json({ message: "Route not found!" });
});

Sentry.setupExpressErrorHandler(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
