import { UsersAdminRepository } from './users.repository';
import type { addCreditsSchema, addSanctionSchema, getUsersSchema } from './users.dto';
import type { z } from 'zod';

type GetUsersFilters = z.infer<typeof getUsersSchema>;
type AddCreditsInput = z.infer<typeof addCreditsSchema>;
type AddSanctionInput = z.infer<typeof addSanctionSchema>;

export class UsersAdminService {
  private repository: UsersAdminRepository;

  constructor() {
    this.repository = new UsersAdminRepository();
  }

  async getUsers(filters: GetUsersFilters) {
    // Input validation is expected to happen at the API handler level
    return this.repository.findUsers(filters);
  }

  async addCredits(input: AddCreditsInput, actorId: string) {
    // Using the transaction wrapper from BaseRepository
    return this.repository.withTransaction(async (tx) => {
      const creditRecord = await this.repository.addCredits(tx, {
        userId: input.userId,
        delta: input.delta,
        reason: input.reason,
        type: input.delta > 0 ? 'MANUAL' : 'ADJUSTMENT', // Example logic
        createdBy: actorId,
      });

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: 'admin.credits.add',
        targetId: input.userId,
        meta: {
          delta: input.delta,
          reason: input.reason,
          creditRecordId: creditRecord.id,
        },
      });

      return creditRecord;
    });
  }

  async addSanction(input: AddSanctionInput, actorId: string) {
    return this.repository.withTransaction(async (tx) => {
      const sanctionRecord = await this.repository.addSanction(tx, {
        userId: input.userId,
        type: input.type,
        reasonCode: input.reasonCode,
        notes: input.notes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdBy: actorId,
      });

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: `admin.sanction.${input.type.toLowerCase()}`,
        targetId: input.userId,
        meta: {
          reasonCode: input.reasonCode,
          expiresAt: input.expiresAt,
          sanctionId: sanctionRecord.id,
        },
      });

      return sanctionRecord;
    });
  }
}
