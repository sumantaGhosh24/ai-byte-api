import {
  getKeys,
  getCache,
  setCache,
  deleteCache,
  deleteManyCache,
} from "../../src/utils/cache";
import { redis } from "../../src/config/redis";

jest.mock("../../src/config/redis", () => ({
  redis: {
    keys: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe("Cache Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getKeys", () => {
    it("should return matching keys", async () => {
      const mockKeys = ["user:1", "user:2"];

      (redis.keys as jest.Mock).mockResolvedValue(mockKeys);

      const result = await getKeys("user:*");

      expect(redis.keys).toHaveBeenCalledWith("user:*");

      expect(result).toEqual(mockKeys);
    });

    it("should return undefined when no keys found", async () => {
      (redis.keys as jest.Mock).mockResolvedValue([]);

      const result = await getKeys("missing:*");

      expect(redis.keys).toHaveBeenCalledWith("missing:*");

      expect(result).toBeUndefined();
    });
  });

  describe("getCache", () => {
    it("should return cached data when key exists", async () => {
      const mockData = {
        id: 1,
        name: "AIByte",
      };

      (redis.get as jest.Mock).mockResolvedValue(mockData);

      const result = await getCache("user:1");

      expect(redis.get).toHaveBeenCalledWith("user:1");

      expect(result).toEqual(mockData);
    });

    it("should return null when cache does not exist", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await getCache("missing:key");

      expect(redis.get).toHaveBeenCalledWith("missing:key");

      expect(result).toBeNull();
    });
  });

  describe("setCache", () => {
    it("should set cache with default ttl", async () => {
      const value = {
        id: 1,
        name: "OpenAI",
      };

      await setCache("test:key", value);

      expect(redis.set).toHaveBeenCalledWith("test:key", value, {
        ex: 600,
      });
    });

    it("should set cache with custom ttl", async () => {
      const value = {
        success: true,
      };

      await setCache("custom:key", value, 120);

      expect(redis.set).toHaveBeenCalledWith("custom:key", value, {
        ex: 120,
      });
    });
  });

  describe("deleteCache", () => {
    it("should delete cache key", async () => {
      await deleteCache("delete:key");

      expect(redis.del).toHaveBeenCalledWith("delete:key");
    });
  });

  describe("deleteManyCache", () => {
    it("should delete multiple cache keys", async () => {
      const keys = ["user:1", "user:2", "user:3"];

      await deleteManyCache(keys);

      expect(redis.del).toHaveBeenCalledWith("user:1", "user:2", "user:3");
    });

    it("should not call redis.del when keys array is empty", async () => {
      await deleteManyCache([]);

      expect(redis.del).not.toHaveBeenCalled();
    });
  });
});
