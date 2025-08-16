import jwt from 'jsonwebtoken';
import { createClient } from '@/lib/supabase/server';

interface WebSocketTokenPayload {
  userId: string;
  namespace: string;
  roomId: string;
  metadata?: Record<string, any>;
  issuedAt: number;
  expiresAt: number;
}

const JWT_SECRET = process.env.WEBSOCKET_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('WEBSOCKET_JWT_SECRET environment variable is required for WebSocket authentication');
}

export async function generateWebSocketToken(payload: Omit<WebSocketTokenPayload, 'issuedAt' | 'expiresAt'> & { metadata?: { issuedAt: number; expiresAt: number } }): Promise<string> {
  const tokenPayload: WebSocketTokenPayload = {
    ...payload,
    issuedAt: payload.metadata?.issuedAt || Date.now(),
    expiresAt: payload.metadata?.expiresAt || Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: '24h'
  });
}

export async function verifyWebSocketToken(token: string): Promise<WebSocketTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as WebSocketTokenPayload;
    
    // Check if token is expired
    if (decoded.expiresAt < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('WebSocket token verification failed:', error);
    return null;
  }
}

export function extractTokenFromHandshake(handshakeAuth: any): string | null {
  // Check various locations where the token might be sent
  if (handshakeAuth.token) {
    return handshakeAuth.token;
  }
  
  if (handshakeAuth.headers?.authorization) {
    const parts = handshakeAuth.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }
  
  return null;
}