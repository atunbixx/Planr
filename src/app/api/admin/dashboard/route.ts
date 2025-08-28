import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { DashboardAdminService } from '@/features/admin/dashboard/dashboard.service';

const service = new DashboardAdminService();

async function getDashboardStats(req: AuthenticatedRequest) {
  try {
    const stats = await service.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

export const GET = requireRole(['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'])(getDashboardStats);
