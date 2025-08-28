import { z } from 'zod';

export const getAuditLogsSchema = z.object({
  actorId: z.string().optional(),
  action: z.string().optional(),
  targetId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
