import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { AuditLogsAdminService } from '@/features/admin/audit-logs/audit-logs.service';
import { getAuditLogsSchema } from '@/features/admin/audit-logs/audit-logs.dto';

const service = new AuditLogsAdminService();

async function getAuditLogs(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validation = getAuditLogsSchema.safeParse(queryParams);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  try {
    const result = await service.getAuditLogs(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export const GET = requireRole(['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'])(getAuditLogs);
