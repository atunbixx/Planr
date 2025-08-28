import { Prisma, PrismaClient, ApprovalType } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';

interface FindApprovalsFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  targetType?: ApprovalType;
  page: number;
  limit: number;
}

export class ApprovalsAdminRepository extends BaseRepository {
  async findMany(filters: FindApprovalsFilters) {
    const { status, targetType, page, limit } = filters;

    const where: Prisma.ApprovalQueueWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (targetType) {
      where.targetType = targetType;
    }

    const [items, total] = await this.db.$transaction([
      this.db.approvalQueue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.approvalQueue.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    return this.db.approvalQueue.findUnique({ where: { id } });
  }

  async updateStatus(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedById: string,
    notes?: string | null
  ) {
    return tx.approvalQueue.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedById,
        notes: notes,
        reviewedAt: new Date(),
      },
    });
  }

  async logAudit(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.AuditLogUncheckedCreateInput) {
    return tx.auditLog.create({ data });
  }
}
