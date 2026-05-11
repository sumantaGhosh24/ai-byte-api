import { NextFunction, Request, Response } from "express";
import request from "supertest";

import app from "../src/app";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));

jest.mock("../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../src/middlewares/security.middleware", () =>
  jest.fn((req, res, next) => next())
);

jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  setupExpressErrorHandler: jest.fn(),
}));

jest.mock("@clerk/express", () => ({
  clerkMiddleware: () => (req: Request, res: Response, next: NextFunction) =>
    next(),
}));

jest.mock("../src/middlewares/sentryClerkUser.middleware", () => ({
  sentryClerkUserMiddleware: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => next(),
}));

jest.mock("../src/webhooks/clerk", () => ({
  clerkWebhookHandler: (req: Request, res: Response) =>
    res.status(200).json({ success: true }),
}));

describe("API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("GET /", () => {
    it("should return root message", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.text).toBe("AIByte Website API!");
    });
  });

  describe("GET /api", () => {
    it("should return API message", async () => {
      const response = await request(app).get("/api").expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "AIByte Website API is working!"
      );
    });
  });

  describe("POST /webhooks/clerk", () => {
    it("should handle clerk webhook", async () => {
      const response = await request(app)
        .post("/webhooks/clerk")
        .send({ test: true })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
      });
    });
  });

  describe("GET /notfound", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/notfound").expect(404);

      expect(response.body).toHaveProperty("message", "Route not found!");
    });
  });
});
