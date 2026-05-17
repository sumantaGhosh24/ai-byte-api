import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../../src/validations/category.validation";

describe("Category Validation", () => {
  describe("categoryIdSchema", () => {
    it("should validate valid id", () => {
      const result = categoryIdSchema.safeParse({
        id: "category-1",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", () => {
      const result = categoryIdSchema.safeParse({
        id: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createCategorySchema", () => {
    it("should validate valid payload", () => {
      const payload = {
        name: "Programming",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "image-public-id",
        visibility: "public",
      };

      const result = createCategorySchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it("should fail when name is missing", () => {
      const payload = {
        imageUrl: "https://example.com/image.png",
        imagePublicId: "image-public-id",
        visibility: "public",
      };

      const result = createCategorySchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it("should fail when visibility is invalid", () => {
      const payload = {
        name: "Programming",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "image-public-id",
        visibility: "hidden",
      };

      const result = createCategorySchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it("should fail when imageUrl is missing", () => {
      const payload = {
        name: "Programming",
        imagePublicId: "image-public-id",
        visibility: "public",
      };

      const result = createCategorySchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it("should fail when imagePublicId is missing", () => {
      const payload = {
        name: "Programming",
        imageUrl: "https://example.com/image.png",
        visibility: "public",
      };

      const result = createCategorySchema.safeParse(payload);

      expect(result.success).toBe(false);
    });
  });

  describe("updateCategorySchema", () => {
    it("should validate partial payload", () => {
      const payload = {
        name: "Updated Category",
      };

      const result = updateCategorySchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it("should validate full payload", () => {
      const payload = {
        name: "Updated Category",
        imageUrl: "https://example.com/image.png",
        imagePublicId: "public-id",
        visibility: "private",
      };

      const result = updateCategorySchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it("should fail for invalid visibility", () => {
      const payload = {
        visibility: "invalid",
      };

      const result = updateCategorySchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it("should fail for empty name", () => {
      const payload = {
        name: "",
      };

      const result = updateCategorySchema.safeParse(payload);

      expect(result.success).toBe(false);
    });
  });
});
