import { env } from "../../config/env";
import { inngest } from "../client";

export const keepAlive = inngest.createFunction(
  {
    id: "keep-alive",
    triggers: { cron: "TZ=Asia/Kolkata */10 * * * *" },
    retries: 0,
  },
  async ({ step }) => {
    await step.run("ping-self", async () => {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 10000);

      try {
        const response = await fetch(`${env.BASE_URL}/health`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Ping failed: ${response.status}`);
        }

        return { status: "OK" };
      } finally {
        clearTimeout(timeout);
      }
    });
  }
);
