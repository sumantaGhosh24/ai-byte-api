import type { Request, Response } from "express";

import {
  getAllCoursesController,
  getPublicCoursesController,
  getCourseController,
  getPublicCourseController,
  createCourseController,
  updateCourseController,
  deleteCourseController,
} from "../../src/controllers/course.controller";
import {
  getAllCoursesService,
  getPublicCoursesService,
  getCourseService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
} from "../../src/services/course.service";
import {
  deleteCache,
  deleteManyCache,
  getKeys,
  setCache,
} from "../../src/utils/cache";

jest.mock("@sentry/node", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../src/services/course.service", () => ({
  getAllCoursesService: jest.fn(),
  getPublicCoursesService: jest.fn(),
  getCourseService: jest.fn(),
  createCourseService: jest.fn(),
  updateCourseService: jest.fn(),
  deleteCourseService: jest.fn(),
}));

jest.mock("../../src/utils/cache", () => ({
  setCache: jest.fn(),
  getKeys: jest.fn(),
  deleteManyCache: jest.fn(),
  deleteCache: jest.fn(),
}));

jest.mock("../../src/utils/redisKeys", () => ({
  redisKeys: {
    courses: jest.fn(() => "courses-cache-key"),
    course: jest.fn((id: string) => `course-${id}`),
  },
}));

describe("Course Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("getAllCoursesController", () => {
    it("should return all courses", async () => {
      const result = {
        data: [{ id: "1", title: "Course 1" }],
      };

      (getAllCoursesService as jest.Mock).mockResolvedValue(result);

      await getAllCoursesController(req as Request, res as Response);

      expect(getAllCoursesService).toHaveBeenCalled();

      expect(setCache).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        result,
      });
    });

    it("should handle errors", async () => {
      (getAllCoursesService as jest.Mock).mockRejectedValue(
        new Error("Something went wrong")
      );

      await getAllCoursesController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });
    });
  });

  describe("getPublicCoursesController", () => {
    it("should return public courses", async () => {
      const result = {
        data: [{ id: "1", title: "Public Course" }],
      };

      (getPublicCoursesService as jest.Mock).mockResolvedValue(result);

      await getPublicCoursesController(req as Request, res as Response);

      expect(getPublicCoursesService).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        result,
      });
    });
  });

  describe("getCourseController", () => {
    it("should return a course", async () => {
      req.params = { id: "course-1" };

      const course = {
        id: "course-1",
        title: "Node.js",
      };

      (getCourseService as jest.Mock).mockResolvedValue(course);

      await getCourseController(req as Request, res as Response);

      expect(getCourseService).toHaveBeenCalledWith("course-1");

      expect(setCache).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        course,
      });
    });

    it("should return validation error", async () => {
      req.params = { id: "" };

      await getCourseController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getPublicCourseController", () => {
    it("should return public course", async () => {
      req.params = { id: "course-1" };

      const course = {
        id: "course-1",
        title: "React",
      };

      (getCourseService as jest.Mock).mockResolvedValue(course);

      await getPublicCourseController(req as Request, res as Response);

      expect(getCourseService).toHaveBeenCalledWith("course-1");

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        course,
      });
    });
  });

  describe("createCourseController", () => {
    it("should create a course", async () => {
      req.body = {
        categoryId: "cat-1",
        title: "Node.js",
        description: "Backend course",
        difficulty: "beginner",
        duration: "10h",
        visibility: "public",
        status: "pending",
        xpReward: 100,
      };

      const createdCourse = {
        id: "course-1",
        ...req.body,
      };

      (createCourseService as jest.Mock).mockResolvedValue(createdCourse);

      (getKeys as jest.Mock).mockResolvedValue(["courses:1"]);

      await createCourseController(req as Request, res as Response);

      expect(createCourseService).toHaveBeenCalled();

      expect(deleteManyCache).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        course: createdCourse,
      });
    });

    it("should return validation error", async () => {
      req.body = {};

      await createCourseController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateCourseController", () => {
    it("should update a course", async () => {
      req.params = { id: "course-1" };

      req.body = {
        categoryId: "cat-1",
        title: "Updated Course",
      };

      const updatedCourse = {
        id: "course-1",
        title: "Updated Course",
      };

      (updateCourseService as jest.Mock).mockResolvedValue(updatedCourse);

      (getKeys as jest.Mock).mockResolvedValue(["courses:1"]);

      await updateCourseController(req as Request, res as Response);

      expect(updateCourseService).toHaveBeenCalled();

      expect(deleteManyCache).toHaveBeenCalled();

      expect(deleteCache).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        course: updatedCourse,
      });
    });

    it("should return validation error for invalid id", async () => {
      req.params = { id: "" };

      await updateCourseController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteCourseController", () => {
    it("should delete a course", async () => {
      req.params = { id: "course-1" };

      const deletedCourse = {
        id: "course-1",
      };

      (deleteCourseService as jest.Mock).mockResolvedValue(deletedCourse);

      (getKeys as jest.Mock).mockResolvedValue(["courses:1"]);

      await deleteCourseController(req as Request, res as Response);

      expect(deleteCourseService).toHaveBeenCalledWith("course-1");

      expect(deleteManyCache).toHaveBeenCalled();

      expect(deleteCache).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        course: deletedCourse,
      });
    });

    it("should return validation error", async () => {
      req.params = { id: "" };

      await deleteCourseController(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
