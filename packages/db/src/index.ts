import { PrismaClient } from "./generated/client";

export { PrismaClient };

const globalForPrisma = globalThis as unknown as { __planrPrisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.__planrPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__planrPrisma = prisma;
}

export { createRepositories } from "./repositories/index";
export type { Repositories } from "@planr/core";
