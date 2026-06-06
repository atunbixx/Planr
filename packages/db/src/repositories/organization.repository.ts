import type { OrganizationRepository, OrganizationRecord, OrgType } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string; type?: OrgType }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.create({
      data: { name: input.name, type: input.type ?? "individual" },
    });
    return this.toRecord(row);
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async listForUser(userId: string): Promise<OrganizationRecord[]> {
    const rows = await this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => this.toRecord(row));
  }

  async rename(input: { id: string; name: string }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.update({
      where: { id: input.id },
      data: { name: input.name },
    });
    return this.toRecord(row);
  }

  async setCurrency(input: { id: string; currency: string }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.update({
      where: { id: input.id },
      data: { currency: input.currency },
    });
    return this.toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } });
  }

  private toRecord(row: { id: string; name: string; type: string; currency: string }): OrganizationRecord {
    return { id: row.id, name: row.name, type: row.type as OrgType, currency: row.currency };
  }
}
