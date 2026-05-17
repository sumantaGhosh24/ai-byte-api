import express, { Request, Response, NextFunction } from "express";

import request from "supertest";

import app from "../src/app";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));

jest.mock("../src/config/arcjet", () => ({
  __esModule: true,
  default: {
    withRule: jest.fn(() => ({
      protect: jest.fn().mockResolvedValue({
        isDenied: () => false,
      }),
    })),
  },
}));

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
  clerkWebhookHandler: (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
    });
  },
}));

jest.mock("../src/routes/user.route", () => {
  const router = express.Router();

  router.get("/users/test", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      route: "user",
    });
  });

  return {
    __esModule: true,
    default: router,
  };
});

jest.mock("../src/routes/profile.route", () => {
  const router = express.Router();

  router.get("/profiles/test", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      route: "profile",
    });
  });

  return {
    __esModule: true,
    default: router,
  };
});

describe("App Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return root message", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.text).toBe("AIByte Website API!");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("success", true);

      expect(response.body).toHaveProperty("status", "OK");

      expect(response.body).toHaveProperty("timestamp");

      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("GET /api", () => {
    it("should return api message", async () => {
      const response = await request(app).get("/api").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "AIByte Website API is working!",
      });
    });
  });

  describe("POST /webhooks/clerk", () => {
    it("should handle clerk webhook", async () => {
      const response = await request(app)
        .post("/webhooks/clerk")
        .send({
          test: true,
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
      });
    });
  });

  describe("GET /api/users/test", () => {
    it("should access mocked user route", async () => {
      const response = await request(app).get("/api/users/test").expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "user",
      });
    });
  });

  describe("GET /api/profiles/test", () => {
    it("should access mocked profile route", async () => {
      const response = await request(app).get("/api/profiles/test").expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "profile",
      });
    });
  });

  describe("GET /not-found", () => {
    it("should return 404", async () => {
      const response = await request(app).get("/not-found").expect(404);

      expect(response.body).toEqual({
        message: "Route not found!",
      });
    });
  });
});
