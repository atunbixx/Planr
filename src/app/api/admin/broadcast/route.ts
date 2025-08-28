import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { BroadcastsAdminService } from '@/features/admin/broadcasts/broadcasts.service';
import { createBroadcastSchema } from '@/features/admin/broadcasts/broadcasts.dto';

const service = new BroadcastsAdminService();

async function createBroadcast(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  const body = await req.json();
  const validation = createBroadcastSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    const result = await service.createBroadcast(validation.data, actorId, dryRun);
    return NextResponse.json(result, { status: result.dryRun ? 200 : 201 });
  } catch (error: any) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// Only OWNER and ADMIN can create broadcasts
export const POST = requireRole(['OWNER', 'ADMIN'])(createBroadcast);
