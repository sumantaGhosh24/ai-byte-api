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

jest.mock("../../src/db", () => {
  const mockFindMany = jest.fn();
  const mockSelect = jest.fn();

  return {
    db: {
      query: {
        users: {
          findMany: mockFindMany,
        },
      },
      select: mockSelect,
    },
  };
});

jest.mock("../../src/db/schema", () => ({
  users: {
    email: "email",
    createdAt: "createdAt",
  },
}));

describe("getUsersService", () => {
  let mockFindMany: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany = db.query.users.findMany as jest.Mock;
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

    mockFindMany.mockResolvedValue(mockUsers);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 10,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock).mockReturnValue({
      from: mockCountFrom,
    });

    const result = await getUsersService({
      page: 1,
      limit: 2,
    });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: undefined,
      limit: 2,
      offset: 0,
      orderBy: expect.anything(),
    });

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

    mockFindMany.mockResolvedValue(mockUsers);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 1,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock).mockReturnValue({
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

    expect(mockFindMany).toHaveBeenCalledWith({
      where: "combined-filter",
      limit: 10,
      offset: 0,
      orderBy: expect.anything(),
    });

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

    mockFindMany.mockResolvedValue(mockUsers);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 1,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock).mockReturnValue({
      from: mockCountFrom,
    });

    const result = await getUsersService({
      page: 1,
      limit: 10,
    });

    expect(result.paginations.hasMore).toBe(false);
  });

  it("should calculate offset correctly", async () => {
    mockFindMany.mockResolvedValue([]);

    const mockCountWhere = jest.fn().mockResolvedValue([
      {
        count: 0,
      },
    ]);

    const mockCountFrom = jest.fn(() => ({
      where: mockCountWhere,
    }));

    (db.select as jest.Mock).mockReturnValue({
      from: mockCountFrom,
    });

    await getUsersService({
      page: 3,
      limit: 5,
    });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: undefined,
      limit: 5,
      offset: 10,
      orderBy: expect.anything(),
    });
  });

  it("should throw and log error when db fails", async () => {
    const mockError = new Error("Database error");

    mockFindMany.mockRejectedValue(mockError);

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
