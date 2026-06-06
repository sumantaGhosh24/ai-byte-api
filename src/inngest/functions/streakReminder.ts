import { prisma } from "../../config/db";
import {
  sendPushNotification,
  sendUserDailyReminderNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const streakReminder = inngest.createFunction(
  {
    id: "streak-reminder",
    triggers: {
      cron: "TZ=Asia/Kolkata 0 18 * * *",
    },
    retries: 0,
  },
  async ({ step }) => {
    const now = new Date();

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const users = await step.run("fetch-users", async () => {
      return prisma.user.findMany({
        where: {
          profile: { streakReminderEnabled: true },
        },
        include: {
          profile: true,
          notificationTokens: {
            where: { isActive: true },
          },
          progresses: {
            where: {
              completed: true,
              finishedAt: {
                gte: startOfDay,
              },
            },
          },
        },
      });
    });

    const eligibleUsers = users.filter(user => user.progresses.length === 0);

    if (!eligibleUsers.length) {
      return { success: true };
    }

    await step.run("create-notifications", async () => {
      await prisma.notification.createMany({
        data: eligibleUsers.map(user => ({
          userId: user.id,
          title: "Keep Your Streak Alive 🔥",
          message: "Complete a lesson today to maintain your streak.",
          type: "reminder",
          sentAt: new Date(),
        })),
      });
    });

    for (const user of eligibleUsers) {
      if (
        user.profile?.pushNotificationsEnabled &&
        user.notificationTokens.length
      ) {
        await sendPushNotification({
          tokens: user.notificationTokens.map(token => token.token),
          title: "Keep Your Streak Alive 🔥",
          body: "Complete a lesson today to maintain your streak.",
          data: {
            type: "reminder",
          },
        });
      }

      if (user.profile?.emailNotificationsEnabled && user.email) {
        await sendUserDailyReminderNotification({
          email: user.email,
          title: "Keep Your Streak Alive 🔥",
          message: "Complete a lesson today to maintain your streak.",
        });
      }
    }

    return {
      success: true,
      count: eligibleUsers.length,
    };
  }
);

export default streakReminder;
