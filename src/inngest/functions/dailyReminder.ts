import { prisma } from "../../config/db";
import { DailyReminderTime } from "../../generated/prisma/enums";
import {
  sendPushNotification,
  sendUserDailyReminderNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const dailyReminder = inngest.createFunction(
  {
    id: "daily-reminder",
    triggers: { cron: "TZ=Asia/Kolkata 0 * * * *" },
    retries: 0,
  },
  async ({ step }) => {
    const currentHour = new Date().getUTCHours();

    let reminderTime: DailyReminderTime | null = null;

    if (currentHour === 3) reminderTime = "morning";
    if (currentHour === 8) reminderTime = "afternoon";
    if (currentHour === 13) reminderTime = "evening";
    if (currentHour === 16) reminderTime = "night";

    if (!reminderTime) {
      return;
    }

    const users = await step.run("fetch-users", async () => {
      return prisma.user.findMany({
        where: {
          profile: {
            dailyReminderEnabled: true,
            dailyReminderTime: reminderTime,
          },
        },
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
          title: "Daily Learning Reminder 📚",
          message: "Continue learning today and grow your streak.",
          type: "reminder",
          sentAt: new Date(),
        })),
      });
    });

    for (const user of users) {
      if (
        user.profile?.pushNotificationsEnabled &&
        user.notificationTokens.length
      ) {
        await sendPushNotification({
          tokens: user.notificationTokens.map(token => token.token),
          title: "Daily Learning Reminder 📚",
          body: "Continue learning today and grow your streak.",
          data: {
            type: "reminder",
          },
        });
      }

      if (user.profile?.emailNotificationsEnabled && user.email) {
        await sendUserDailyReminderNotification({
          email: user.email,
          title: "Daily Learning Reminder 📚",
          message: "Continue learning today and grow your streak.",
        });
      }
    }

    return {
      success: true,
      count: users.length,
    };
  }
);

export default dailyReminder;
