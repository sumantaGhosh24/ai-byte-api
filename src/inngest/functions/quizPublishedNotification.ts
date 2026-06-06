import { prisma } from "../../config/db";
import {
  sendPushNotification,
  sendQuizPublishedEmail,
} from "../../services/email.service";
import { inngest } from "../client";

const quizPublishedNotification = inngest.createFunction(
  {
    id: "quiz-published-notification",
    triggers: { event: "quiz/published" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { quizId } = event.data;

    const quiz = await step.run("get-quiz", async () => {
      return prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    });

    if (!quiz) {
      throw new Error("QUIZ_NOT_FOUND");
    }

    const enrollments = await step.run("get-enrolled-users", async () => {
      return prisma.enroll.findMany({
        where: { courseId: quiz.courseId },
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
          title: "New Quiz Published 🎯",
          message: `A new quiz has been published in "${quiz.course.title}".`,
          type: "quiz",
          metadata: {
            quizId: quiz.id,
          },
          read: false,
          sentAt: new Date(),
        })),
      });
    });

    for (const enrollment of enrollments) {
      const user = enrollment.user;

      if (
        user.profile?.pushNotificationsEnabled &&
        user.notificationTokens.length
      ) {
        await step.run(`push-${user.id}`, async () => {
          await sendPushNotification({
            tokens: user.notificationTokens.map(token => token.token),
            title: "New Quiz Published 🎯",
            body: `${quiz.course.title} has a new quiz waiting for you.`,
            data: {
              type: "quiz",
              quizId: quiz.id,
              courseId: quiz.course.id,
            },
          });
        });
      }

      if (user.profile?.emailNotificationsEnabled && user.email) {
        await step.run(`email-${user.id}`, async () => {
          await sendQuizPublishedEmail({
            email: user.email,
            courseTitle: quiz.course.title,
            quizTitle: quiz.title,
          });
        });
      }
    }

    return {
      success: true,
    };
  }
);

export default quizPublishedNotification;
