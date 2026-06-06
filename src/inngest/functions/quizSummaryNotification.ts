import { prisma } from "../../config/db";
import {
  sendPushNotification,
  sendQuizSummaryEmail,
} from "../../services/email.service";
import { inngest } from "../client";

const quizSummaryNotification = inngest.createFunction(
  {
    id: "quiz-summary-notification",
    triggers: { event: "notification/quiz-summary-generated" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { userId, attemptId, quizId, quizTitle, score } = event.data;

    const user = await step.run("get-user", async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          notificationTokens: {
            where: { isActive: true },
          },
        },
      });
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const notification = await step.run("create-notification", async () => {
      return prisma.notification.create({
        data: {
          userId,
          title: "Quiz Summary Ready",
          message: `Your summary for "${quizTitle}" is now available. You scored ${score}%.`,
          type: "quiz",
          metadata: {
            quizId,
            attemptId,
          },
          sentAt: new Date(),
        },
      });
    });

    if (
      user.profile?.pushNotificationsEnabled &&
      user.notificationTokens.length
    ) {
      await step.run("send-push-notification", async () => {
        await sendPushNotification({
          tokens: user.notificationTokens.map(token => token.token),
          title: "Quiz Summary Ready 🎉",
          body: `You scored ${score}% in ${quizTitle}`,
          data: {
            type: "quiz-summary",
            notificationId: notification.id,
            quizId,
            attemptId,
          },
        });
      });
    }

    if (user.profile?.emailNotificationsEnabled && user.email) {
      await step.run("send-email-notification", async () => {
        await sendQuizSummaryEmail({
          email: user.email,
          quizTitle,
          score,
        });
      });
    }

    return {
      success: true,
    };
  }
);

export default quizSummaryNotification;
