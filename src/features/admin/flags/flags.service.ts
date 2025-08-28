import { FlagsAdminRepository } from './flags.repository';
import type { upsertFlagSchema } from './flags.dto';
import type { z } from 'zod';

type UpsertFlagInput = z.infer<typeof upsertFlagSchema>;

export class FlagsAdminService {
  private repository: FlagsAdminRepository;

  constructor() {
    this.repository = new FlagsAdminRepository();
  }

  async getFlags() {
    return this.repository.findMany();
  }

  async upsertFlag(input: UpsertFlagInput, actorId: string) {
    return this.repository.withTransaction(async (tx) => {
      const flag = await this.repository.upsert(tx, input);

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: 'admin.flag.upsert',
        targetId: flag.key,
        meta: {
          ...input,
        },
      });

      return flag;
    });
  }

  async deleteFlag(key: string, actorId: string) {
    return this.repository.withTransaction(async (tx) => {
      const flag = await this.repository.delete(tx, key);

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: 'admin.flag.delete',
        targetId: flag.key,
      });

      return flag;
    });
  }
}
