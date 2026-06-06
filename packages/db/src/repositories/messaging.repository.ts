import type {
  AnnouncementRepository,
  AnnouncementRecord,
  AnnouncementWrite,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

type AnnouncementRow = {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: Date;
};

export class PrismaAnnouncementRepository implements AnnouncementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    input: { organizationId: string; eventId: string } & AnnouncementWrite,
  ): Promise<AnnouncementRecord> {
    const row = await this.prisma.announcement.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<AnnouncementRecord[]> {
    const rows = await this.prisma.announcement.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return rows.map((r) => this.toRecord(r));
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<AnnouncementRecord | null> {
    const row = await this.prisma.announcement.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<AnnouncementWrite>;
  }): Promise<AnnouncementRecord | null> {
    const result = await this.prisma.announcement.updateMany({
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

  async remove(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<boolean> {
    const result = await this.prisma.announcement.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  private toRecord(row: AnnouncementRow): AnnouncementRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt,
    };
  }
}
