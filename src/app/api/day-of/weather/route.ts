import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getWeatherService } from '@/lib/api/weather';
import { dayOfDashboardService } from '@/lib/api/day-of-dashboard-service';

// GET /api/day-of/weather - Get current weather for event location
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = request.nextUrl.searchParams.get('eventId');
    const latitude = request.nextUrl.searchParams.get('lat');
    const longitude = request.nextUrl.searchParams.get('lon');

    if (!eventId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Event ID and location coordinates required' },
        { status: 400 }
      );
    }

    const weatherService = getWeatherService();
    const weather = await weatherService.getCurrentWeather({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    // Store weather update in database
    await dayOfDashboardService().updateWeather(eventId, weather);
    
    return NextResponse.json(weather);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

// POST /api/day-of/weather/forecast - Get weather forecast
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, days = 5 } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location coordinates required' },
        { status: 400 }
      );
    }

    const weatherService = getWeatherService();
    const forecast = await weatherService.getHourlyForecast(
      { latitude, longitude },
      days
    );
    
    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast' },
      { status: 500 }
    );
  }
}