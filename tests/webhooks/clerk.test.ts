import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import * as Sentry from "@sentry/node";

import { clerkWebhookHandler } from "../../src/webhooks/clerk";
import { db } from "../../src/db";
import { env } from "../../src/config/env";

jest.mock("@clerk/backend/webhooks", () => ({
  verifyWebhook: jest.fn(),
}));

jest.mock("../../src/config/env", () => ({
  env: {
    CLERK_WEBHOOK_SECRET: "test_webhook_secret",
    BASE_URL: "http://localhost:3000",
  },
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockOnConflictDoUpdate = jest.fn();

const mockValues = jest.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));

const mockWhere = jest.fn();

jest.mock("../../src/db", () => ({
  db: {
    insert: jest.fn(() => ({
      values: mockValues,
    })),
    delete: jest.fn(() => ({
      where: mockWhere,
    })),
  },
}));

jest.mock("../../src/db/schema", () => ({
  users: {
    clerkId: "clerkId",
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

describe("clerkWebhookHandler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: Buffer.from(JSON.stringify({ test: true })),
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("should return 503 when webhook secret is missing", async () => {
    env.CLERK_WEBHOOK_SECRET = "";

    await clerkWebhookHandler(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(503);

    expect(res.send).toHaveBeenCalledWith("Webhooks secret is not provided");

    expect(Sentry.logger.error).toHaveBeenCalled();
  });

  it("should handle user.created webhook", async () => {
    env.CLERK_WEBHOOK_SECRET = "test_secret";

    (verifyWebhook as jest.Mock).mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_123",
        primary_email_address_id: "email_1",
        email_addresses: [
          {
            id: "email_1",
            email_address: "test@example.com",
          },
        ],
      },
    });

    await clerkWebhookHandler(req as Request, res as Response);

    expect(verifyWebhook).toHaveBeenCalled();

    expect(db.insert).toHaveBeenCalled();

    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "user_123",
      email: "test@example.com",
      isAdmin: false,
    });

    expect(mockOnConflictDoUpdate).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  it("should handle user.updated webhook", async () => {
    (verifyWebhook as jest.Mock).mockResolvedValue({
      type: "user.updated",
      data: {
        id: "user_456",
        primary_email_address_id: "email_2",
        email_addresses: [
          {
            id: "email_2",
            email_address: "updated@example.com",
          },
        ],
      },
    });

    await clerkWebhookHandler(req as Request, res as Response);

    expect(db.insert).toHaveBeenCalled();

    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "user_456",
      email: "updated@example.com",
      isAdmin: false,
    });

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  it("should handle user.deleted webhook", async () => {
    (verifyWebhook as jest.Mock).mockResolvedValue({
      type: "user.deleted",
      data: {
        id: "user_delete_123",
      },
    });

    await clerkWebhookHandler(req as Request, res as Response);

    expect(db.delete).toHaveBeenCalled();

    expect(mockWhere).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  it("should handle webhook verification errors", async () => {
    (verifyWebhook as jest.Mock).mockRejectedValue(
      new Error("Invalid webhook")
    );

    await clerkWebhookHandler(req as Request, res as Response);

    expect(Sentry.logger.error).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid webhook",
    });
  });

  it("should fallback to first email if primary email is missing", async () => {
    (verifyWebhook as jest.Mock).mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_fallback",
        primary_email_address_id: "missing_email",
        email_addresses: [
          {
            id: "email_1",
            email_address: "fallback@example.com",
          },
        ],
      },
    });

    await clerkWebhookHandler(req as Request, res as Response);

    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "user_fallback",
      email: "fallback@example.com",
      isAdmin: false,
    });

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });
});
