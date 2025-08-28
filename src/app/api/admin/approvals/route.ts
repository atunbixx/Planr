import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { ApprovalsAdminService } from '@/features/admin/approvals/approvals.service';
import { getApprovalsSchema } from '@/features/admin/approvals/approvals.dto';

const service = new ApprovalsAdminService();

async function getApprovals(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validation = getApprovalsSchema.safeParse(queryParams);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  try {
    const result = await service.getApprovals(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export const GET = requireRole(['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'])(getApprovals);
