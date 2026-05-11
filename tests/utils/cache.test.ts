import {
  getCache,
  setCache,
  deleteCache,
  deleteManyCache,
} from "../../src/utils/cache";
import { redis } from "../../src/config/redis";

jest.mock("../../src/config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe("Cache Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
