import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { UsersAdminService } from '@/features/admin/users/users.service';
import { addSanctionSchema } from '@/features/admin/users/users.dto';

const service = new UsersAdminService();

async function addSanction(req: AuthenticatedRequest) {
  const body = await req.json();

  const validation = addSanctionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    const result = await service.addSanction(validation.data, actorId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error adding sanction:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// OWNER, ADMIN, and MODERATOR can apply sanctions
export const POST = requireRole(['OWNER', 'ADMIN', 'MODERATOR'])(addSanction);
