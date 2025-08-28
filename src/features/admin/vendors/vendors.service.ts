import { VendorsAdminRepository } from './vendors.repository';
import { FlagsAdminService } from '@/features/admin/flags/flags.service';
import type { getVendorsSchema, verifyVendorSchema, sanctionVendorSchema, addVendorCreditsSchema, featureVendorSchema } from './vendors.dto';
import type { z } from 'zod';

type GetVendorsFilters = z.infer<typeof getVendorsSchema>;
type VerifyVendorInput = z.infer<typeof verifyVendorSchema>;
type SanctionVendorInput = z.infer<typeof sanctionVendorSchema>;
type AddCreditsInput = z.infer<typeof addVendorCreditsSchema>;
type FeatureVendorInput = z.infer<typeof featureVendorSchema>;


export class VendorsAdminService {
  private repository: VendorsAdminRepository;
  private flagsService: FlagsAdminService;

  constructor() {
    this.repository = new VendorsAdminRepository();
    this.flagsService = new FlagsAdminService();
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

  async addPromoCredits(
    vendorId: string,
    input: { delta: number; reason: string; },
    actorId: string
  ) {
    return this.repository.withTransaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({
        where: { id: vendorId },
        select: { ownerUserId: true },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      const creditRecord = await this.repository.addCredits(tx, {
        userId: vendor.ownerUserId,
        delta: input.delta,
        reason: input.reason,
        type: 'PROMO',
        createdBy: actorId,
      });

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: 'admin.vendor.credits.add',
        targetId: vendorId,
        meta: {
          ...input,
          ownerUserId: vendor.ownerUserId,
          creditRecordId: creditRecord.id,
        },
      });

      return creditRecord;
    });
  }

  async getLinkedAccountsGraph(vendorId: string) {
    const { primarySignal, matchingSignals } = await this.repository.findVendorsWithMatchingSignals(vendorId);

    if (!primarySignal) {
      return { nodes: [], edges: [] };
    }

    const primaryVendorNode = { id: vendorId, label: 'Primary Vendor', type: 'primary' };
    const nodes = [primaryVendorNode];
    const edges: { from: string; to: string; label: string; confidence: 'High' | 'Med-High' | 'Low-Med' }[] = [];

    for (const match of matchingSignals) {
      if (!match.vendor) continue;
      if (!nodes.find(n => n.id === match.vendorId)) {
        nodes.push({ id: match.vendorId, label: match.vendor.name, type: 'linked' });
      }

      let confidence: 'High' | 'Med-High' | 'Low-Med' | null = null;
      let reasons: string[] = [];

      if (match.phoneHash && match.phoneHash === primarySignal.phoneHash) {
        confidence = 'High';
        reasons.push('Shared Phone');
      }
      if (match.bankHash && match.bankHash === primarySignal.bankHash) {
        confidence = 'High';
        reasons.push('Shared Bank Account');
      }

      const hasDeviceAndIpMatch = match.deviceHash && match.deviceHash === primarySignal.deviceHash && match.ipHash && match.ipHash === primarySignal.ipHash;
      if (hasDeviceAndIpMatch) {
        if (confidence !== 'High') confidence = 'Med-High';
        reasons.push('Shared Device & IP');
      }

      if (match.addressHash && match.addressHash === primarySignal.addressHash) {
        if (!confidence) confidence = 'Low-Med';
        reasons.push('Shared Address');
      }

      if (confidence) {
        edges.push({ from: vendorId, to: match.vendorId, label: reasons.join(', '), confidence });
      }
    }

    return { nodes, edges };
  }

  async featureVendor(
    vendorId: string,
    input: FeatureVendorInput,
    actorId: string
  ) {
    const { durationDays, regionRule } = input;
    const key = `vendor-featured-${vendorId}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const rulesJson = {
      expiresAt: expiresAt.toISOString(),
      ...(regionRule && { region: regionRule }),
    };

    const flag = await this.flagsService.upsertFlag({
      key,
      type: 'BOOLEAN',
      enabled: true,
      rulesJson,
    }, actorId);

    return this.repository.withTransaction(async (tx) => {
      await this.repository.logAudit(tx, {
        actorId,
        action: 'admin.vendor.feature',
        targetId: vendorId,
        meta: {
          durationDays,
          regionRule,
          flagKey: key,
          expiresAt: expiresAt.toISOString(),
        }
      });
      return { flag };
    });
  }
}
