import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { env } from "./env";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
