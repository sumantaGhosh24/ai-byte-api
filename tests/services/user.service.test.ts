import { and, ilike } from "drizzle-orm";
import { logger } from "@sentry/node";

import { getUsersService } from "../../src/services/user.service";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";

jest.mock("drizzle-orm", () => ({
  and: jest.fn(),
  ilike: jest.fn(),
  sql: jest.fn((strings: TemplateStringsArray) => strings.join("")),
}));

jest.mock("@sentry/node", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockOrderBy = jest.fn();
const mockOffset = jest.fn(() => ({
  orderBy: mockOrderBy,
}));

const mockLimit = jest.fn(() => ({
  offset: mockOffset,
}));

const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));

const mockFrom = jest.fn(() => ({
  where: mockWhere,
}));

jest.mock("../../src/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("../../src/db/schema", () => ({
  users: {
    email: "email",
    createdAt: "createdAt",
  },
}));

describe("getUsersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated users without search", async () => {
    const mockUsers = [
      {
        id: "1",
        email: "test1@example.com",
      },
      {
        id: "2",
        email: "test2@example.com",
      },
    ];

    mockOrderBy.mockResolvedValue(mockUsers);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 10,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: mockFrom,
      })
      .mockReturnValueOnce({
        from: mockCountFrom,
      });

    const result = await getUsersService({
      page: 1,
      limit: 2,
    });

    expect(db.select).toHaveBeenCalledTimes(2);

    expect(mockFrom).toHaveBeenCalledWith(users);

    expect(mockWhere).toHaveBeenCalledWith(undefined);

    expect(mockLimit).toHaveBeenCalledWith(2);

    expect(mockOffset).toHaveBeenCalledWith(0);

    expect(result).toEqual({
      items: mockUsers,
      paginations: {
        page: 1,
        limit: 2,
        total: 10,
        hasMore: true,
      },
    });
  });

  it("should return paginated users with search", async () => {
    const mockUsers = [
      {
        id: "1",
        email: "john@example.com",
      },
    ];

    mockOrderBy.mockResolvedValue(mockUsers);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 1,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: mockFrom,
      })
      .mockReturnValueOnce({
        from: mockCountFrom,
      });

    (ilike as jest.Mock).mockReturnValue("search-filter");

    (and as jest.Mock).mockReturnValue("combined-filter");

    const result = await getUsersService({
      page: 1,
      limit: 10,
      search: "john",
    });

    expect(ilike).toHaveBeenCalledWith(users.email, "%john%");

    expect(and).toHaveBeenCalledWith("search-filter");

    expect(mockWhere).toHaveBeenCalledWith("combined-filter");

    expect(result).toEqual({
      items: mockUsers,
      paginations: {
        page: 1,
        limit: 10,
        total: 1,
        hasMore: false,
      },
    });
  });

  it("should calculate hasMore correctly", async () => {
    const mockUsers = [
      {
        id: "1",
      },
    ];

    mockOrderBy.mockResolvedValue(mockUsers);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 1,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: mockFrom,
      })
      .mockReturnValueOnce({
        from: mockCountFrom,
      });

    const result = await getUsersService({
      page: 1,
      limit: 10,
    });

    expect(result.paginations.hasMore).toBe(false);
  });

  it("should calculate offset correctly", async () => {
    mockOrderBy.mockResolvedValue([]);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 0,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: mockFrom,
      })
      .mockReturnValueOnce({
        from: mockCountFrom,
      });

    await getUsersService({
      page: 3,
      limit: 5,
    });

    expect(mockOffset).toHaveBeenCalledWith(10);
  });

  it("should throw and log error when db fails", async () => {
    const mockError = new Error("Database error");

    mockWhere.mockImplementationOnce(() => {
      throw mockError;
    });

    (db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    });

    await expect(
      getUsersService({
        page: 1,
        limit: 10,
      })
    ).rejects.toThrow("Database error");

    expect(logger.error).toHaveBeenCalledWith("Error to get users", {
      error: mockError,
    });
  });
});
