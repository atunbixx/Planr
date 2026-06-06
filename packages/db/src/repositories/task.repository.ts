import type { TaskRepository, TaskRecord, TaskSummary, TaskWrite } from "@planr/core";
import { Prisma, type PrismaClient } from "../generated/client";

type TaskRow = {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  notes: string | null;
  done: boolean;
  dueDate: Date | null;
};

// Opaque cursor over the composite sort key (dueDate, createdAt, id).
interface Cursor {
  d: string | null; // dueDate ISO or null
  c: string; // createdAt ISO
  i: string; // id
}
function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}
function decodeCursor(s: string): Cursor | null {
  try {
    const c = JSON.parse(Buffer.from(s, "base64url").toString("utf8")) as Cursor;
    if (typeof c.c !== "string" || typeof c.i !== "string") return null;
    return c;
  } catch {
    return null;
  }
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { organizationId: string; eventId: string } & TaskWrite): Promise<TaskRecord> {
    const row = await this.prisma.task.create({ data: input });
    return this.toRecord(row);
  }

  async listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ tasks: TaskRecord[]; nextCursor: string | null }> {
    // Order: (dueDate ASC NULLS LAST, createdAt ASC, id ASC). Keyset "after the cursor" honours the
    // nulls-last semantics: a non-null cursor is followed by later dueDates, its own dueDate tie-broken
    // by (createdAt,id), and the whole NULL-dueDate tail; a null cursor walks only that tail.
    const conds: Prisma.Sql[] = [
      Prisma.sql`"organizationId" = ${input.organizationId}`,
      Prisma.sql`"eventId" = ${input.eventId}`,
    ];
    const c = input.cursor ? decodeCursor(input.cursor) : null;
    if (c) {
      const cAt = new Date(c.c);
      if (c.d !== null) {
        const d = new Date(c.d);
        conds.push(Prisma.sql`(
          "dueDate" > ${d}
          OR ("dueDate" = ${d} AND ("createdAt" > ${cAt} OR ("createdAt" = ${cAt} AND "id" > ${c.i})))
          OR "dueDate" IS NULL
        )`);
      } else {
        conds.push(Prisma.sql`(
          "dueDate" IS NULL AND ("createdAt" > ${cAt} OR ("createdAt" = ${cAt} AND "id" > ${c.i}))
        )`);
      }
    }
    const where = Prisma.join(conds, " AND ");
    const rows = await this.prisma.$queryRaw<(TaskRow & { createdAt: Date })[]>(Prisma.sql`
      SELECT "id", "organizationId", "eventId", "title", "notes", "done", "dueDate", "createdAt"
      FROM "Task"
      WHERE ${where}
      ORDER BY "dueDate" ASC NULLS LAST, "createdAt" ASC, "id" ASC
      LIMIT ${input.limit + 1}
    `);

    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({
            d: last.dueDate ? last.dueDate.toISOString() : null,
            c: last.createdAt.toISOString(),
            i: last.id,
          })
        : null;
    return { tasks: page.map((r) => this.toRecord(r)), nextCursor };
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<TaskRecord | null> {
    const row = await this.prisma.task.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? this.toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<TaskWrite>;
  }): Promise<TaskRecord | null> {
    const result = await this.prisma.task.updateMany({
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
    const result = await this.prisma.task.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  async summaryByEvent(input: {
    organizationId: string;
    eventId: string;
    now: Date;
  }): Promise<TaskSummary> {
    const [row] = await this.prisma.$queryRaw<
      { total: number; done: number; remaining: number; overdue: number }[]
    >(Prisma.sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "done")::int AS done,
        COUNT(*) FILTER (WHERE NOT "done")::int AS remaining,
        COUNT(*) FILTER (WHERE NOT "done" AND "dueDate" IS NOT NULL AND "dueDate" < ${input.now})::int AS overdue
      FROM "Task"
      WHERE "organizationId" = ${input.organizationId} AND "eventId" = ${input.eventId}
    `);
    return row ?? { total: 0, done: 0, remaining: 0, overdue: 0 };
  }

  private toRecord(row: TaskRow): TaskRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      title: row.title,
      notes: row.notes,
      done: row.done,
      dueDate: row.dueDate,
    };
  }
}
