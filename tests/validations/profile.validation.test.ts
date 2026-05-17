import {
  updateProfileSchema,
  updatePreferencesSchema,
} from "../../src/validations/profile.validation";

describe("Profile Validation Schemas", () => {
  describe("updateProfileSchema", () => {
    it("should validate valid profile data", () => {
      const data = {
        name: "John Doe",
        username: "johndoe",
        bio: "Software Developer",
        avatarUrl: "https://example.com/avatar.png",
        avatarPublicId: "avatar_123",
        interests: "AI, Coding",
        goals: "Become fullstack developer",
        onboardingCompleted: true,
      };

      const result = updateProfileSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should validate empty object", () => {
      const result = updateProfileSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should fail when name is empty", () => {
      const result = updateProfileSchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    it("should fail when username is empty", () => {
      const result = updateProfileSchema.safeParse({
        username: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["username"]);
      }
    });

    it("should fail when onboardingCompleted is not boolean", () => {
      const result = updateProfileSchema.safeParse({
        onboardingCompleted: "true",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["onboardingCompleted"]);
      }
    });

    it("should fail when avatarUrl is not string", () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: 123,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["avatarUrl"]);
      }
    });
  });

  describe("updatePreferencesSchema", () => {
    it("should validate valid preferences data", () => {
      const data = {
        learningPreference: "beginner",
        videoPreference: "medium",
        dailyReminderEnabled: true,
        dailyReminderTime: "09:30",
        streakReminderEnabled: true,
        lessonReminderEnabled: false,
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: false,
      };

      const result = updatePreferencesSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it("should validate empty object", () => {
      const result = updatePreferencesSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should fail for invalid learningPreference", () => {
      const result = updatePreferencesSchema.safeParse({
        learningPreference: "expert",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["learningPreference"]);
      }
    });

    it("should fail for invalid videoPreference", () => {
      const result = updatePreferencesSchema.safeParse({
        videoPreference: "extra-long",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["videoPreference"]);
      }
    });

    it("should validate correct HH:mm time format", () => {
      const result = updatePreferencesSchema.safeParse({
        dailyReminderTime: "23:59",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for invalid time format", () => {
      const result = updatePreferencesSchema.safeParse({
        dailyReminderTime: "25:99",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["dailyReminderTime"]);

        expect(result.error.issues[0]?.message).toBe(
          "Invalid time format (HH:mm)"
        );
      }
    });

    it("should fail when dailyReminderEnabled is not boolean", () => {
      const result = updatePreferencesSchema.safeParse({
        dailyReminderEnabled: "true",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["dailyReminderEnabled"]);
      }
    });

    it("should fail when pushNotificationsEnabled is not boolean", () => {
      const result = updatePreferencesSchema.safeParse({
        pushNotificationsEnabled: "yes",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual([
          "pushNotificationsEnabled",
        ]);
      }
    });
  });
});
