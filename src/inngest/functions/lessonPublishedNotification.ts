import { prisma } from "../../config/db";
import {
  sendLessonPublishedEmail,
  sendPushNotification,
} from "../../services/email.service";
import { inngest } from "../client";

const lessonPublishedNotification = inngest.createFunction(
  {
    id: "lesson-published-notification",
    triggers: { event: "lesson/published" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { lessonId, courseId } = event.data;

    const lesson = await step.run("fetch-lesson", async () => {
      return prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true },
      });
    });

    if (!lesson) {
      throw new Error("LESSON_NOT_FOUND");
    }

    const enrollments = await step.run("fetch-enrollments", async () => {
      return prisma.enroll.findMany({
        where: { courseId },
        include: {
          user: {
            include: {
              profile: true,
              notificationTokens: {
                where: { isActive: true },
              },
            },
          },
        },
      });
    });

    if (!enrollments.length) {
      return { success: true };
    }

    await step.run("create-notifications", async () => {
      await prisma.notification.createMany({
        data: enrollments.map(enrollment => ({
          userId: enrollment.userId,
          title: "New Lesson Published 🎉",
          message: `A new lesson "${lesson.title}" is now available in "${lesson.course.title}".`,
          type: "lesson",
          metadata: {
            lessonId: lesson.id,
          },
          sentAt: new Date(),
        })),
      });
    });

    await step.run("send-notifications", async () => {
      for (const enrollment of enrollments) {
        const user = enrollment.user;

        if (
          user.profile?.pushNotificationsEnabled &&
          user.notificationTokens.length
        ) {
          await sendPushNotification({
            tokens: user.notificationTokens.map(token => token.token),
            title: "New Lesson Published 🎉",
            body: `${lesson.title} is now available`,
            data: {
              type: "lesson",
              lessonId: lesson.id,
              courseId: lesson.courseId,
            },
          });
        }

        if (user.profile?.emailNotificationsEnabled && user.email) {
          await sendLessonPublishedEmail({
            email: user.email,
            lessonTitle: lesson.title,
            courseTitle: lesson.course.title,
          });
        }
      }
    });

    return {
      success: true,
      lessonId,
    };
  }
);

export default lessonPublishedNotification;
