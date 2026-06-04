import type { UserRepository, UserRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByAuthUserId(input: {
    authUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord> {
    const row = await this.prisma.user.upsert({
      where: { authUserId: input.authUserId },
      create: { authUserId: input.authUserId, email: input.email, name: input.name },
      update: { email: input.email, name: input.name },
    });
    return { id: row.id, authUserId: row.authUserId, email: row.email, name: row.name };
  }

  async findByAuthUserId(authUserId: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { authUserId } });
    return row
      ? { id: row.id, authUserId: row.authUserId, email: row.email, name: row.name }
      : null;
  }
}
