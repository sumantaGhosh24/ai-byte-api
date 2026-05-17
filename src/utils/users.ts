import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";

export async function getLocalUser(clerkId: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return row;
}
