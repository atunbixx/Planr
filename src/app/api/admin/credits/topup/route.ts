import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { UsersAdminService } from '@/features/admin/users/users.service';
import { addCreditsSchema } from '@/features/admin/users/users.dto';

const service = new UsersAdminService();

async function addCredits(req: AuthenticatedRequest) {
  const body = await req.json();

  const validation = addCreditsSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id; // requireRole ensures user is present

  try {
    const result = await service.addCredits(validation.data, actorId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error adding credits:', error);
    // TODO: Check for specific errors, like idempotency key conflict
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// Only OWNER and ADMIN can add/remove credits
export const POST = requireRole(['OWNER', 'ADMIN'])(addCredits);
