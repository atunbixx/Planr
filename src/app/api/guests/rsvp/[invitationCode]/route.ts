/**
 * Guests API - Public RSVP endpoint
 * PUT /api/guests/rsvp/[invitationCode] - Update RSVP (public endpoint)
 */

import { NextRequest } from 'next/server'
import { GuestsApiHandler } from '@/features/guests'

const handler = new GuestsApiHandler()

export async function PUT(request: NextRequest, { params }: { params: { invitationCode: string } }) {
  return handler.updateRsvp(request, params)
}