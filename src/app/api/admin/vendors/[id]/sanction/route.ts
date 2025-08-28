import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { VendorsAdminService } from '@/features/admin/vendors/vendors.service';
import { sanctionVendorSchema } from '@/features/admin/vendors/vendors.dto';

const service = new VendorsAdminService();

interface PostParams {
  params: {
    id: string;
  };
}

async function sanctionVendor(req: AuthenticatedRequest, { params }: PostParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
  }

  const body = await req.json();
  const validation = sanctionVendorSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    const result = await service.sanctionVendor(id, validation.data, actorId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error(`Error sanctioning vendor ${id}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

export const POST = requireRole(['OWNER', 'ADMIN', 'MODERATOR'])(sanctionVendor);
