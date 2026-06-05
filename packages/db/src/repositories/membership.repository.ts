import type { MembershipRepository, MembershipRecord, MemberView, Role } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: {
    organizationId: string;
    userId: string;
    role: Role;
  }): Promise<MembershipRecord> {
    const row = await this.prisma.membership.upsert({
      where: {
        organizationId_userId: { organizationId: input.organizationId, userId: input.userId },
      },
      create: { organizationId: input.organizationId, userId: input.userId, role: input.role },
      update: { role: input.role },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as Role,
    };
  }

  async remove(input: { organizationId: string; userId: string }): Promise<void> {
    await this.prisma.membership.deleteMany({
      where: { organizationId: input.organizationId, userId: input.userId },
    });
  }

  async listByOrganization(organizationId: string): Promise<MembershipRecord[]> {
    const rows = await this.prisma.membership.findMany({ where: { organizationId } });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as Role,
    }));
  }

  async find(input: {
    organizationId: string;
    userId: string;
  }): Promise<MembershipRecord | null> {
    const row = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: { organizationId: input.organizationId, userId: input.userId },
      },
    });
    return row
      ? {
          id: row.id,
          organizationId: row.organizationId,
          userId: row.userId,
          role: row.role as Role,
        }
      : null;
  }

  async listMembersWithUsers(organizationId: string): Promise<MemberView[]> {
    const rows = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      userId: row.userId,
      email: row.user.email,
      name: row.user.name,
      role: row.role as Role,
    }));
  }
}
