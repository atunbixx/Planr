import { z } from 'zod';
import { VendorStatus, VerificationStatus } from '@prisma/client';

export const getVendorsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  verification: z.nativeEnum(VerificationStatus).optional(),
  flagged: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  scoreMin: z.coerce.number().int().min(0).optional(),
  scoreMax: z.coerce.number().int().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const verifyVendorSchema = z.object({
  approve: z.boolean(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const sanctionVendorSchema = z.object({
  type: z.enum(['WARN', 'THROTTLE', 'SUSPEND', 'BAN', 'SHADOW_LIMIT']),
  reasonCode: z.string().min(3),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().optional().nullable(),
});
