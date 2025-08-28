import { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';
import type { getVendorsSchema } from './vendors.dto';
import type { z } from 'zod';

type GetVendorsFilters = z.infer<typeof getVendorsSchema>;

export class VendorsAdminRepository extends BaseRepository {
  async findMany(filters: GetVendorsFilters) {
    const { q, category, city, status, verification, flagged, scoreMin, scoreMax, page, limit } = filters;

    const where: Prisma.VendorWhereInput = {
      AND: [
        q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        } : undefined,
        category ? { category } : undefined,
        city ? { city } : undefined,
        status ? { status } : undefined,
        verification ? { verification } : undefined,
        flagged !== undefined ? { flagged } : undefined,
        scoreMin !== undefined ? { score: { gte: scoreMin } } : undefined,
        scoreMax !== undefined ? { score: { lte: scoreMax } } : undefined,
      ].filter(Boolean) as Prisma.VendorWhereInput[],
    };

    const [vendors, total] = await this.db.$transaction([
      this.db.vendor.findMany({
        where,
        include: {
          owner: {
            select: { email: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.vendor.count({ where }),
    ]);

    return { vendors, total, page, limit };
  }

  async findById(id: string) {
    return this.db.vendor.findUnique({
      where: { id },
      include: {
        owner: { select: { email: true } },
        verificationDetails: true,
        sanctions: { orderBy: { createdAt: 'desc' } },
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  }

  async updateVerification(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    vendorId: string,
    status: 'VERIFIED' | 'REJECTED',
    reviewerId: string,
    notes?: string | null,
    expiresAt?: Date | null
  ) {
    // Update or create the verification record
    await tx.vendorVerification.upsert({
      where: { vendorId },
      create: {
        vendorId,
        status,
        reviewerId,
        notes,
        expiresAt,
        reviewedAt: new Date(),
      },
      update: {
        status,
        reviewerId,
        notes,
        expiresAt,
        reviewedAt: new Date(),
      },
    });

    // Update the vendor's main verification status
    return tx.vendor.update({
      where: { id: vendorId },
      data: {
        verification: status,
      },
    });
  }

  async logAudit(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>, data: Prisma.AuditLogUncheckedCreateInput) {
    return tx.auditLog.create({ data });
  }

  async addSanction(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    data: Prisma.VendorSanctionUncheckedCreateInput
  ) {
    return tx.vendorSanction.create({ data });
  }

  async updateVendorStatus(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    vendorId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'UNLISTED'
  ) {
    return tx.vendor.update({ where: { id: vendorId }, data: { status } });
  }

  // I will add more methods here for other vendor endpoints.
}
