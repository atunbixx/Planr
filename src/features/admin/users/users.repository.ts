import { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';
import type { getUsersSchema } from './users.dto';
import type { z } from 'zod';

type GetUsersFilters = z.infer<typeof getUsersSchema>;

export class UsersAdminRepository extends BaseRepository {
  async findUsers(filters: GetUsersFilters) {
    const { q, role, plan, country, state, city, page, limit } = filters;

    const whereClause: Prisma.UserWhereInput = {};
    const andConditions: Prisma.UserWhereInput[] = [];

    if (q) {
      andConditions.push({
        email: { contains: q, mode: 'insensitive' },
      });
    }
    if (role) {
      andConditions.push({ profile: { role } });
    }
    if (plan) {
      andConditions.push({ profile: { plan } });
    }
    if (country) {
      andConditions.push({ profile: { country } });
    }
    if (state) {
      andConditions.push({ profile: { state } });
    }
    if (city) {
      andConditions.push({ profile: { city } });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const [users, total] = await this.db.$transaction([
      this.db.user.findMany({
        where: whereClause,
        include: {
          profile: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.user.count({ where: whereClause }),
    ]);

    return { users, total, page, limit };
  }

  // The create methods will be part of the service layer transaction,
  // so they receive the transactional client `tx` as an argument.

  async addCredits(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.CreditLedgerUncheckedCreateInput) {
    return tx.creditLedger.create({ data });
  }

  async addSanction(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.SanctionUncheckedCreateInput) {
    return tx.sanction.create({ data });
  }

  async logAudit(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.AuditLogUncheckedCreateInput) {
    return tx.auditLog.create({ data });
  }
}
