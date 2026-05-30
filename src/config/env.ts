import "dotenv/config";

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL!,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
  ARCJET_KEY: process.env.ARCJET_KEY!,
  SENTRY_DSN: process.env.SENTRY_DSN!,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET!,
  BASE_URL: process.env.BASE_URL!,
  CLOUD_NAME: process.env.CLOUD_NAME!,
  CLOUD_API_KEY: process.env.CLOUD_API_KEY!,
  CLOUD_API_SECRET: process.env.CLOUD_API_SECRET!,
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: Number(process.env.SMTP_PORT),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
  MAIL_FROM: process.env.MAIL_FROM!,
};
