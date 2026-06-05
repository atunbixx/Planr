import type { EventRepository, EventRecord, EventTypeKey } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    organizationId: string;
    eventTypeKey: EventTypeKey;
    name: string;
    date: Date | null;
  }): Promise<EventRecord> {
    const row = await this.prisma.event.create({ data: input });
    return this.toRecord(row);
  }

  async listByOrganization(organizationId: string): Promise<EventRecord[]> {
    const rows = await this.prisma.event.findMany({ where: { organizationId } });
    return rows.map((row) => this.toRecord(row));
  }

  async findById(input: { organizationId: string; id: string }): Promise<EventRecord | null> {
    const row = await this.prisma.event.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    return row ? this.toRecord(row) : null;
  }

  async getById(id: string): Promise<EventRecord | null> {
    const row = await this.prisma.event.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  private toRecord(row: {
    id: string;
    organizationId: string;
    eventTypeKey: string;
    name: string;
    date: Date | null;
  }): EventRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventTypeKey: row.eventTypeKey as EventTypeKey,
      name: row.name,
      date: row.date,
    };
  }
}
