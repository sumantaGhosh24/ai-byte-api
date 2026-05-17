import {
  courseIdSchema,
  createCourseSchema,
  updateCourseSchema,
} from "../../src/validations/course.validation";

describe("course schemas", () => {
  describe("courseIdSchema", () => {
    it("should validate valid course id", () => {
      const data = { id: "course_123" };

      const result = courseIdSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should fail when id is empty", () => {
      const data = { id: "" };

      const result = courseIdSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail when id is missing", () => {
      const data = {};

      const result = courseIdSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe("createCourseSchema", () => {
    const validData = {
      categoryId: "cat_123",
      title: "Node.js Mastery",
      description: "Learn backend development",
      thumbnailUrl: "https://example.com/image.png",
      thumbnailPublicId: "thumb_123",
      difficulty: "beginner",
      duration: "10h",
      visibility: "public",
      status: "pending",
      xpReward: 100,
    };

    it("should validate valid course data", () => {
      const result = createCourseSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should allow optional thumbnail fields", () => {
      const data = {
        ...validData,
        thumbnailUrl: undefined,
        thumbnailPublicId: undefined,
      };

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should fail when required fields are missing", () => {
      const data = {};

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail with invalid difficulty", () => {
      const data = {
        ...validData,
        difficulty: "expert",
      };

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail with invalid visibility", () => {
      const data = {
        ...validData,
        visibility: "protected",
      };

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail with invalid status", () => {
      const data = {
        ...validData,
        status: "draft",
      };

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail when xpReward is negative", () => {
      const data = {
        ...validData,
        xpReward: -10,
      };

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail when xpReward is not an integer", () => {
      const data = {
        ...validData,
        xpReward: 10.5,
      };

      const result = createCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe("updateCourseSchema", () => {
    const validData = {
      categoryId: "cat_123",
      title: "Updated Course",
      description: "Updated description",
      difficulty: "advanced",
      duration: "20h",
      visibility: "private",
      status: "completed",
      xpReward: 200,
    };

    it("should validate valid update data", () => {
      const result = updateCourseSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should allow partial updates", () => {
      const data = {
        categoryId: "cat_123",
        title: "Only title updated",
      };

      const result = updateCourseSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should fail when categoryId is missing", () => {
      const data = {
        title: "Updated title",
      };

      const result = updateCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail with invalid difficulty", () => {
      const data = {
        categoryId: "cat_123",
        difficulty: "expert",
      };

      const result = updateCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail when xpReward is negative", () => {
      const data = {
        categoryId: "cat_123",
        xpReward: -1,
      };

      const result = updateCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it("should fail when xpReward is decimal", () => {
      const data = {
        categoryId: "cat_123",
        xpReward: 99.99,
      };

      const result = updateCourseSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });
});
