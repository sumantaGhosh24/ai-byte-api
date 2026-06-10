import { prisma } from "../../config/db";
import {
  sendPushNotification,
  sendUserDailyReminderNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const monthlyReminder = inngest.createFunction(
  {
    id: "monthly-reminder",
    triggers: { cron: "TZ=Asia/Kolkata 0 9 1 * *" },
    retries: 0,
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.user.findMany({
        include: {
          profile: true,
          notificationTokens: {
            where: { isActive: true },
          },
        },
      });
    });

    if (!users.length) {
      return { success: true };
    }

    await step.run("create-notifications", async () => {
      await prisma.notification.createMany({
        data: users.map(user => ({
          userId: user.id,
          title: "New Month, New Goals 🚀",
          message:
            "Set your learning goals for this month and stay consistent.",
          type: "general",
          sentAt: new Date(),
        })),
      });
    });

    await step.run("send-notifications", async () => {
      for (const user of users) {
        if (
          user.profile?.pushNotificationsEnabled &&
          user.notificationTokens.length
        ) {
          await sendPushNotification({
            tokens: user.notificationTokens.map(token => token.token),
            title: "New Month, New Goals 🚀",
            body: "Set your learning goals for this month and stay consistent.",
            data: {
              type: "general",
            },
          });
        }

        if (user.profile?.emailNotificationsEnabled && user.email) {
          await sendUserDailyReminderNotification({
            email: user.email,
            title: "New Month, New Goals 🚀",
            message:
              "Set your learning goals for this month and stay consistent.",
          });
        }
      }
    });

    return {
      success: true,
      count: users.length,
    };
  }
);

export default monthlyReminder;
