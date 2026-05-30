import { prisma } from "../../config/db";
import {
  sendCoursePublishedEmail,
  sendPushNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const coursePublishedNotification = inngest.createFunction(
  {
    id: "course-published-notification",
    triggers: { event: "course/published" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { courseId, title } = event.data;

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
          title: "New Course Available 🚀",
          message: `Course "${title}" is now available.`,
          type: "course",
          relatedCourseId: courseId,
          courseId,
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
          title: "New Course Available 🚀",
          body: `${title} has just been published.`,
          data: {
            type: "course",
            courseId,
          },
        });
      }

      if (user.profile?.emailNotificationsEnabled && user.email) {
        await sendCoursePublishedEmail({
          email: user.email,
          courseTitle: title,
        });
      }
    }

    return {
      success: true,
    };
  }
);

export default coursePublishedNotification;
