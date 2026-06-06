import type { RegistryRepository, RegistryItemRecord, RegistryItemWrite } from "@planr/core";
import type { PrismaClient } from "../generated/client";

type Row = {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  url: string | null;
  note: string | null;
  priceCents: number;
};

export class PrismaRegistryRepository implements RegistryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    input: { organizationId: string; eventId: string } & RegistryItemWrite,
  ): Promise<RegistryItemRecord> {
    const row = await this.prisma.registryItem.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: { organizationId: string; eventId: string }): Promise<RegistryItemRecord[]> {
    const rows = await this.prisma.registryItem.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toRecord(r));
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<RegistryItemRecord | null> {
    const row = await this.prisma.registryItem.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<RegistryItemWrite>;
  }): Promise<RegistryItemRecord | null> {
    const result = await this.prisma.registryItem.updateMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
      data: input.patch,
    });
    if (result.count === 0) return null;
    return this.getById({
      organizationId: input.organizationId,
      eventId: input.eventId,
      id: input.id,
    });
  }

  async remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean> {
    const result = await this.prisma.registryItem.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  private toRecord(row: Row): RegistryItemRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      title: row.title,
      url: row.url,
      note: row.note,
      priceCents: row.priceCents,
    };
  }
}
