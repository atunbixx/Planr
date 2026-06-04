import type { OrganizationRepository, OrganizationRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByClerkOrgId(input: {
    clerkOrgId: string;
    name: string;
  }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.upsert({
      where: { clerkOrgId: input.clerkOrgId },
      create: { clerkOrgId: input.clerkOrgId, name: input.name },
      update: { name: input.name },
    });
    return { id: row.id, clerkOrgId: row.clerkOrgId, name: row.name };
  }

  async findByClerkOrgId(clerkOrgId: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { clerkOrgId } });
    return row ? { id: row.id, clerkOrgId: row.clerkOrgId, name: row.name } : null;
  }
}
