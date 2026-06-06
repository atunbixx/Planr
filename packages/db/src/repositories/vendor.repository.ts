import type { VendorRepository, VendorRecord, VendorSummary, VendorWrite } from "@planr/core";
import type { PrismaClient } from "../generated/client";

type Row = {
  id: string;
  organizationId: string;
  eventId: string;
  category: string | null;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  status: string;
  costCents: number;
  depositPaidCents: number;
  notes: string | null;
};

export class PrismaVendorRepository implements VendorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { organizationId: string; eventId: string } & VendorWrite): Promise<VendorRecord> {
    const row = await this.prisma.vendor.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: { organizationId: string; eventId: string }): Promise<VendorRecord[]> {
    const rows = await this.prisma.vendor.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return rows.map((r) => this.toRecord(r));
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<VendorRecord | null> {
    const row = await this.prisma.vendor.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<VendorWrite>;
  }): Promise<VendorRecord | null> {
    const result = await this.prisma.vendor.updateMany({
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
    const result = await this.prisma.vendor.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  async summaryByEvent(input: { organizationId: string; eventId: string }): Promise<VendorSummary> {
    const where = { organizationId: input.organizationId, eventId: input.eventId };
    const [grouped, active] = await Promise.all([
      this.prisma.vendor.groupBy({ by: ["status"], where, _count: { _all: true } }),
      this.prisma.vendor.aggregate({
        where: { ...where, status: { not: "declined" } },
        _sum: { costCents: true, depositPaidCents: true },
      }),
    ]);
    const byStatus = {
      researching: 0,
      contacted: 0,
      quoted: 0,
      booked: 0,
      declined: 0,
    } as VendorSummary["byStatus"];
    let total = 0;
    for (const g of grouped) {
      byStatus[g.status as keyof typeof byStatus] = g._count._all;
      total += g._count._all;
    }
    const estimatedCents = active._sum.costCents ?? 0;
    const paidCents = active._sum.depositPaidCents ?? 0;
    return { total, byStatus, estimatedCents, paidCents, outstandingCents: estimatedCents - paidCents };
  }

  private toRecord(row: Row): VendorRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      category: row.category,
      name: row.name,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      website: row.website,
      status: row.status as VendorRecord["status"],
      costCents: row.costCents,
      depositPaidCents: row.depositPaidCents,
      notes: row.notes,
    };
  }
}
