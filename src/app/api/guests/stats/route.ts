/**
 * Guests API - Statistics endpoint
 * GET /api/guests/stats - Get guest statistics
 */

import { NextRequest } from 'next/server'
import { GuestsApiHandler } from '@/features/guests'

const handler = new GuestsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getGuestStats(request)
}