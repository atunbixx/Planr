import { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';
import { upsertFlagSchema } from './flags.dto';
import { z } from 'zod';

type UpsertFlagInput = z.infer<typeof upsertFlagSchema>;

export class FlagsAdminRepository extends BaseRepository {
  async findMany() {
    return this.db.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, flag: UpsertFlagInput) {
    const { key, ...data } = flag;
    return tx.featureFlag.upsert({
      where: { key },
      create: { key, ...data },
      update: data,
    });
  }

  async delete(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, key: string) {
    return tx.featureFlag.delete({
      where: { key },
    });
  }

  async logAudit(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.AuditLogUncheckedCreateInput) {
    return tx.auditLog.create({ data });
  }
}
