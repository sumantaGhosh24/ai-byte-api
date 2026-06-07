export const redisKeys = {
  users: (query: string) => `users:${query}`,

  profile: (userId: string) => `profile:${userId}`,
  publicProfile: (userId: string) => `public:profile:${userId}`,

  categories: "categories:all",
  adminCategories: (query: string) => `admin:categories:${query}`,
  category: (id: string) => `category:${id}`,

  allCourses: (query: string) => `courses:all:${query}`,
  publicCourses: (userId: string, query: string) =>
    `courses:public:${userId}:${query}`,
  myCourses: (userId: string, query: string) => `courses:my:${userId}:${query}`,
  recommendedCourses: (userId: string, query: string) =>
    `courses:recommended:${userId}:${query}`,
  bookmarkCourses: (userId: string, query: string) =>
    `courses:bookmark:${userId}:${query}`,
  trendingCourses: (userId: string, query: string) =>
    `courses:trending${userId}:${query}`,
  course: (id: string) => `course:${id}`,
  myCourse: (id: string, userId: string) => `course:${id}:${userId}`,

  enrolls: (courseId: string, query: string) => `enrolls:${courseId}:${query}`,

  bookmarks: (courseId: string, query: string) =>
    `bookmarks:${courseId}:${query}`,

  reviews: (courseId: string, query: string) => `reviews:${courseId}:${query}`,
  userReviews: (userId: string, query: string) =>
    `reviews:user:${userId}:${query}`,
  courseReviews: (courseId: string, query: string) =>
    `reviews:course:${courseId}:${query}`,

  allLessons: (courseId: string, query: string) =>
    `lessons:all:${courseId}:${query}`,
  lessons: (courseId: string, userId: string, query: string) =>
    `lessons:${courseId}:${userId}:${query}`,
  lesson: (id: string) => `lesson:${id}`,
  publicLesson: (id: string, userId: string) => `lesson:public:${id}:${userId}`,

  progresses: (lessonId: string, query: string) =>
    `progresses:${lessonId}:${query}`,

  allQuizzes: (courseId: string, query: string) =>
    `quizzes:all:${courseId}:${query}`,
  quizzes: (courseId: string, query: string) => `quizzes:${courseId}:${query}`,
  quiz: (id: string) => `quiz:${id}`,
  publicQuiz: (id: string) => `quiz:public:${id}`,

  allQuestions: (quizId: string, query: string) =>
    `questions:all:${quizId}:${query}`,
  questions: (quizId: string, query: string) => `questions:${quizId}:${query}`,
  question: (id: string) => `question:${id}`,
  publicQuestion: (id: string) => `question:public:${id}`,

  userQuizAttempts: (userId: string, quizId: string, query: string) =>
    `attempts:${userId}:${quizId}:${query}`,
  userAttempts: (userId: string, query: string) =>
    `attempts:user:${userId}:${query}`,
  attempts: (quizId: string, query: string) => `attempts:${quizId}:${query}`,
  attempt: (id: string) => `attempt:${id}`,

  achievements: (query: string) => `achievements:${query}`,
  achievement: (id: string) => `achievement:${id}`,
  userAchievements: (userId: string) => `achievements:user:${userId}`,

  dashboard: "dashboard",
};
