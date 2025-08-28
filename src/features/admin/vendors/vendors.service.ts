import { VendorsAdminRepository } from './vendors.repository';
import type { getVendorsSchema } from './vendors.dto';
import type { z } from 'zod';

type GetVendorsFilters = z.infer<typeof getVendorsSchema>;

export class VendorsAdminService {
  private repository: VendorsAdminRepository;

  constructor() {
    this.repository = new VendorsAdminRepository();
  }

  async getVendors(filters: GetVendorsFilters) {
    return this.repository.findMany(filters);
  }

  async getVendorById(id: string) {
    return this.repository.findById(id);
  }

  async verifyVendor(
    vendorId: string,
    input: { approve: boolean; expiresAt?: string | null; notes?: string | null },
    actorId: string
  ) {
    const { approve, expiresAt, notes } = input;
    const newStatus = approve ? 'VERIFIED' : 'REJECTED';

    return this.repository.withTransaction(async (tx) => {
      const updatedVendor = await this.repository.updateVerification(
        tx,
        vendorId,
        newStatus,
        actorId,
        notes,
        expiresAt ? new Date(expiresAt) : null
      );

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: `admin.vendor.verify.${newStatus.toLowerCase()}`,
        targetId: vendorId,
        meta: {
          notes,
          expiresAt,
        },
      });

      return updatedVendor;
    });
  }

  async sanctionVendor(
    vendorId: string,
    input: { type: 'WARN' | 'THROTTLE' | 'SUSPEND' | 'BAN' | 'SHADOW_LIMIT'; reasonCode: string; expiresAt?: string | null; notes?: string | null },
    actorId: string
  ) {
    const { type, reasonCode, expiresAt, notes } = input;

    // Map sanction type to vendor status where applicable
    const statusMap = {
      SUSPEND: 'SUSPENDED',
      BAN: 'BANNED',
    };
    const newStatus = statusMap[type as keyof typeof statusMap];

    return this.repository.withTransaction(async (tx) => {
      const sanctionRecord = await this.repository.addSanction(tx, {
        vendorId,
        type,
        reasonCode,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: actorId,
      });

      // If the sanction type implies a status change, update the vendor
      if (newStatus) {
        await this.repository.updateVendorStatus(tx, vendorId, newStatus);
      }

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: `admin.vendor.sanction.${type.toLowerCase()}`,
        targetId: vendorId,
        meta: {
          reasonCode,
          expiresAt,
          sanctionId: sanctionRecord.id,
        },
      });

      return sanctionRecord;
    });
  }

  // I will add more methods here for other vendor endpoints.
}
