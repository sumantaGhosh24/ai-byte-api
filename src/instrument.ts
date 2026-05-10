import * as Sentry from "@sentry/node";

import {env} from "./config/env";

Sentry.init({
  dsn: env.SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  sendDefaultPii: true,
});
