import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { logger } from "@sentry/node";

import { env } from "../config/env";
import { prisma } from "../config/db";
import { deleteCache, deleteManyCache, getKeys } from "../utils/cache";
import { redisKeys } from "../utils/redisKeys";

export async function clerkWebhookHandler(req: Request, res: Response) {
  try {
    if (!env.CLERK_WEBHOOK_SECRET) {
      logger.error("Clerk webhook secret missing", {
        reason: "Missing webhook secret",
      });

      res
        .status(503)
        .json({ success: false, message: "Webhooks secret is not provided" });
      return;
    }

    const payload =
      req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

    const request = new Request(`${env.BASE_URL}/webhooks/clerk`, {
      method: "POST",
      headers: new Headers(req.headers as HeadersInit),
      body: payload,
    });

    const evt = await verifyWebhook(request, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      const email =
        u.email_addresses?.find(e => e.id === u.primary_email_address_id)
          ?.email_address ?? u.email_addresses?.[0]?.email_address;

      const newUser = await prisma.user.upsert({
        where: { clerkId: u.id },
        update: { email },
        create: {
          clerkId: u.id,
          email,
        },
      });

      await prisma.profile.upsert({
        where: { userId: newUser.id },
        update: { updatedAt: new Date() },
        create: { userId: newUser.id },
      });

      await prisma.notification.create({
        data: {
          userId: newUser.id,
          title: "Welcome to AIByte 🚀",
          message: "Start your first lesson today.",
          type: "system",
        },
      });

      const keys = await getKeys("users:*");
      if (keys?.length) {
        await deleteManyCache(keys);
      }

      await deleteCache(redisKeys.profile(newUser.id));
      await deleteCache(redisKeys.publicProfile(newUser.id));
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;

      await prisma.user.delete({
        where: {
          clerkId: id,
        },
      });

      const keys = await getKeys("users:*");
      if (keys?.length) {
        await deleteManyCache(keys);
      }

      await deleteCache(redisKeys.categories);
    }

    res.json({ success: true, ok: true });
  } catch (err) {
    console.log(err);

    logger.error("Clerk webhook error", {
      reason: "Webhook error",
      error: err,
    });

    res.status(400).json({ success: false, error: "Invalid webhook" });
  }
}
