import { Expo, ExpoPushMessage } from "expo-server-sdk";

import { expo } from "../config/expo";
import { env } from "../config/env";
import { transporter } from "../config/mail";
import { deactivateNotificationToken } from "./notification.service";

interface PushNotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification({
  tokens,
  title,
  body,
  data,
}: PushNotificationPayload) {
  const messages: ExpoPushMessage[] = [];

  for (const token of tokens) {
    if (!Expo.isExpoPushToken(token)) {
      continue;
    }

    messages.push({
      to: token,
      sound: "default",
      title,
      body,
      data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);

    tickets.forEach((ticket, index) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        deactivateNotificationToken(chunk?.[index]?.to as string);
      }
    });
  }
}

interface EmailTemplateParams {
  title: string;
  subtitle?: string;
  content: string;
}

export const emailTemplate = ({
  title,
  subtitle,
  content,
}: EmailTemplateParams) => `
  <!DOCTYPE html>
  <html>
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr>
            <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,.08);">
                <tr>
                <td style="background:#2563eb; padding:32px; text-align:center; color:white;">
                    <h1 style="margin:0; font-size:28px;">AIByte 🚀</h1>
                    ${subtitle ? `<p style="margin-top:12px; font-size:15px; opacity:.9;">${subtitle}</p>` : ""}
                </td>
                </tr>
                <tr>
                <td style="padding:32px;">${content}</td>
                </tr>
                <tr>
                <td style="background:#f8fafc; padding:24px; text-align:center; color:#64748b; font-size:12px;">
                    © ${new Date().getFullYear()} AIByte <br /> Learn AI, Programming & Technology Every Day.
                </td>
                </tr>
            </table>
            </td>
        </tr>
        </table>
    </body>
  </html>
  `;

interface SendWelcomeEmailProps {
  email: string;
  name: string;
}

export async function sendWelcomeEmail({ email, name }: SendWelcomeEmailProps) {
  return transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Welcome to AIByte 🚀",
    html: emailTemplate({
      title: "Welcome to AIByte",
      subtitle: "Your learning journey starts today.",
      content: `
          <h2>Welcome ${name} 👋</h2>
          <p>Thanks for joining AIByte.</p>
          <p>Explore curated courses, complete lessons, earn achievements, and build learning streaks.</p>
          <div style="background:#eff6ff; padding:20px; border-radius:12px; margin:24px 0;">
            <strong>Start your first lesson today 🚀</strong>
          </div>
        `,
    }),
  });
}

interface QuizSummaryEmailPayload {
  email: string;
  quizTitle: string;
  score: number;
}

export async function sendQuizSummaryEmail({
  email,
  quizTitle,
  score,
}: QuizSummaryEmailPayload) {
  return transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Your Quiz Summary Is Ready",
    html: emailTemplate({
      title: "Quiz Summary Ready",
      subtitle: "Your personalized feedback is available.",
      content: `
          <h2>Quiz Summary Ready 🎉</h2>
          <p>Your quiz results are now available.</p>
          <div style="background:#f8fafc; padding:20px; border-radius:12px; margin:24px 0;">
            <p><strong>Quiz:</strong> ${quizTitle}</p>
            <p><strong>Score:</strong> ${score}%</p>
          </div>
          <p>Open AIByte to view detailed strengths, weaknesses and recommendations.</p>
        `,
    }),
  });
}

interface SendAchievementEmail {
  email: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementRarity: string;
}

export async function sendAchievementEmail({
  email,
  achievementTitle,
  achievementDescription,
  achievementRarity,
}: SendAchievementEmail) {
  return transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: `🏆 Achievement Unlocked: ${achievementTitle}`,
    html: emailTemplate({
      title: achievementTitle,
      subtitle: "New achievement unlocked",
      content: `
          <h2>🏆 Achievement Unlocked</h2>
          <div style="background:#fef3c7; padding:24px; border-radius:12px;">
            <h3>${achievementTitle}</h3>
            <p>${achievementDescription}</p>
            <p>Rarity: <strong>${achievementRarity.toUpperCase()}</strong></p>
          </div>
          <p>Keep learning and unlock even more achievements.</p>
        `,
    }),
  });
}

interface SendCoursePublishedEmailParams {
  email: string;
  courseTitle: string;
  courseDescription?: string;
}

export const sendCoursePublishedEmail = async ({
  email,
  courseTitle,
  courseDescription,
}: SendCoursePublishedEmailParams) => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: `New Course Available: ${courseTitle}`,
    html: emailTemplate({
      title: courseTitle,
      subtitle: "A new course has been published.",
      content: `
          <h2>🚀 New Course Available</h2>
          <div style="background:#f8fafc; padding:24px; border-radius:12px;">
            <h3>${courseTitle}</h3>
            ${courseDescription ? `<p>${courseDescription}</p>` : ""}
          </div>
          <p>Start learning today and continue building your skills.</p>
        `,
    }),
  });
};

interface SendLessonPublishedEmailParams {
  email: string;
  lessonTitle: string;
  courseTitle: string;
}

export async function sendLessonPublishedEmail({
  email,
  lessonTitle,
  courseTitle,
}: SendLessonPublishedEmailParams) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "New Lesson Published",
    html: emailTemplate({
      title: lessonTitle,
      subtitle: "New lesson available.",
      content: `
          <h2>📚 New Lesson Published</h2>
          <p>A new lesson has been added to your course.</p>
          <div style="background:#f8fafc; padding:20px; border-radius:12px;">
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Lesson:</strong> ${lessonTitle}</p>
          </div>
          <p>Continue your learning journey.</p>
        `,
    }),
  });
}

interface SendQuizPublishedEmailParams {
  email: string;
  courseTitle: string;
  quizTitle: string;
}

export async function sendQuizPublishedEmail({
  email,
  courseTitle,
  quizTitle,
}: SendQuizPublishedEmailParams) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "New Quiz Published",
    html: emailTemplate({
      title: quizTitle,
      subtitle: "A new quiz is waiting for you.",
      content: `
          <h2>🎯 New Quiz Available</h2>
          <p>Test your knowledge with a newly published quiz.</p>
          <div style=" background:#f8fafc; padding:20px; border-radius:12px;">
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Quiz:</strong> ${quizTitle}</p>
          </div>
          <p>Open AIByte and challenge yourself.</p>
        `,
    }),
  });
}

interface SendUserDailyReminderNotificationParams {
  email: string;
  title: string;
  message: string;
}

export async function sendUserDailyReminderNotification({
  email,
  title,
  message,
}: SendUserDailyReminderNotificationParams) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Your daily learning reminder",
    html: emailTemplate({
      title,
      subtitle: "Your daily learning reminder",
      content: `
        <h2>👋 Hello!</h2>
        <p>${message}</p>
        <div style="background:#fef3c7; padding:20px; border-radius:12px;">
          <strong>Open AIByte now to continue your learning streak and achieve new milestones!</strong>
        </div>
      `,
    }),
  });
}
