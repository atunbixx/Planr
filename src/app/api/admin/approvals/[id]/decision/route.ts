import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { ApprovalsAdminService } from '@/features/admin/approvals/approvals.service';
import { decideApprovalSchema } from '@/features/admin/approvals/approvals.dto';

const service = new ApprovalsAdminService();

interface PostParams {
  params: {
    id: string;
  };
}

async function decideApproval(req: AuthenticatedRequest, { params }: PostParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Approval ID is required' }, { status: 400 });
  }

  const body = await req.json();
  const validation = decideApprovalSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    const result = await service.decideApproval(id, validation.data, actorId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error deciding on approval ${id}:`, error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

export const POST = requireRole(['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'])(decideApproval);
