import { eq } from "drizzle-orm";

import { getLocalUser } from "../../src/utils/users";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

const mockLimit = jest.fn();

const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));

const mockFrom = jest.fn(() => ({
  where: mockWhere,
}));

jest.mock("../../src/db", () => ({
  db: {
    select: jest.fn(() => ({
      from: mockFrom,
    })),
  },
}));

jest.mock("../../src/db/schema", () => ({
  users: {
    clerkId: "clerkId",
  },
}));

describe("getLocalUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user when found", async () => {
    const mockUser = {
      id: "1",
      clerkId: "clerk_user_123",
      email: "test@example.com",
    };

    mockLimit.mockResolvedValue([mockUser]);

    const result = await getLocalUser("clerk_user_123");

    expect(db.select).toHaveBeenCalled();

    expect(mockFrom).toHaveBeenCalledWith(users);

    expect(eq).toHaveBeenCalledWith(users.clerkId, "clerk_user_123");

    expect(mockWhere).toHaveBeenCalled();

    expect(mockLimit).toHaveBeenCalledWith(1);

    expect(result).toEqual(mockUser);
  });

  it("should return undefined when user does not exist", async () => {
    mockLimit.mockResolvedValue([]);

    const result = await getLocalUser("missing_user");

    expect(result).toBeUndefined();

    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it("should query using provided clerkId", async () => {
    mockLimit.mockResolvedValue([]);

    await getLocalUser("custom_clerk_id");

    expect(eq).toHaveBeenCalledWith(users.clerkId, "custom_clerk_id");
  });
});
