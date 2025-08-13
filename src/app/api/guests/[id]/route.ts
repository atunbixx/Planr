/**
 * Guests API - Individual guest management
 * GET /api/guests/[id] - Get guest by ID
 * PATCH /api/guests/[id] - Update guest
 * DELETE /api/guests/[id] - Delete guest
 */

import { NextRequest } from 'next/server'
import { GuestsApiHandler } from '@/features/guests'

const handler = new GuestsApiHandler()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return handler.getGuestById(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return handler.updateGuest(request, params)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return handler.deleteGuest(request, params)
}