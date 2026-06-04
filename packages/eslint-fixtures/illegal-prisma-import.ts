// This file exists ONLY to prove the boundary rule fires. It must always lint-error.
import { PrismaClient } from "@prisma/client";

export const leak = new PrismaClient();
