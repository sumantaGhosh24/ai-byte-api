import express, { Request, Response, NextFunction } from "express";
import request from "supertest";

import router from "../../src/routes/profile.route";
import { redisKeys } from "../../src/utils/redisKeys";

const mockCacheMiddleware = jest.fn();

const mockGetProfileController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    route: "get-profile",
  });
});

const mockGetPublicProfileController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      route: "public-profile",
    });
  }
);

const mockUpdateProfileController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    route: "update-profile",
  });
});

const mockUpdatePreferencesController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      route: "update-preferences",
    });
  }
);

jest.mock("../../src/middlewares/auth.middleware", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middlewares/rateLimit.middleware", () => ({
  generalRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
}));

/* eslint-disable indent */
jest.mock("../../src/middlewares/cache.middleware", () => ({
  cacheMiddleware:
    (keyBuilder: (_req: Request) => string) =>
    (req: Request, res: Response, next: NextFunction) => {
      mockCacheMiddleware(keyBuilder);

      next();
    },
}));

jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(() => ({
    userId: "user_123",
  })),
}));

jest.mock("../../src/controllers/profile.controller", () => ({
  getProfileController: (req: Request, res: Response) =>
    mockGetProfileController(req, res),

  getPublicProfileController: (req: Request, res: Response) =>
    mockGetPublicProfileController(req, res),

  updateProfileController: (req: Request, res: Response) =>
    mockUpdateProfileController(req, res),

  updatePreferencesController: (req: Request, res: Response) =>
    mockUpdatePreferencesController(req, res),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    publicProfile: jest.fn((id: string) => `public-profile:${id}`),

    profile: jest.fn((id: string) => `profile:${id}`),
  },
}));

describe("Profile Routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/api", router);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /profile/:id", () => {
    it("should return public profile", async () => {
      const response = await request(app)
        .get("/api/profile/user_1")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "public-profile",
      });

      expect(mockGetPublicProfileController).toHaveBeenCalled();
    });

    it("should call public profile cache key builder", async () => {
      await request(app).get("/api/profile/user_1").expect(200);

      const keyBuilder = mockCacheMiddleware.mock.calls[0][0];

      const mockReq = {
        params: {
          id: "user_1",
        },
      };

      keyBuilder(mockReq as unknown as Request);

      expect(redisKeys.publicProfile).toHaveBeenCalledWith(
        JSON.stringify("user_1")
      );
    });
  });

  describe("GET /profile", () => {
    it("should return authenticated profile", async () => {
      const response = await request(app).get("/api/profile").expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "get-profile",
      });

      expect(mockGetProfileController).toHaveBeenCalled();
    });

    it("should call profile cache key builder", async () => {
      await request(app).get("/api/profile").expect(200);

      const keyBuilder = mockCacheMiddleware.mock.calls[0][0];

      const mockReq = {};

      keyBuilder(mockReq as unknown as Request);

      expect(redisKeys.profile).toHaveBeenCalledWith("user_123");
    });
  });

  describe("PATCH /profile", () => {
    it("should update profile", async () => {
      const response = await request(app)
        .patch("/api/profile")
        .send({
          name: "John",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "update-profile",
      });

      expect(mockUpdateProfileController).toHaveBeenCalled();
    });
  });

  describe("PATCH /profile/preferences", () => {
    it("should update preferences", async () => {
      const response = await request(app)
        .patch("/api/profile/preferences")
        .send({
          learningPreference: "beginner",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        route: "update-preferences",
      });

      expect(mockUpdatePreferencesController).toHaveBeenCalled();
    });
  });
});
