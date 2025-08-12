import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { dayOfDashboardService } from '@/lib/api/day-of-dashboard';

// GET /api/dashboard/day-of/timeline - Get all timeline events
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupleId = request.headers.get('x-couple-id');
    if (!coupleId) {
      return NextResponse.json({ error: 'Couple ID required' }, { status: 400 });
    }

    const timeline = await dayOfDashboardService().getTimeline(coupleId);
    
    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/day-of/timeline - Create new timeline event
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupleId = request.headers.get('x-couple-id');
    if (!coupleId) {
      return NextResponse.json({ error: 'Couple ID required' }, { status: 400 });
    }

    const body = await request.json();
    const event = await dayOfDashboardService().createTimelineEvent(coupleId, body);
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating timeline event:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline event' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/day-of/timeline - Reorder timeline events
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupleId = request.headers.get('x-couple-id');
    if (!coupleId) {
      return NextResponse.json({ error: 'Couple ID required' }, { status: 400 });
    }

    const { eventOrder } = await request.json();
    if (!Array.isArray(eventOrder)) {
      return NextResponse.json({ error: 'Event order must be an array' }, { status: 400 });
    }

    await dayOfDashboardService().reorderTimeline(coupleId, eventOrder);
    
    return NextResponse.json({ message: 'Timeline reordered successfully' });
  } catch (error) {
    console.error('Error reordering timeline:', error);
    return NextResponse.json(
      { error: 'Failed to reorder timeline' },
      { status: 500 }
    );
  }
}