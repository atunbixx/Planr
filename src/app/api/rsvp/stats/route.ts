import { NextRequest } from 'next/server'
import { RSVPHandler } from '@/features/rsvp/handlers/rsvp.handler'
import { createUnauthorizedResponse } from '@/lib/api/response'

// Initialize handler
const rsvpHandler = new RSVPHandler()

/**
 * GET /api/rsvp/stats?inviteId=xxx
 * Get RSVP statistics for an invite
 * Requires authentication (vendor must own the invite)
 */
export async function GET(request: NextRequest) {
  // TODO: Add authentication middleware
  // For now, we'll allow access but this should be protected
  // in a real implementation
  
  // Example authentication check:
  // const session = await getServerSession(authOptions)
  // if (!session?.user) {
  //   return createUnauthorizedResponse('Authentication required')
  // }
  
  // TODO: Verify that the user owns the invite/vendor
  // const { searchParams } = new URL(request.url)
  // const inviteId = searchParams.get('inviteId')
  // const hasAccess = await verifyInviteAccess(session.user.id, inviteId)
  // if (!hasAccess) {
  //   return createForbiddenResponse('Access denied to this invite')
  // }

  return rsvpHandler.getStats(request)
}