import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import request from "supertest";

import courseRoutes from "../../src/routes/course.route";

const mockGetAllCoursesController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({ message: "get all courses" });
});

const mockGetPublicCoursesController = jest.fn(
  (req: Request, res: Response) => {
    res.status(200).json({ message: "get public courses" });
  }
);

const mockGetCourseController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({ message: "get single course" });
});

const mockGetPublicCourseController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({ message: "get public single course" });
});

const mockCreateCourseController = jest.fn((req: Request, res: Response) => {
  res.status(201).json({ message: "course created" });
});

const mockUpdateCourseController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({ message: "course updated" });
});

const mockDeleteCourseController = jest.fn((req: Request, res: Response) => {
  res.status(200).json({ message: "course deleted" });
});

jest.mock("../../src/controllers/course.controller", () => ({
  getAllCoursesController: (req: Request, res: Response) =>
    mockGetAllCoursesController(req, res),

  getPublicCoursesController: (req: Request, res: Response) =>
    mockGetPublicCoursesController(req, res),

  getCourseController: (req: Request, res: Response) =>
    mockGetCourseController(req, res),

  getPublicCourseController: (req: Request, res: Response) =>
    mockGetPublicCourseController(req, res),

  createCourseController: (req: Request, res: Response) =>
    mockCreateCourseController(req, res),

  updateCourseController: (req: Request, res: Response) =>
    mockUpdateCourseController(req, res),

  deleteCourseController: (req: Request, res: Response) =>
    mockDeleteCourseController(req, res),
}));

jest.mock("../../src/middlewares/auth.middleware", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middlewares/admin.middleware", () => ({
  requireAdmin: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middlewares/onboarding.middleware", () => ({
  requireOnboarding: (req: Request, res: Response, next: NextFunction) =>
    next(),
}));

jest.mock("../../src/middlewares/rateLimit.middleware", () => ({
  generalRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middlewares/cache.middleware", () => ({
  cacheMiddleware: () => {
    return (req: Request, res: Response, next: NextFunction) => next();
  },
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    courses: jest.fn(() => "courses-key"),
    course: jest.fn(() => "course-key"),
  },
}));

describe("Course Routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", courseRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /courses", () => {
    it("should call getAllCoursesController", async () => {
      const response = await request(app).get("/api/v1/courses").expect(200);

      expect(response.body.message).toBe("get all courses");
      expect(mockGetAllCoursesController).toHaveBeenCalled();
    });
  });

  describe("GET /courses/public", () => {
    it("should call getPublicCoursesController", async () => {
      const response = await request(app)
        .get("/api/v1/courses/public")
        .expect(200);

      expect(response.body.message).toBe("get public courses");
      expect(mockGetPublicCoursesController).toHaveBeenCalled();
    });
  });

  describe("GET /courses/:id", () => {
    it("should call getCourseController", async () => {
      const response = await request(app)
        .get("/api/v1/courses/course_123")
        .expect(200);

      expect(response.body.message).toBe("get single course");
      expect(mockGetCourseController).toHaveBeenCalled();
    });
  });

  describe("GET /courses/public/:id", () => {
    it("should call getPublicCourseController", async () => {
      const response = await request(app)
        .get("/api/v1/courses/public/course_123")
        .expect(200);

      expect(response.body.message).toBe("get public single course");

      expect(mockGetPublicCourseController).toHaveBeenCalled();
    });
  });

  describe("POST /courses", () => {
    it("should call createCourseController", async () => {
      const response = await request(app)
        .post("/api/v1/courses")
        .send({
          title: "Node.js Course",
        })
        .expect(201);

      expect(response.body.message).toBe("course created");
      expect(mockCreateCourseController).toHaveBeenCalled();
    });
  });

  describe("PUT /courses/:id", () => {
    it("should call updateCourseController", async () => {
      const response = await request(app)
        .put("/api/v1/courses/course_123")
        .send({
          title: "Updated Course",
        })
        .expect(200);

      expect(response.body.message).toBe("course updated");
      expect(mockUpdateCourseController).toHaveBeenCalled();
    });
  });

  describe("DELETE /courses/:id", () => {
    it("should call deleteCourseController", async () => {
      const response = await request(app)
        .delete("/api/v1/courses/course_123")
        .expect(200);

      expect(response.body.message).toBe("course deleted");
      expect(mockDeleteCourseController).toHaveBeenCalled();
    });
  });
});
