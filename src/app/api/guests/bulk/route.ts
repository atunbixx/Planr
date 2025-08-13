/**
 * Guests API - Bulk operations
 * POST /api/guests/bulk - Bulk create guests (import)
 * PATCH /api/guests/bulk - Bulk update guests
 */

import { NextRequest } from 'next/server'
import { GuestsApiHandler } from '@/features/guests'

const handler = new GuestsApiHandler()

export async function POST(request: NextRequest) {
  return handler.bulkCreateGuests(request)
}

export async function PATCH(request: NextRequest) {
  return handler.bulkUpdateGuests(request)
}