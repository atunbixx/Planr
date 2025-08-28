import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { UsersAdminService } from '@/features/admin/users/users.service';
import { getUsersSchema } from '@/features/admin/users/users.dto';

const service = new UsersAdminService();

async function getUsers(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validation = getUsersSchema.safeParse(queryParams);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  try {
    const result = await service.getUsers(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export const GET = requireRole(['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'])(getUsers);
