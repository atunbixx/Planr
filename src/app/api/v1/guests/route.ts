import { NextRequest, NextResponse } from 'next/server';
import { GuestService } from '@/features/guests/service/guest.service';
import { GuestCreateIncoming, mapZodErrors } from '@/server/guests/guest.contract';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with unified schema
    const validation = GuestCreateIncoming.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { errors: mapZodErrors(validation.error) },
        { 
          status: 400,
          headers: { 'X-Handler': 'app/api/v1/guests' }
        }
      );
    }
    
    const unifiedGuest = validation.data;
    
    // Create guest using the service
    const guestService = new GuestService();
    const guest = await guestService.createGuest(unifiedGuest);
    
    return NextResponse.json(
      guest,
      { 
        status: 201,
        headers: { 'X-Handler': 'app/api/v1/guests' }
      }
    );
    
  } catch (error) {
    console.error('Guest creation error:', error);
    
    if (error instanceof Error && error.message === 'Couple profile not found') {
      return NextResponse.json(
        { error: 'Couple profile not found. Please complete onboarding first.' },
        { 
          status: 404,
          headers: { 'X-Handler': 'app/api/v1/guests' }
        }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create guest' },
      { 
        status: 500,
        headers: { 'X-Handler': 'app/api/v1/guests' }
      }
    );
  }
}

export async function GET() {
  // Return 410 Gone for GET requests to indicate this is a POST-only endpoint
  return NextResponse.json(
    { 
      error: 'Use POST /api/v1/guests to create guests',
      documentation: '/api/docs' 
    },
    { 
      status: 410,
      headers: { 
        'X-Handler': 'app/api/v1/guests',
        'Allow': 'POST'
      }
    }
  );
}