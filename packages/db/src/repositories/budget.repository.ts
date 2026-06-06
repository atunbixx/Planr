import type {
  BudgetItemRepository,
  BudgetItemRecord,
  BudgetSummary,
  BudgetItemWrite,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

type BudgetRow = {
  id: string;
  organizationId: string;
  eventId: string;
  label: string;
  category: string | null;
  estimatedCents: number;
  paidCents: number;
  notes: string | null;
};

export class PrismaBudgetItemRepository implements BudgetItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    input: { organizationId: string; eventId: string } & BudgetItemWrite,
  ): Promise<BudgetItemRecord> {
    const row = await this.prisma.budgetItem.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: BudgetItemRecord[]; nextCursor: string | null }> {
    // Stable keyset pagination on id. Fetch limit+1 to detect a further page.
    const rows = await this.prisma.budgetItem.findMany({
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
      items: page.map((row) => this.toRecord(row)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<BudgetItemRecord | null> {
    const row = await this.prisma.budgetItem.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<BudgetItemWrite>;
  }): Promise<BudgetItemRecord | null> {
    const result = await this.prisma.budgetItem.updateMany({
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
    const result = await this.prisma.budgetItem.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  async summaryByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<BudgetSummary> {
    const agg = await this.prisma.budgetItem.aggregate({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      _count: { _all: true },
      _sum: { estimatedCents: true, paidCents: true },
    });
    const totalEstimatedCents = agg._sum.estimatedCents ?? 0;
    const totalPaidCents = agg._sum.paidCents ?? 0;
    return {
      itemCount: agg._count._all,
      totalEstimatedCents,
      totalPaidCents,
      remainingCents: totalEstimatedCents - totalPaidCents,
    };
  }

  private toRecord(row: BudgetRow): BudgetItemRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      label: row.label,
      category: row.category,
      estimatedCents: row.estimatedCents,
      paidCents: row.paidCents,
      notes: row.notes,
    };
  }
}
