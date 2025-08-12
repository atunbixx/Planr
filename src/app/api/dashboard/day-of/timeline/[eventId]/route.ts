import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { dayOfDashboardService } from '@/lib/api/day-of-dashboard';

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

// PUT /api/dashboard/day-of/timeline/[eventId] - Update timeline event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const event = await dayOfDashboardService().updateTimelineEvent(eventId, body);
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating timeline event:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline event' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/day-of/timeline/[eventId] - Delete timeline event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;
    await dayOfDashboardService().deleteTimelineEvent(eventId);
    
    return NextResponse.json({ message: 'Timeline event deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    return NextResponse.json(
      { error: 'Failed to delete timeline event' },
      { status: 500 }
    );
  }
}