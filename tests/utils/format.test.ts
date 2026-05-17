import { ZodError, z } from "zod";

import { formatValidationError } from "../../src/utils/format";

describe("formatValidationError", () => {
  it("should return joined validation messages", () => {
    const schema = z.object({
      password: z.string().min(6),
    });

    const result = schema.safeParse({
      password: "123",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const formattedError = formatValidationError(result.error);

      expect(formattedError).toContain(
        "Too small: expected string to have >=6 characters"
      );
    }
  });

  it("should return single validation message", () => {
    const schema = z.object({
      username: z.string().min(1),
    });

    const result = schema.safeParse({
      username: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const formattedError = formatValidationError(result.error);

      expect(formattedError).toContain("Too small");
    }
  });

  it("should return fallback message when issues are missing", () => {
    const invalidError = {
      issues: undefined,
    } as unknown as ZodError;

    const result = formatValidationError(invalidError);

    expect(result).toBe("Validation failed");
  });

  it("should return fallback message when error is undefined", () => {
    const result = formatValidationError(undefined as unknown as ZodError);

    expect(result).toBe("Validation failed");
  });

  it("should join multiple error messages with comma", () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().min(18),
    });

    const result = schema.safeParse({
      name: "ab",
      age: 10,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const formattedError = formatValidationError(result.error);

      expect(formattedError).toContain(",");

      expect(formattedError).toContain("Too small");
    }
  });
});
