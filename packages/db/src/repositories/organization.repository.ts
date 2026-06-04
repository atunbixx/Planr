import type { OrganizationRepository, OrganizationRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.create({ data: { name: input.name } });
    return { id: row.id, name: row.name };
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? { id: row.id, name: row.name } : null;
  }

  async listForUser(userId: string): Promise<OrganizationRecord[]> {
    const rows = await this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }
}
