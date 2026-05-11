import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "./redis";

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit",
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "auth-ratelimit",
});
