import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { dayOfDashboardService } from '@/lib/api/day-of-dashboard';

// GET /api/dashboard/day-of - Get dashboard summary
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get couple ID from user
    const coupleId = request.headers.get('x-couple-id');
    if (!coupleId) {
      return NextResponse.json({ error: 'Couple ID required' }, { status: 400 });
    }

    const summary = await dayOfDashboardService().getDashboardSummary(coupleId);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}