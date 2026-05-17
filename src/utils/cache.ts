import { redis } from "../config/redis";

export const getKeys = async (key: string) => {
  const keys = await redis.keys(key);

  if (!keys.length) return;

  return keys;
};

export const getCache = async <T>(key: string) => {
  const data = await redis.get<T>(key);

  if (!data) return null;

  return data;
};

export const setCache = async (key: string, value: unknown, ttl = 600) => {
  await redis.set(key, value, {
    ex: ttl,
  });
};

export const deleteCache = async (key: string) => {
  await redis.del(key);
};

export async function deleteManyCache(keys: string[]) {
  if (!keys.length) return;

  await redis.del(...keys);
}
