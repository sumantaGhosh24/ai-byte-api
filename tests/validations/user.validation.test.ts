import { userIdSchema } from "../../src/validations/user.validation";

describe("User Validation Schemas", () => {
  describe("userIdSchema", () => {
    it("should validate a correct userId", () => {
      const data = {
        userId: "user_123",
      };

      const result = userIdSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should fail when userId is missing", () => {
      const data = {};

      const result = userIdSchema.safeParse(data);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["userId"]);
      }
    });

    it("should fail when userId is empty", () => {
      const data = {
        userId: "",
      };

      const result = userIdSchema.safeParse(data);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["userId"]);

        expect(result.error.issues[0]?.message).toContain("Too small");
      }
    });

    it("should fail when userId is not a string", () => {
      const data = {
        userId: 12345,
      };

      const result = userIdSchema.safeParse(data);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["userId"]);
      }
    });
  });
});
