import { BroadcastsAdminRepository } from './broadcasts.repository';
import type { createBroadcastSchema } from './broadcasts.dto';
import type { z } from 'zod';

type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;

export class BroadcastsAdminService {
  private repository: BroadcastsAdminRepository;

  constructor() {
    this.repository = new BroadcastsAdminRepository();
  }

  async createBroadcast(input: CreateBroadcastInput, actorId: string, dryRun: boolean = false) {
    const { title, body, channel, segmentJson } = input;

    const audienceCount = await this.repository.countUsersInSegment(segmentJson);

    if (dryRun) {
      return {
        dryRun: true,
        audienceCount,
        message: 'This is a dry run. No broadcast will be sent.',
      };
    }

    if (audienceCount === 0) {
      // No need to create a broadcast if no one will receive it
      return {
        dryRun: false,
        audienceCount: 0,
        message: 'No users in the selected segment. Broadcast not created.',
      }
    }

    return this.repository.withTransaction(async (tx) => {
      const broadcastRecord = await this.repository.createBroadcast(tx, {
        title,
        body,
        channel,
        segmentJson,
        sentCount: audienceCount,
        createdBy: actorId,
      });

      await this.repository.logAudit(tx, {
        actorId: actorId,
        action: 'admin.broadcast.create',
        targetId: broadcastRecord.id,
        meta: {
          title,
          channel,
          segment: segmentJson,
          audienceCount,
        },
      });

      // In a real application, you would now trigger a background job
      // to send the actual messages to the `audienceCount` users.

      return { ...broadcastRecord, dryRun: false };
    });
  }
}
