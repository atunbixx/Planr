import { z } from 'zod';
import { Role, SanctionType } from '@prisma/client';

export const getUsersSchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  plan: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const addCreditsSchema = z.object({
  userId: z.string().uuid(),
  delta: z.number().int().refine(d => d !== 0, { message: 'Delta cannot be zero' }),
  reason: z.string().min(3, { message: 'Reason must be at least 3 characters long' }),
  idempotencyKey: z.string().uuid().optional(),
});

export const addSanctionSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(SanctionType),
  reasonCode: z.string().min(3),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().optional().nullable(),
});
