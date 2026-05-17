import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../../src/validations/category.validation";

describe("Category Validation Schemas", () => {
  describe("categoryIdSchema", () => {
    it("should validate valid category id", () => {
      const result = categoryIdSchema.safeParse({
        id: "category_123",
      });

      expect(result.success).toBe(true);
    });

    it("should fail when id is empty", () => {
      const result = categoryIdSchema.safeParse({
        id: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["id"]);
      }
    });

    it("should fail when id is missing", () => {
      const result = categoryIdSchema.safeParse({});

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["id"]);
      }
    });
  });

  describe("createCategorySchema", () => {
    it("should validate valid category data", () => {
      const data = {
        name: "Technology",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "category_123",
      };

      const result = createCategorySchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should validate with only required fields", () => {
      const data = {
        name: "Technology",
      };

      const result = createCategorySchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should fail when name is empty", () => {
      const result = createCategorySchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    it("should fail when name is missing", () => {
      const result = createCategorySchema.safeParse({
        imageUrl: "https://example.com/image.png",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    it("should fail when imageUrl is not string", () => {
      const result = createCategorySchema.safeParse({
        name: "Technology",
        imageUrl: 123,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["imageUrl"]);
      }
    });

    it("should fail when imagePublicId is not string", () => {
      const result = createCategorySchema.safeParse({
        name: "Technology",
        imagePublicId: 123,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["imagePublicId"]);
      }
    });
  });

  describe("updateCategorySchema", () => {
    it("should validate valid update data", () => {
      const data = {
        name: "Updated Technology",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "category_456",
      };

      const result = updateCategorySchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should validate empty object", () => {
      const result = updateCategorySchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should validate partial update data", () => {
      const result = updateCategorySchema.safeParse({
        name: "Updated Category",
      });

      expect(result.success).toBe(true);
    });

    it("should fail when name is empty", () => {
      const result = updateCategorySchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    it("should fail when imageUrl is not string", () => {
      const result = updateCategorySchema.safeParse({
        imageUrl: 123,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["imageUrl"]);
      }
    });

    it("should fail when imagePublicId is not string", () => {
      const result = updateCategorySchema.safeParse({
        imagePublicId: 123,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["imagePublicId"]);
      }
    });
  });
});
