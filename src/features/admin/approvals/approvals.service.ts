import { ApprovalsAdminRepository } from './approvals.repository';
import type { getApprovalsSchema, decideApprovalSchema } from './approvals.dto';
import type { z } from 'zod';

type GetApprovalsFilters = z.infer<typeof getApprovalsSchema>;
type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;

export class ApprovalsAdminService {
  private repository: ApprovalsAdminRepository;

  constructor() {
    this.repository = new ApprovalsAdminRepository();
  }

  async getApprovals(filters: GetApprovalsFilters) {
    return this.repository.findMany(filters);
  }

  async decideApproval(id: string, input: DecideApprovalInput, actorId: string) {
    const { approve, notes } = input;
    const newStatus = approve ? 'APPROVED' : 'REJECTED';

    return this.repository.withTransaction(async (tx) => {
      // 1. Find the approval item and ensure it's pending
      const approval = await this.repository.findById(id);
      if (!approval) {
        throw new Error('Approval item not found.');
      }
      if (approval.status !== 'PENDING') {
        throw new Error(`Approval item is already in status: ${approval.status}`);
      }

      // 2. Update the approval queue item
      const updatedApproval = await this.repository.updateStatus(tx, id, newStatus, actorId, notes);

      // 3. If approved, update the target entity's status (example for VENDOR)
      if (updatedApproval.status === 'APPROVED') {
        if (updatedApproval.targetType === 'VENDOR') {
          await tx.vendor.update({
            where: { id: updatedApproval.targetId },
            data: { status: 'ACTIVE' },
          });
        }
        // TODO: Add logic for other approval types like LISTING, KYC...
      }

      // 4. Log the audit event
      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: `admin.approval.${newStatus.toLowerCase()}`,
        targetId: approval.targetId,
        meta: {
          approvalId: approval.id,
          approvalType: approval.targetType,
          notes: notes,
        },
      });

      return updatedApproval;
    });
  }
}
