export const redisKeys = {
  profile: (userId: string) => `profile:${userId}`,
  courses: "courses:all",
  course: (id: string) => `course:${id}`,
};
