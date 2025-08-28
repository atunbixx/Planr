import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { FlagsAdminService } from '@/features/admin/flags/flags.service';
import { upsertFlagSchema } from '@/features/admin/flags/flags.dto';

const service = new FlagsAdminService();

async function getFlags(req: AuthenticatedRequest) {
  try {
    const flags = await service.getFlags();
    return NextResponse.json(flags);
  } catch (error: any) {
    console.error('Error fetching flags:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

async function upsertFlag(req: AuthenticatedRequest) {
  const body = await req.json();
  const validation = upsertFlagSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    const result = await service.upsertFlag(validation.data, actorId);
    return NextResponse.json(result, { status: 200 }); // 200 for upsert is fine
  } catch (error: any) {
    console.error('Error upserting flag:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// All admins can view flags
export const GET = requireRole(['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'])(getFlags);
// Only top-level admins can change flags
export const POST = requireRole(['OWNER', 'ADMIN'])(upsertFlag);
