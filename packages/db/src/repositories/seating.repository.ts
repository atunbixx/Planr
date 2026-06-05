import type {
  SeatingRepository,
  SeatingTableRecord,
  SeatAssignmentRecord,
  SeatingTableWrite,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

type TableRow = {
  id: string;
  organizationId: string;
  eventId: string;
  label: string;
  capacity: number;
};

export class PrismaSeatingRepository implements SeatingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createTable(
    input: { organizationId: string; eventId: string } & SeatingTableWrite,
  ): Promise<SeatingTableRecord> {
    const row = await this.prisma.seatingTable.create({ data: input });
    return this.toTable(row);
  }

  async listTables(input: {
    organizationId: string;
    eventId: string;
  }): Promise<SeatingTableRecord[]> {
    const rows = await this.prisma.seatingTable.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: { id: "asc" },
    });
    return rows.map((r) => this.toTable(r));
  }

  async getTable(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<SeatingTableRecord | null> {
    const row = await this.prisma.seatingTable.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toTable(row) : null;
  }

  async updateTable(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<SeatingTableWrite>;
  }): Promise<SeatingTableRecord | null> {
    const result = await this.prisma.seatingTable.updateMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
      data: input.patch,
    });
    if (result.count === 0) return null;
    return this.getTable({
      organizationId: input.organizationId,
      eventId: input.eventId,
      id: input.id,
    });
  }

  async removeTable(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<boolean> {
    // FK cascade on SeatAssignment.tableId frees the seated guests.
    const result = await this.prisma.seatingTable.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  async listAssignments(input: {
    organizationId: string;
    eventId: string;
  }): Promise<SeatAssignmentRecord[]> {
    const rows = await this.prisma.seatAssignment.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      select: { id: true, tableId: true, guestId: true },
    });
    return rows;
  }

  async countByTable(input: {
    organizationId: string;
    eventId: string;
    tableId: string;
  }): Promise<number> {
    return this.prisma.seatAssignment.count({
      where: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        tableId: input.tableId,
      },
    });
  }

  async assign(input: {
    organizationId: string;
    eventId: string;
    tableId: string;
    guestId: string;
  }): Promise<SeatAssignmentRecord> {
    // Upsert by the unique guestId — moves the guest if already seated.
    const row = await this.prisma.seatAssignment.upsert({
      where: { guestId: input.guestId },
      create: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        tableId: input.tableId,
        guestId: input.guestId,
      },
      update: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        tableId: input.tableId,
      },
      select: { id: true, tableId: true, guestId: true },
    });
    return row;
  }

  async unassign(input: {
    organizationId: string;
    eventId: string;
    guestId: string;
  }): Promise<boolean> {
    const result = await this.prisma.seatAssignment.deleteMany({
      where: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        guestId: input.guestId,
      },
    });
    return result.count > 0;
  }

  private toTable(row: TableRow): SeatingTableRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      label: row.label,
      capacity: row.capacity,
    };
  }
}
