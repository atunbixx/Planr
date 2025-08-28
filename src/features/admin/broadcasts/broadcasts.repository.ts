import { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';

export class BroadcastsAdminRepository extends BaseRepository {

  // This method translates segment JSON into a Prisma where clause
  private buildSegmentWhere(segmentJson: any): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    const andConditions: Prisma.UserWhereInput[] = [];

    if (segmentJson.plan) {
      andConditions.push({ profile: { plan: segmentJson.plan } });
    }
    if (segmentJson.country) {
      andConditions.push({ profile: { country: segmentJson.country } });
    }
    if (segmentJson.role) {
      andConditions.push({ profile: { role: segmentJson.role } });
    }
    // Add more segment conditions as needed...

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    return where;
  }

  async countUsersInSegment(segmentJson: any): Promise<number> {
    const where = this.buildSegmentWhere(segmentJson);
    return this.db.user.count({ where });
  }

  async createBroadcast(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.BroadcastUncheckedCreateInput) {
    return tx.broadcast.create({ data });
  }

  async logAudit(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.AuditLogUncheckedCreateInput) {
    return tx.auditLog.create({ data });
  }
}
