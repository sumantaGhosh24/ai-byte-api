import {
  getAllCoursesService,
  getPublicCoursesService,
  getCourseService,
  getPublicCourseService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
} from "../../src/services/course.service";
import { db } from "../../src/db";

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../../src/db", () => {
  const mockFindMany = jest.fn();
  const mockFindFirst = jest.fn();

  const mockWhere = jest.fn();

  const mockFrom = jest.fn(() => ({
    where: mockWhere,
  }));

  const mockSelect = jest.fn(() => ({
    from: mockFrom,
  }));

  const mockReturningInsert = jest.fn();

  const mockValues = jest.fn(() => ({
    returning: mockReturningInsert,
  }));

  const mockInsert = jest.fn(() => ({
    values: mockValues,
  }));

  const mockReturningUpdate = jest.fn();

  const mockUpdateWhere = jest.fn(() => ({
    returning: mockReturningUpdate,
  }));

  const mockSet = jest.fn(() => ({
    where: mockUpdateWhere,
  }));

  const mockUpdate = jest.fn(() => ({
    set: mockSet,
  }));

  const mockReturningDelete = jest.fn();

  const mockDeleteWhere = jest.fn(() => ({
    returning: mockReturningDelete,
  }));

  const mockDelete = jest.fn(() => ({
    where: mockDeleteWhere,
  }));

  return {
    db: {
      query: {
        courses: {
          findMany: mockFindMany,
          findFirst: mockFindFirst,
        },
      },

      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
});

describe("Course Service", () => {
  let mockFindMany: jest.Mock;
  let mockFindFirst: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFindMany = db.query.courses.findMany as jest.Mock;
    mockFindFirst = db.query.courses.findFirst as jest.Mock;
    mockSelect = db.select as jest.Mock;
    mockInsert = db.insert as jest.Mock;
    mockUpdate = db.update as jest.Mock;
    mockDelete = db.delete as jest.Mock;
  });

  describe("getAllCoursesService", () => {
    it("should return paginated courses", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "1",
          title: "Node.js",
        },
      ]);

      const mockCountWhere = jest.fn().mockResolvedValue([
        {
          count: 1,
        },
      ]);

      const mockCountFrom = jest.fn(() => ({
        where: mockCountWhere,
      }));

      mockSelect.mockReturnValue({
        from: mockCountFrom,
      });

      const result = await getAllCoursesService({
        page: 1,
        limit: 10,
      });

      expect(mockFindMany).toHaveBeenCalled();

      expect(result).toEqual({
        items: [
          {
            id: "1",
            title: "Node.js",
          },
        ],
        paginations: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });
    });

    it("should throw error", async () => {
      mockFindMany.mockRejectedValue(new Error("Database error"));

      await expect(
        getAllCoursesService({
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Database error");
    });
  });

  describe("getPublicCoursesService", () => {
    it("should return public courses", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "1",
          title: "React",
        },
      ]);

      const mockCountWhere = jest.fn().mockResolvedValue([
        {
          count: 1,
        },
      ]);

      const mockCountFrom = jest.fn(() => ({
        where: mockCountWhere,
      }));

      mockSelect.mockReturnValue({
        from: mockCountFrom,
      });

      const result = await getPublicCoursesService({
        page: 1,
        limit: 10,
      });

      expect(mockFindMany).toHaveBeenCalled();

      expect(result).toEqual({
        items: [
          {
            id: "1",
            title: "React",
          },
        ],
        paginations: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });
    });
  });

  describe("getCourseService", () => {
    it("should return a course", async () => {
      const course = {
        id: "course-1",
        title: "Node.js",
      };

      mockFindFirst.mockResolvedValue(course);

      const result = await getCourseService("course-1");

      expect(mockFindFirst).toHaveBeenCalled();
      expect(result).toEqual(course);
    });

    it("should throw if course not found", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(getCourseService("course-1")).rejects.toThrow(
        "Course not found"
      );
    });
  });

  describe("getPublicCourseService", () => {
    it("should return public course", async () => {
      const course = {
        id: "course-1",
        title: "React",
      };

      mockFindFirst.mockResolvedValue(course);

      const result = await getPublicCourseService("course-1");

      expect(mockFindFirst).toHaveBeenCalled();
      expect(result).toEqual(course);
    });

    it("should throw if public course not found", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(getPublicCourseService("course-1")).rejects.toThrow(
        "Course not found"
      );
    });
  });

  describe("createCourseService", () => {
    it("should create a course", async () => {
      const createdCourse = {
        id: "course-1",
        title: "node.js",
      };

      const mockReturningInsert = jest.fn().mockResolvedValue([createdCourse]);

      const mockValues = jest.fn(() => ({
        returning: mockReturningInsert,
      }));

      mockInsert.mockReturnValue({
        values: mockValues,
      });

      const result = await createCourseService({
        categoryId: "cat-1",
        title: "Node.js",
        description: "Backend Course",
        difficulty: "beginner",
        duration: "10h",
        visibility: "public",
        status: "pending",
        xpReward: 100,
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(createdCourse);
    });

    it("should throw on create error", async () => {
      const mockReturningInsert = jest
        .fn()
        .mockRejectedValue(new Error("Create failed"));

      const mockValues = jest.fn(() => ({
        returning: mockReturningInsert,
      }));

      mockInsert.mockReturnValue({
        values: mockValues,
      });

      await expect(
        createCourseService({
          categoryId: "cat-1",
          title: "Node.js",
          description: "Backend Course",
          difficulty: "beginner",
          duration: "10h",
          visibility: "public",
          status: "pending",
          xpReward: 100,
        })
      ).rejects.toThrow("Create failed");
    });
  });

  describe("updateCourseService", () => {
    it("should update a course", async () => {
      mockFindFirst.mockResolvedValue({
        id: "course-1",
      });

      const updatedCourse = {
        id: "course-1",
        title: "updated",
      };

      const mockReturningUpdate = jest.fn().mockResolvedValue([updatedCourse]);

      const mockWhere = jest.fn(() => ({
        returning: mockReturningUpdate,
      }));

      const mockSet = jest.fn(() => ({
        where: mockWhere,
      }));

      mockUpdate.mockReturnValue({
        set: mockSet,
      });

      const result = await updateCourseService({
        id: "course-1",
        title: "Updated",
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updatedCourse);
    });

    it("should throw if course does not exist", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(
        updateCourseService({
          id: "course-1",
          title: "Updated",
        })
      ).rejects.toThrow("Course not found");
    });
  });

  describe("deleteCourseService", () => {
    it("should delete a course", async () => {
      mockFindFirst.mockResolvedValue({
        id: "course-1",
      });

      const deletedCourse = {
        id: "course-1",
      };

      const mockReturningDelete = jest.fn().mockResolvedValue([deletedCourse]);

      const mockWhere = jest.fn(() => ({
        returning: mockReturningDelete,
      }));

      mockDelete.mockReturnValue({
        where: mockWhere,
      });

      const result = await deleteCourseService("course-1");

      expect(mockDelete).toHaveBeenCalled();
      expect(result).toEqual(deletedCourse);
    });

    it("should throw if course does not exist", async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(deleteCourseService("course-1")).rejects.toThrow(
        "Course not found"
      );
    });
  });
});
