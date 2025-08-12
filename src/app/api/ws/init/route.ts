import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { generateWebSocketToken } from '@/lib/websocket/auth';

// POST /api/ws/init - Initialize WebSocket connection
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();
    const { namespace, roomId, metadata } = body;

    if (!namespace || !roomId) {
      return NextResponse.json(
        { error: 'Namespace and room ID required' },
        { status: 400 }
      );
    }

    // Validate namespace
    const validNamespaces = ['seating', 'day-of-dashboard'];
    if (!validNamespaces.includes(namespace)) {
      return NextResponse.json(
        { error: 'Invalid namespace' },
        { status: 400 }
      );
    }

    // Generate WebSocket authentication token
    const token = await generateWebSocketToken({
      userId,
      namespace,
      roomId,
      metadata: {
        ...metadata,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }
    });

    // Return connection details
    return NextResponse.json({
      token,
      url: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
      namespace,
      roomId,
      protocols: ['websocket'],
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    });
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    return NextResponse.json(
      { error: 'Failed to initialize WebSocket connection' },
      { status: 500 }
    );
  }
}

// GET /api/ws/init/status - Check WebSocket server status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, this would check actual WebSocket server status
    // For now, return mock status
    return NextResponse.json({
      status: 'online',
      version: '1.0.0',
      namespaces: {
        seating: {
          active: true,
          rooms: 5,
          connections: 12
        },
        'day-of-dashboard': {
          active: true,
          rooms: 3,
          connections: 8
        }
      },
      uptime: 86400, // 24 hours in seconds
      lastRestart: new Date(Date.now() - 86400000).toISOString()
    });
  } catch (error) {
    console.error('Error checking WebSocket status:', error);
    return NextResponse.json(
      { error: 'Failed to check WebSocket status' },
      { status: 500 }
    );
  }
}