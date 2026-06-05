import type {
  GuestRepository,
  GuestRecord,
  GuestSummary,
  GuestWrite,
  RsvpStatus,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

type GuestRow = {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  plusOne: boolean;
  rsvpStatus: string;
  rsvpToken: string;
  notes: string | null;
};

export class PrismaGuestRepository implements GuestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { organizationId: string; eventId: string } & GuestWrite): Promise<GuestRecord> {
    const row = await this.prisma.guest.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ guests: GuestRecord[]; nextCursor: string | null }> {
    // Stable keyset pagination on id. Fetch limit+1 to detect a further page.
    const rows = await this.prisma.guest.findMany({
      where: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        ...(input.cursor ? { id: { gt: input.cursor } } : {}),
      },
      orderBy: { id: "asc" },
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      guests: page.map((row) => this.toRecord(row)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<GuestRecord | null> {
    const row = await this.prisma.guest.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<GuestWrite>;
  }): Promise<GuestRecord | null> {
    // Tenant-scoped guard: updateMany returns count so cross-tenant ids cannot be edited.
    const result = await this.prisma.guest.updateMany({
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
    const result = await this.prisma.guest.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  async summaryByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<GuestSummary> {
    const grouped = await this.prisma.guest.groupBy({
      by: ["rsvpStatus"],
      where: { organizationId: input.organizationId, eventId: input.eventId },
      _count: { _all: true },
    });
    const summary: GuestSummary = { total: 0, coming: 0, declined: 0, maybe: 0, awaiting: 0 };
    for (const g of grouped) {
      const n = g._count._all;
      summary.total += n;
      summary[g.rsvpStatus as RsvpStatus] += n;
    }
    return summary;
  }

  private toRecord(row: GuestRow): GuestRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      groupLabel: row.groupLabel,
      plusOne: row.plusOne,
      rsvpStatus: row.rsvpStatus as RsvpStatus,
      rsvpToken: row.rsvpToken,
      notes: row.notes,
    };
  }

  async findByRsvpToken(token: string): Promise<GuestRecord | null> {
    const row = await this.prisma.guest.findUnique({ where: { rsvpToken: token } });
    return row ? this.toRecord(row) : null;
  }

  async setRsvpByToken(input: {
    token: string;
    rsvpStatus: RsvpStatus;
    plusOne?: boolean;
  }): Promise<GuestRecord | null> {
    const result = await this.prisma.guest.updateMany({
      where: { rsvpToken: input.token },
      data: {
        rsvpStatus: input.rsvpStatus,
        ...(input.plusOne !== undefined ? { plusOne: input.plusOne } : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findByRsvpToken(input.token);
  }
}
