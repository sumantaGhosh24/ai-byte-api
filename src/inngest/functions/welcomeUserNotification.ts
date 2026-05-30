import { prisma } from "../../config/db";
import { sendWelcomeEmail } from "../../services/email.service";
import { inngest } from "../client";

const welcomeUserNotification = inngest.createFunction(
  {
    id: "welcome-user",
    triggers: { event: "user/welcome.requested" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { userId } = event.data;

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

    await step.run("create-notification", async () => {
      return prisma.notification.create({
        data: {
          userId,
          title: "Welcome to AIByte 🚀",
          message: "Start your first lesson and begin your learning journey.",
          type: "system",
          sentAt: new Date(),
        },
      });
    });

    await step.run("send-email", async () => {
      await sendWelcomeEmail({
        email: user.email,
        name: user.profile?.name ?? "Learner",
      });
    });

    return {
      success: true,
    };
  }
);

export default welcomeUserNotification;
