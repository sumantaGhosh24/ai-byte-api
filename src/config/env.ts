import "dotenv/config";

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL!,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
  ARCJET_KEY: process.env.ARCJET_KEY!,
  SENTRY_DSN: process.env.SENTRY_DSN!,
};
