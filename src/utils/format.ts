import { ZodError } from "zod";

export const formatValidationError = (errors: ZodError) => {
  if (!errors || !errors.issues) return "Validation failed";

  if (Array.isArray(errors.issues))
    return errors.issues.map((i: { message: string }) => i.message).join(", ");

  return JSON.stringify(errors);
};
