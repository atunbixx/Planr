import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { FlagsAdminService } from '@/features/admin/flags/flags.service';

const service = new FlagsAdminService();

interface DeleteParams {
  params: {
    key: string;
  };
}

async function deleteFlag(req: AuthenticatedRequest, { params }: DeleteParams) {
  const { key } = params;
  if (!key) {
    return NextResponse.json({ error: 'Flag key is required' }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    await service.deleteFlag(key, actorId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting flag ${key}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

export const DELETE = requireRole(['OWNER', 'ADMIN'])(deleteFlag);
