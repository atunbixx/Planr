import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { VendorsAdminService } from '@/features/admin/vendors/vendors.service';

const service = new VendorsAdminService();

interface GetParams {
  params: {
    id: string;
  };
}

async function getGraph(req: AuthenticatedRequest, { params }: GetParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
  }

  try {
    const result = await service.getLinkedAccountsGraph(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error fetching graph for vendor ${id}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

export const GET = requireRole(['OWNER', 'ADMIN', 'MODERATOR'])(getGraph);
