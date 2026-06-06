import type { PhotoRepository, PhotoRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

type Row = {
  id: string;
  organizationId: string;
  eventId: string;
  storagePath: string;
  caption: string | null;
  createdAt: Date;
};

export class PrismaPhotoRepository implements PhotoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    organizationId: string;
    eventId: string;
    storagePath: string;
    caption: string | null;
  }): Promise<PhotoRecord> {
    const row = await this.prisma.photo.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: { organizationId: string; eventId: string }): Promise<PhotoRecord[]> {
    const rows = await this.prisma.photo.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return rows.map((r) => this.toRecord(r));
  }

  async remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean> {
    const result = await this.prisma.photo.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  private toRecord(row: Row): PhotoRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      storagePath: row.storagePath,
      caption: row.caption,
      createdAt: row.createdAt,
    };
  }
}
