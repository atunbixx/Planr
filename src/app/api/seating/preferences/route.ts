import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { seatingPlannerService } from '@/lib/api/seating-planner';

// GET /api/seating/preferences - Get seating preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const layoutId = request.nextUrl.searchParams.get('layoutId');
    if (!layoutId) {
      return NextResponse.json({ error: 'Layout ID required' }, { status: 400 });
    }

    const preferences = await seatingPlannerService().getSeatingPreferences(layoutId);
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching seating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seating preferences' },
      { status: 500 }
    );
  }
}

// POST /api/seating/preferences - Create seating preference
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { layoutId, guestId1, guestId2, preferenceType, notes, priority } = body;

    if (!layoutId || !preferenceType) {
      return NextResponse.json(
        { error: 'Layout ID and preference type required' },
        { status: 400 }
      );
    }

    // Validate preference type
    const validTypes = [
      'must_sit_together',
      'cannot_sit_together',
      'near_entrance',
      'near_bar',
      'near_dance_floor',
      'near_restroom',
      'away_from_speakers',
      'wheelchair_accessible'
    ];

    if (!validTypes.includes(preferenceType)) {
      return NextResponse.json(
        { error: 'Invalid preference type' },
        { status: 400 }
      );
    }

    // For relationship preferences, both guests are required
    if (['must_sit_together', 'cannot_sit_together'].includes(preferenceType)) {
      if (!guestId1 || !guestId2) {
        return NextResponse.json(
          { error: 'Both guest IDs required for relationship preferences' },
          { status: 400 }
        );
      }
    }

    const preference = await seatingPlannerService().createSeatingPreference({
      layoutId,
      guestId1,
      guestId2,
      preferenceType,
      notes,
      priority: priority || 1
    });
    
    return NextResponse.json(preference, { status: 201 });
  } catch (error) {
    console.error('Error creating seating preference:', error);
    return NextResponse.json(
      { error: 'Failed to create seating preference' },
      { status: 500 }
    );
  }
}

// PUT /api/seating/preferences/[id] - Update seating preference
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferenceId = request.nextUrl.pathname.split('/').pop();
    if (!preferenceId) {
      return NextResponse.json({ error: 'Preference ID required' }, { status: 400 });
    }

    const body = await request.json();
    const preference = await seatingPlannerService().updateSeatingPreference(
      preferenceId,
      body
    );
    
    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error updating seating preference:', error);
    return NextResponse.json(
      { error: 'Failed to update seating preference' },
      { status: 500 }
    );
  }
}

// DELETE /api/seating/preferences/[id] - Delete seating preference
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferenceId = request.nextUrl.pathname.split('/').pop();
    if (!preferenceId) {
      return NextResponse.json({ error: 'Preference ID required' }, { status: 400 });
    }

    await seatingPlannerService().deleteSeatingPreference(preferenceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting seating preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete seating preference' },
      { status: 500 }
    );
  }
}