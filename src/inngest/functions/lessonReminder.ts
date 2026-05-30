import { prisma } from "../../config/db";
import {
  sendPushNotification,
  sendUserDailyReminderNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const lessonReminder = inngest.createFunction(
  {
    id: "lesson-reminder",
    triggers: { cron: "TZ=Asia/Kolkata 0 18 * * *" },
    retries: 0,
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.user.findMany({
        where: {
          profile: { lessonReminderEnabled: true },
        },
        include: {
          profile: true,
          notificationTokens: {
            where: { isActive: true },
          },
          enrolls: {
            where: { completed: false },
          },
        },
      });
    });

    const eligibleUsers = users.filter(user => user.enrolls.length > 0);

    if (!eligibleUsers.length) {
      return { success: true };
    }

    await step.run("create-notifications", async () => {
      await prisma.notification.createMany({
        data: eligibleUsers.map(user => ({
          userId: user.id,
          title: "Continue Your Course 🎯",
          message: "You have unfinished lessons waiting.",
          type: "lesson",
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
          title: "Continue Your Course 🎯",
          body: "You have unfinished lessons waiting.",
          data: {
            type: "lesson",
          },
        });
      }

      if (user.profile?.emailNotificationsEnabled && user.email) {
        await sendUserDailyReminderNotification({
          email: user.email,
          title: "Continue Your Course 🎯",
          message: "You have unfinished lessons waiting.",
        });
      }
    }

    return {
      success: true,
      count: eligibleUsers.length,
    };
  }
);

export default lessonReminder;
