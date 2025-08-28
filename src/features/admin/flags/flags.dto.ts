import { z } from 'zod';
import { FeatureFlagType } from '@prisma/client';

export const upsertFlagSchema = z.object({
  key: z.string().min(3).regex(/^[a-z0-9-]+$/, { message: 'Key must be lowercase, numbers, and hyphens only' }),
  type: z.nativeEnum(FeatureFlagType),
  enabled: z.boolean().optional().nullable(),
  percent: z.number().int().min(0).max(100).optional().nullable(),
  rulesJson: z.record(z.string(), z.any()).optional().nullable(),
});

export const deleteFlagSchema = z.object({
  key: z.string(),
});
