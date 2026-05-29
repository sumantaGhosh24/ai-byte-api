export const redisKeys = {
  users: (query: string) => `users:${query}`,

  profile: (userId: string) => `profile:${userId}`,
  publicProfile: (userId: string) => `public:profile:${userId}`,

  categories: "categories:all",
  adminCategories: (query: string) => `admin:categories:${query}`,
  category: (id: string) => `category:${id}`,

  allCourses: (query: string) => `courses:all:${query}`,
  publicCourses: (query: string) => `courses:public:${query}`,
  myCourses: (userId: string, query: string) => `courses:my:${userId}:${query}`,
  recommendedCourses: (userId: string, query: string) =>
    `courses:recommended:${userId}:${query}`,
  bookmarkCourses: (userId: string, query: string) =>
    `courses:bookmark:${userId}:${query}`,
  trendingCourses: (query: string) => `courses:trending:${query}`,
  course: (id: string) => `course:${id}`,
  myCourse: (id: string, userId: string) => `course:${id}:user:${userId}`,

  enrolls: (courseId: string, query: string) => `enrolls:${courseId}:${query}`,
  enroll: (enrollId: string) => `enroll:${enrollId}`,

  bookmarks: (courseId: string, query: string) =>
    `bookmarks:${courseId}:${query}`,
  bookmark: (bookmarkId: string) => `bookmark:${bookmarkId}`,

  reviews: (courseId: string, query: string) => `reviews:${courseId}:${query}`,
  userReviews: (userId: string, query: string) =>
    `reviews:user:${userId}:${query}`,

  allLessons: (courseId: string, query: string) =>
    `lessons:all:${courseId}:${query}`,
  lessons: (courseId: string, query: string) => `lessons:${courseId}:${query}`,
  lesson: (id: string) => `lesson:${id}`,
  publicLesson: (id: string) => `lesson:public:${id}`,

  progresses: (lessonId: string, query: string) =>
    `progresses:${lessonId}:${query}`,
  progress: (progressId: string) => `progress:${progressId}`,

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
