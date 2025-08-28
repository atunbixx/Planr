import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { VendorsAdminService } from '@/features/admin/vendors/vendors.service';
import { featureVendorSchema } from '@/features/admin/vendors/vendors.dto';

const service = new VendorsAdminService();

interface PostParams {
  params: {
    id: string;
  };
}

async function featureVendor(req: AuthenticatedRequest, { params }: PostParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
  }

  const body = await req.json();
  const validation = featureVendorSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
  }

  const actorId = req.user!.id;

  try {
    const result = await service.featureVendor(id, validation.data, actorId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error featuring vendor ${id}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

export const POST = requireRole(['OWNER', 'ADMIN'])(featureVendor);
