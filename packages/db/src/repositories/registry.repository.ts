import type {
  RegistryRepository,
  RegistryItemRecord,
  RegistryItemWrite,
  RegistryContributionRecord,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

type Row = {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  url: string | null;
  note: string | null;
  priceCents: number;
  isCashFund: boolean;
  goalCents: number;
};

type ContributionRow = {
  id: string;
  organizationId: string;
  eventId: string;
  registryItemId: string;
  name: string;
  message: string | null;
  amountCents: number;
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

  async addContribution(input: {
    organizationId: string;
    eventId: string;
    registryItemId: string;
    name: string;
    message: string | null;
    amountCents: number;
  }): Promise<RegistryContributionRecord> {
    const row = await this.prisma.registryContribution.create({ data: input });
    return this.toContribution(row);
  }

  async listContributionsByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<RegistryContributionRecord[]> {
    const rows = await this.prisma.registryContribution.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toContribution(r));
  }

  async raisedByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<Record<string, number>> {
    const groups = await this.prisma.registryContribution.groupBy({
      by: ["registryItemId"],
      where: { organizationId: input.organizationId, eventId: input.eventId },
      _sum: { amountCents: true },
    });
    const out: Record<string, number> = {};
    for (const g of groups) out[g.registryItemId] = g._sum.amountCents ?? 0;
    return out;
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
      isCashFund: row.isCashFund,
      goalCents: row.goalCents,
    };
  }

  private toContribution(row: ContributionRow): RegistryContributionRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      registryItemId: row.registryItemId,
      name: row.name,
      message: row.message,
      amountCents: row.amountCents,
    };
  }
}
