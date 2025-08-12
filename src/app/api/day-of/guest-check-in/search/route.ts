import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { dayOfDashboardService } from '@/lib/api/day-of-dashboard-service';

// GET /api/day-of/guest-check-in/search - Search guests
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = request.nextUrl.searchParams.get('eventId');
    const query = request.nextUrl.searchParams.get('q');

    if (!eventId || !query) {
      return NextResponse.json(
        { error: 'Event ID and search query required' },
        { status: 400 }
      );
    }

    const guests = await dayOfDashboardService().searchGuests(eventId, query);
    
    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error searching guests:', error);
    return NextResponse.json(
      { error: 'Failed to search guests' },
      { status: 500 }
    );
  }
}