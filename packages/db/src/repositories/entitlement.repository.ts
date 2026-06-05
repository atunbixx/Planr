import type { EntitlementRepository, EntitlementRecord, Entitlement } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaEntitlementRepository implements EntitlementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async grant(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord> {
    const row = await this.prisma.entitlement.create({ data: input });
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      key: row.key as Entitlement,
      source: row.source,
    };
  }

  async grantIfAbsent(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord> {
    const existing = await this.prisma.entitlement.findFirst({
      where: { organizationId: input.organizationId, eventId: input.eventId, key: input.key },
    });
    if (existing) {
      return {
        id: existing.id,
        organizationId: existing.organizationId,
        eventId: existing.eventId,
        key: existing.key as Entitlement,
        source: existing.source,
      };
    }
    const row = await this.prisma.entitlement.create({ data: input });
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      key: row.key as Entitlement,
      source: row.source,
    };
  }

  async heldFor(input: {
    organizationId: string;
    eventId: string | null;
  }): Promise<Entitlement[]> {
    const rows = await this.prisma.entitlement.findMany({
      where: {
        organizationId: input.organizationId,
        OR: [{ eventId: null }, { eventId: input.eventId }],
      },
    });
    return rows.map((row) => row.key as Entitlement);
  }
}
