import { z } from 'zod';
import { MessageChannel } from '@prisma/client';

export const createBroadcastSchema = z.object({
  title: z.string().min(5),
  body: z.string().min(10),
  channel: z.nativeEnum(MessageChannel),
  segmentJson: z.record(z.string(), z.any()), // A simple JSON object
});
