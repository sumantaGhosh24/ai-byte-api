export const redisKeys = {
  profile: (userId: string) => `profile:${userId}`,
  publicProfile: (userId: string) => `public-profile:${userId}`,
  users: (query: string) => `users:${query}`,
};
