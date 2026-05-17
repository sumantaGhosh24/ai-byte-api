import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { logger } from "@sentry/node";

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

const mockReturning = jest.fn();

const mockOnConflictDoUpdate = jest.fn(() => ({
  returning: mockReturning,
}));

const mockValues = jest.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));

const mockWhere = jest.fn();

const mockTxInsert = jest.fn(() => ({
  values: jest.fn(),
}));

const mockTxDelete = jest.fn(() => ({
  where: jest.fn(),
}));

jest.mock("../../src/db", () => ({
  db: {
    insert: jest.fn(() => ({
      values: mockValues,
    })),
    delete: jest.fn(() => ({
      where: mockWhere,
    })),
    transaction: jest.fn(async callback => {
      await callback({
        insert: mockTxInsert,
        delete: mockTxDelete,
      });
    }),
  },
}));

jest.mock("../../src/db/schema", () => ({
  users: {
    id: "id",
    clerkId: "clerkId",
  },
  profiles: {
    userId: "userId",
  },
  streaks: {
    userId: "userId",
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
    };

    jest.clearAllMocks();
  });

  it("should return 503 when webhook secret is missing", async () => {
    env.CLERK_WEBHOOK_SECRET = "";

    await clerkWebhookHandler(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(503);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Webhooks secret is not provided",
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle user.created webhook", async () => {
    env.CLERK_WEBHOOK_SECRET = "test_webhook_secret";

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

    mockReturning.mockResolvedValue([
      {
        id: "db_user_1",
      },
    ]);

    await clerkWebhookHandler(req as Request, res as Response);

    expect(db.insert).toHaveBeenCalled();

    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "user_123",
      email: "test@example.com",
      xp: 0,
      isAdmin: false,
    });

    expect(mockOnConflictDoUpdate).toHaveBeenCalled();

    expect(mockReturning).toHaveBeenCalled();

    expect(db.transaction).toHaveBeenCalled();

    expect(mockTxInsert).toHaveBeenCalledTimes(2);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
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

    mockReturning.mockResolvedValue([
      {
        id: "db_user_2",
      },
    ]);

    await clerkWebhookHandler(req as Request, res as Response);

    expect(db.insert).toHaveBeenCalled();

    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "user_456",
      email: "updated@example.com",
      xp: 0,
      isAdmin: false,
    });

    expect(db.transaction).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
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

    expect(db.transaction).toHaveBeenCalled();

    expect(mockTxDelete).toHaveBeenCalledTimes(3);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ok: true,
    });
  });

  it("should handle webhook verification errors", async () => {
    (verifyWebhook as jest.Mock).mockRejectedValue(
      new Error("Invalid webhook")
    );

    await clerkWebhookHandler(req as Request, res as Response);

    expect(logger.error).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
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

    mockReturning.mockResolvedValue([
      {
        id: "db_user_fallback",
      },
    ]);

    await clerkWebhookHandler(req as Request, res as Response);

    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "user_fallback",
      email: "fallback@example.com",
      xp: 0,
      isAdmin: false,
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ok: true,
    });
  });
});
