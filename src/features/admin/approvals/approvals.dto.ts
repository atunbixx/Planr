import { z } from 'zod';
import { ApprovalType } from '@prisma/client';

export const getApprovalsSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  targetType: z.nativeEnum(ApprovalType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const decideApprovalSchema = z.object({
  approve: z.boolean(),
  notes: z.string().optional().nullable(),
});
