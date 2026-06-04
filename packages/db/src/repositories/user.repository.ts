import type { UserRepository, UserRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByClerkUserId(input: {
    clerkUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord> {
    const row = await this.prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: { clerkUserId: input.clerkUserId, email: input.email, name: input.name },
      update: { email: input.email, name: input.name },
    });
    return { id: row.id, clerkUserId: row.clerkUserId, email: row.email, name: row.name };
  }

  async findByClerkUserId(clerkUserId: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { clerkUserId } });
    return row
      ? { id: row.id, clerkUserId: row.clerkUserId, email: row.email, name: row.name }
      : null;
  }
}
