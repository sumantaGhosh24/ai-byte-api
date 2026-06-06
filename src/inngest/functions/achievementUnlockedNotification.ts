import { prisma } from "../../config/db";
import {
  sendAchievementEmail,
  sendPushNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const achievementUnlockedNotification = inngest.createFunction(
  {
    id: "achievement-unlocked-notification",
    triggers: { event: "achievement/unlocked" },
    retries: 3,
  },

  async ({ event, step }) => {
    const {
      userId,
      achievementId,
      achievementTitle,
      achievementDescription,
      achievementRarity,
    } = event.data;

    const user = await step.run("fetch-user", async () => {
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
          type: "achievement",
          title: "🏆 Achievement Unlocked",
          message: `You unlocked "${achievementTitle}" achievement.`,
          metadata: {
            achievementId,
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
          title: "🏆 Achievement Unlocked",
          body: achievementTitle,
          data: {
            type: "achievement",
            achievementId,
            notificationId: notification.id,
          },
        });
      });
    }

    if (user.profile?.emailNotificationsEnabled && user.email) {
      await step.run("send-email-notification", async () => {
        await sendAchievementEmail({
          email: user.email,
          achievementTitle,
          achievementDescription,
          achievementRarity,
        });
      });
    }

    return {
      success: true,
    };
  }
);

export default achievementUnlockedNotification;
