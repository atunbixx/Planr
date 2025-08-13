/**
 * Guests API - Main guest management
 * GET /api/guests - Get guests for current user's couple
 * POST /api/guests - Create guest
 */

import { NextRequest } from 'next/server'
import { GuestsApiHandler } from '@/features/guests'

const handler = new GuestsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getGuests(request)
}

export async function POST(request: NextRequest) {
  return handler.createGuest(request)
}