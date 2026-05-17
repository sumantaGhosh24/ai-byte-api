import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { eq } from "drizzle-orm";
import { logger } from "@sentry/node";

import { db } from "../db";
import { env } from "../config/env";
import { profiles, streaks, users } from "../db/schema";

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

      const newUser = await db
        .insert(users)
        .values({
          clerkId: u.id,
          email,
          xp: 0,
          isAdmin: false,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { email, updatedAt: new Date() },
        })
        .returning();

      await db.transaction(async tx => {
        await tx.insert(profiles).values({
          userId: newUser[0].id,
          onboardingCompleted: false,
        });

        await tx.insert(streaks).values({
          userId: newUser[0].id,
          currentStreak: 0,
          longestStreak: 0,
        });
      });
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        await db.delete(users).where(eq(users.clerkId, id));

        await db.transaction(async tx => {
          await tx.delete(profiles).where(eq(profiles.userId, id));

          await tx.delete(streaks).where(eq(streaks.userId, id));

          await tx.delete(users).where(eq(users.id, id));
        });
      }
    }

    res.json({ success: true, ok: true });
  } catch (err) {
    logger.error("Clerk webhook error", {
      reason: "Webhook error",
      error: err,
    });

    res.status(400).json({ success: false, error: "Invalid webhook" });
  }
}
