export const redisKeys = {
  profile: (userId: string) => `profile:${userId}`,
  publicProfile: (userId: string) => `public-profile:${userId}`,
  users: (query: string) => `users:${query}`,
  categories: "categories:all",
  pCategories: (query: string) => `categories-paginated:${query}`,
  category: (id: string) => `category:${id}`,
  courses: (query: string) => `courses:${query}`,
  course: (id: string) => `course:${id}`,
  lessons: (courseId: string) => `lessons:${courseId}`,
  publicLessons: (courseId: string) => `public-lessons:${courseId}`,
  lesson: (id: string) => `lesson:${id}`,
};
