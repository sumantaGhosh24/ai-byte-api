import { Request } from "express";
import { getAuth } from "@clerk/express";

import { prisma } from "../config/db";

export async function getLocalUser(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  return user;
}

export async function getCurrentUserId(req: Request) {
  const { userId } = getAuth(req);

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return user?.id;
}
