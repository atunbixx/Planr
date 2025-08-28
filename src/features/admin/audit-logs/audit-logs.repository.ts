import { Prisma } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';
import type { getAuditLogsSchema } from './audit-logs.dto';
import type { z } from 'zod';

type GetAuditLogsFilters = z.infer<typeof getAuditLogsSchema>;

export class AuditLogsAdminRepository extends BaseRepository {
  async findMany(filters: GetAuditLogsFilters) {
    const { actorId, action, targetId, startDate, endDate, page, limit } = filters;

    const where: Prisma.AuditLogWhereInput = {
      AND: [
        actorId ? { actorId } : undefined,
        action ? { action: { contains: action, mode: 'insensitive' } } : undefined,
        targetId ? { targetId } : undefined,
        startDate ? { createdAt: { gte: new Date(startDate) } } : undefined,
        endDate ? { createdAt: { lte: new Date(endDate) } } : undefined,
      ].filter(Boolean) as Prisma.AuditLogWhereInput[],
    };

    const [logs, total] = await this.db.$transaction([
      this.db.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}
