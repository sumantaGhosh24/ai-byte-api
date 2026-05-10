import type {Request, Response} from "express";
import {verifyWebhook} from "@clerk/backend/webhooks";
import {eq} from "drizzle-orm";
import * as Sentry from "@sentry/node";

import {db} from "../db";
import {users} from "../db/schema";
import {env} from "../config/env";

export async function clerkWebhookHandler(req: Request, res: Response) {
  try {
    if (!env.CLERK_WEBHOOK_SECRET) {
      Sentry.logger.error("Clerk webhook secret missing", {
        reason: "Missing webhook secret",
      });

      res.status(503).send("Webhooks secret is not provided");
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
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ?? u.email_addresses?.[0]?.email_address;

      await db
        .insert(users)
        .values({
          clerkId: u.id,
          email,
          isAdmin: false,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {email, updatedAt: new Date()},
        });
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        await db.delete(users).where(eq(users.clerkId, id));
      }
    }

    res.json({ok: true});
  } catch (err) {
    Sentry.logger.error("Clerk webhook error", {
      reason: "Webhook error",
      error: err,
    });

    res.status(400).json({error: "Invalid webhook"});
  }
}
